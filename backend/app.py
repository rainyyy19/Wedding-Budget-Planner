import os
import io
import csv
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from database import (
    get_db_connection, init_db, DEFAULT_CATEGORY_TEMPLATES, DEFAULT_STARTER_TASKS
)
from seed_demo import seed_demo_user, DEMO_EMAIL, DEMO_PASSWORD

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
app = Flask(__name__, static_folder=frontend_dist, static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))
# Ensure database schema is initialized
init_db()
# Enable CORS for development frontend
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    index_file = os.path.join(app.static_folder, 'index.html')
    if os.path.exists(index_file):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({"message": "Aura & Vow API Server Running. Frontend dist not built yet."})

# Helper to verify auth token
def get_current_user_id():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM auth_tokens WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return row["user_id"]
    return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({"error": "Unauthorized. Please sign in or use Demo Mode."}), 401
        return f(user_id, *args, **kwargs)
    return decorated_function

# ----------------- AUTHENTICATION ROUTES ----------------- #

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    partner1 = data.get("partner1_name", "Partner 1").strip()
    partner2 = data.get("partner2_name", "Partner 2").strip()
    wedding_date = data.get("wedding_date")
    city = data.get("city", "Mumbai").strip()
    guest_count = int(data.get("guest_count", 150))
    wedding_style = data.get("wedding_style", "Classic Romance").strip()
    currency_code = data.get("currency_code", "INR")
    currency_symbol = data.get("currency_symbol", "₹")
    total_budget = float(data.get("total_budget", 2000000.0))
    contingency_percent = float(data.get("contingency_percent", 10.0))

    pwd_hash = generate_password_hash(password)
    token = secrets.token_hex(24)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO users (
                email, password_hash, partner1_name, partner2_name, wedding_date,
                city, guest_count, wedding_style, currency_code, currency_symbol,
                total_budget, contingency_percent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            email, pwd_hash, partner1, partner2, wedding_date,
            city, guest_count, wedding_style, currency_code, currency_symbol,
            total_budget, contingency_percent
        ))
        user_id = cursor.lastrowid

        # Store auth token
        cursor.execute("INSERT INTO auth_tokens (token, user_id) VALUES (?, ?)", (token, user_id))

        # Generate default categories with proportional allocations
        for cat in DEFAULT_CATEGORY_TEMPLATES:
            allocated = round((cat["percent"] / 100.0) * total_budget, 2)
            cursor.execute('''
                INSERT INTO categories (user_id, name, icon, color, allocation_percent, allocated_amount, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, cat["name"], cat["icon"], cat["color"], cat["percent"], allocated, cat["description"]))

        # Seed initial starter checklist
        for t in DEFAULT_STARTER_TASKS:
            due_str = None
            if wedding_date:
                try:
                    wdate = datetime.strptime(wedding_date, "%Y-%m-%d")
                    due_str = (wdate + timedelta(days=t["offset_days"])).strftime("%Y-%m-%d")
                except Exception:
                    due_str = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            else:
                due_str = (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d")

            cursor.execute('''
                INSERT INTO tasks (user_id, title, category, due_date, priority, is_completed, notes)
                VALUES (?, ?, ?, ?, ?, 0, 'Starter wedding milestone')
            ''', (user_id, t["title"], t["category"], due_str, t["priority"]))

        conn.commit()

        # Fetch newly created user info
        cursor.execute("SELECT id, email, partner1_name, partner2_name, wedding_date, city, guest_count, wedding_style, currency_code, currency_symbol, total_budget, contingency_percent FROM users WHERE id = ?", (user_id,))
        user_info = dict(cursor.fetchone())
        conn.close()

        return jsonify({
            "token": token,
            "user": user_info,
            "message": "Account created successfully. Welcome to Aura & Vow!"
        }), 201

    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "An account with this email address already exists."}), 409
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"error": "Invalid email or password."}), 401

    token = secrets.token_hex(24)
    cursor.execute("INSERT INTO auth_tokens (token, user_id) VALUES (?, ?)", (token, user["id"]))
    conn.commit()

    user_info = {
        "id": user["id"],
        "email": user["email"],
        "partner1_name": user["partner1_name"],
        "partner2_name": user["partner2_name"],
        "wedding_date": user["wedding_date"],
        "city": user["city"],
        "guest_count": user["guest_count"],
        "wedding_style": user["wedding_style"],
        "currency_code": user["currency_code"],
        "currency_symbol": user["currency_symbol"],
        "total_budget": user["total_budget"],
        "contingency_percent": user["contingency_percent"]
    }
    conn.close()

    return jsonify({"token": token, "user": user_info, "message": "Signed in successfully."})

@app.route("/api/auth/demo", methods=["POST"])
def login_demo():
    # Seeds or verifies the demo user and returns active demo session
    token = seed_demo_user()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, partner1_name, partner2_name, wedding_date, city, guest_count, wedding_style, currency_code, currency_symbol, total_budget, contingency_percent FROM users WHERE email = ?", (DEMO_EMAIL,))
    user_info = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "token": token,
        "user": user_info,
        "is_demo": True,
        "message": "Welcome to the live demo wedding for Aanya & Kabir!"
    })

@app.route("/api/auth/me", methods=["GET"])
@login_required
def get_me(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, partner1_name, partner2_name, wedding_date, city, guest_count, wedding_style, currency_code, currency_symbol, total_budget, contingency_percent FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": dict(user)})

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM auth_tokens WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return jsonify({"message": "Logged out successfully."})

# ----------------- WEDDING SETUP & BUDGET CALCULATOR ----------------- #

@app.route("/api/setup", methods=["GET"])
@login_required
def get_setup(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())
    user.pop("password_hash", None)

    cursor.execute("SELECT * FROM contributions WHERE user_id = ? ORDER BY id ASC", (user_id,))
    contributions = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return jsonify({"setup": user, "contributions": contributions})

@app.route("/api/setup", methods=["PUT"])
@login_required
def update_setup(user_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    partner1 = data.get("partner1_name")
    partner2 = data.get("partner2_name")
    wedding_date = data.get("wedding_date")
    city = data.get("city")
    guest_count = int(data.get("guest_count", 150))
    wedding_style = data.get("wedding_style")
    currency_code = data.get("currency_code", "INR")
    currency_symbol = data.get("currency_symbol", "₹")
    total_budget = float(data.get("total_budget", 2000000.0))
    contingency_percent = float(data.get("contingency_percent", 10.0))
    recalculate_categories = data.get("recalculate_categories", False)

    cursor.execute('''
        UPDATE users SET
            partner1_name = COALESCE(?, partner1_name),
            partner2_name = COALESCE(?, partner2_name),
            wedding_date = COALESCE(?, wedding_date),
            city = COALESCE(?, city),
            guest_count = ?,
            wedding_style = COALESCE(?, wedding_style),
            currency_code = ?,
            currency_symbol = ?,
            total_budget = ?,
            contingency_percent = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (partner1, partner2, wedding_date, city, guest_count, wedding_style, currency_code, currency_symbol, total_budget, contingency_percent, user_id))

    # If requested, recalculate allocated_amounts based on percentages
    if recalculate_categories:
        cursor.execute("SELECT id, allocation_percent FROM categories WHERE user_id = ?", (user_id,))
        cats = cursor.fetchall()
        for cat in cats:
            new_allocated = round((cat["allocation_percent"] / 100.0) * total_budget, 2)
            cursor.execute("UPDATE categories SET allocated_amount = ? WHERE id = ?", (new_allocated, cat["id"]))

    conn.commit()

    cursor.execute("SELECT id, email, partner1_name, partner2_name, wedding_date, city, guest_count, wedding_style, currency_code, currency_symbol, total_budget, contingency_percent FROM users WHERE id = ?", (user_id,))
    updated_user = dict(cursor.fetchone())
    conn.close()

    return jsonify({"user": updated_user, "message": "Wedding details updated successfully."})

# ----------------- CONTRIBUTIONS ----------------- #

@app.route("/api/contributions", methods=["GET"])
@login_required
def get_contributions(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM contributions WHERE user_id = ? ORDER BY id ASC", (user_id,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"contributions": rows})

@app.route("/api/contributions", methods=["POST"])
@login_required
def add_contribution(user_id):
    data = request.get_json() or {}
    name = data.get("contributor_name", "").strip()
    relationship = data.get("relationship", "Other").strip()
    amount = float(data.get("amount", 0.0))
    is_received = int(data.get("is_received", 1))
    notes = data.get("notes", "").strip()

    if not name or amount <= 0:
        return jsonify({"error": "Contributor name and a valid amount are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO contributions (user_id, contributor_name, relationship, amount, is_received, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, name, relationship, amount, is_received, notes))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM contributions WHERE id = ?", (new_id,))
    item = dict(cursor.fetchone())
    conn.close()

    return jsonify({"contribution": item, "message": "Contribution added."}), 201

@app.route("/api/contributions/<int:cid>", methods=["PUT"])
@login_required
def update_contribution(user_id, cid):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE contributions SET
            contributor_name = COALESCE(?, contributor_name),
            relationship = COALESCE(?, relationship),
            amount = COALESCE(?, amount),
            is_received = COALESCE(?, is_received),
            notes = COALESCE(?, notes)
        WHERE id = ? AND user_id = ?
    ''', (data.get("contributor_name"), data.get("relationship"), data.get("amount"), data.get("is_received"), data.get("notes"), cid, user_id))
    conn.commit()
    cursor.execute("SELECT * FROM contributions WHERE id = ?", (cid,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Contribution not found."}), 404
    return jsonify({"contribution": dict(row), "message": "Contribution updated."})

@app.route("/api/contributions/<int:cid>", methods=["DELETE"])
@login_required
def delete_contribution(user_id, cid):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contributions WHERE id = ? AND user_id = ?", (cid, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Contribution deleted."})

# ----------------- CATEGORIES & ALLOCATIONS ----------------- #

@app.route("/api/categories", methods=["GET"])
@login_required
def get_categories(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Join categories with expenses to compute real-time aggregates
    cursor.execute('''
        SELECT
            c.id, c.name, c.icon, c.color, c.allocation_percent, c.allocated_amount, c.description,
            COALESCE(SUM(e.estimated_amount), 0.0) AS total_estimated,
            COALESCE(SUM(e.actual_amount), 0.0) AS total_actual,
            COALESCE(SUM(e.amount_paid), 0.0) AS total_paid,
            COUNT(e.id) AS expense_count
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id
        WHERE c.user_id = ?
        GROUP BY c.id
        ORDER BY c.allocated_amount DESC, c.id ASC
    ''', (user_id,))
    rows = []
    for r in cursor.fetchall():
        d = dict(r)
        d["pending_amount"] = round(d["total_actual"] - d["total_paid"], 2)
        d["remaining_balance"] = round(d["allocated_amount"] - d["total_actual"], 2)
        d["is_over_budget"] = d["total_actual"] > d["allocated_amount"]
        d["spending_pct"] = round((d["total_actual"] / d["allocated_amount"] * 100), 1) if d["allocated_amount"] > 0 else 0.0
        rows.append(d)

    conn.close()
    return jsonify({"categories": rows})

@app.route("/api/categories/<int:cat_id>", methods=["PUT"])
@login_required
def update_category(user_id, cat_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    alloc_pct = data.get("allocation_percent")
    alloc_amt = data.get("allocated_amount")
    name = data.get("name")
    icon = data.get("icon")
    color = data.get("color")
    description = data.get("description")

    # Get user total budget
    cursor.execute("SELECT total_budget FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    total_budget = user["total_budget"] if user else 2000000.0

    if alloc_pct is not None and alloc_amt is None:
        alloc_amt = round((float(alloc_pct) / 100.0) * total_budget, 2)
    elif alloc_amt is not None and alloc_pct is None:
        alloc_pct = round((float(alloc_amt) / total_budget * 100.0), 2) if total_budget > 0 else 0.0

    cursor.execute('''
        UPDATE categories SET
            name = COALESCE(?, name),
            icon = COALESCE(?, icon),
            color = COALESCE(?, color),
            allocation_percent = COALESCE(?, allocation_percent),
            allocated_amount = COALESCE(?, allocated_amount),
            description = COALESCE(?, description)
        WHERE id = ? AND user_id = ?
    ''', (name, icon, color, alloc_pct, alloc_amt, description, cat_id, user_id))

    conn.commit()
    cursor.execute("SELECT * FROM categories WHERE id = ?", (cat_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Category not found."}), 404
    return jsonify({"category": dict(row), "message": "Category updated."})

@app.route("/api/categories", methods=["POST"])
@login_required
def create_category(user_id):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    icon = data.get("icon", "FolderHeart")
    color = data.get("color", "#802F48")
    alloc_pct = float(data.get("allocation_percent", 0.0))
    description = data.get("description", "")

    if not name:
        return jsonify({"error": "Category name is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT total_budget FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    total_budget = user["total_budget"] if user else 2000000.0

    alloc_amt = round((alloc_pct / 100.0) * total_budget, 2)

    cursor.execute('''
        INSERT INTO categories (user_id, name, icon, color, allocation_percent, allocated_amount, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, name, icon, color, alloc_pct, alloc_amt, description))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM categories WHERE id = ?", (new_id,))
    item = dict(cursor.fetchone())
    conn.close()

    return jsonify({"category": item, "message": "Custom category added."}), 201

@app.route("/api/categories/<int:cat_id>", methods=["DELETE"])
@login_required
def delete_category(user_id, cat_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM categories WHERE id = ? AND user_id = ?", (cat_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Category deleted."})

# ----------------- BUDGET OVERVIEW & SUMMARY ----------------- #

@app.route("/api/budget/summary", methods=["GET"])
@login_required
def get_budget_summary(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())

    total_budget = float(user.get("total_budget", 0.0))
    contingency_percent = float(user.get("contingency_percent", 10.0))
    contingency_fund = round((contingency_percent / 100.0) * total_budget, 2)

    # Calculate contributions
    cursor.execute("SELECT COALESCE(SUM(amount), 0.0) as total, COALESCE(SUM(CASE WHEN is_received = 1 THEN amount ELSE 0 END), 0.0) as received FROM contributions WHERE user_id = ?", (user_id,))
    contrib = cursor.fetchone()
    total_contributions = float(contrib["total"])
    received_contributions = float(contrib["received"])

    # Calculate allocated categories total
    cursor.execute("SELECT COALESCE(SUM(allocated_amount), 0.0) as total_allocated, COALESCE(SUM(allocation_percent), 0.0) as total_percent FROM categories WHERE user_id = ?", (user_id,))
    cat_summary = cursor.fetchone()
    total_allocated = float(cat_summary["total_allocated"])
    total_allocated_percent = float(cat_summary["total_percent"])

    # Calculate expenses totals
    cursor.execute('''
        SELECT
            COALESCE(SUM(estimated_amount), 0.0) as total_estimated,
            COALESCE(SUM(actual_amount), 0.0) as total_actual,
            COALESCE(SUM(amount_paid), 0.0) as total_paid,
            COUNT(id) as total_count
        FROM expenses
        WHERE user_id = ?
    ''', (user_id,))
    exp_summary = cursor.fetchone()
    total_estimated = float(exp_summary["total_estimated"])
    total_actual = float(exp_summary["total_actual"])
    total_paid = float(exp_summary["total_paid"])
    expense_count = int(exp_summary["total_count"])

    # Pending payments
    total_pending = round(max(0.0, total_actual - total_paid), 2)
    # Remaining budget from total budget
    remaining_budget = round(total_budget - total_actual, 2)
    remaining_cash = round(total_budget - total_paid, 2)

    # Spending progress percentages
    spend_progress_pct = round((total_actual / total_budget * 100.0), 1) if total_budget > 0 else 0.0
    paid_progress_pct = round((total_paid / total_budget * 100.0), 1) if total_budget > 0 else 0.0

    # Overbudget categories
    cursor.execute('''
        SELECT c.id, c.name, c.allocated_amount, COALESCE(SUM(e.actual_amount), 0.0) as actual
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id
        WHERE c.user_id = ?
        GROUP BY c.id
        HAVING actual > c.allocated_amount
    ''', (user_id,))
    overbudget_cats = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Days remaining until wedding
    days_remaining = None
    if user.get("wedding_date"):
        try:
            w_date = datetime.strptime(user["wedding_date"], "%Y-%m-%d").date()
            today = datetime.now().date()
            days_remaining = (w_date - today).days
        except Exception:
            pass

    return jsonify({
        "total_budget": total_budget,
        "days_remaining": days_remaining,
        "contingency_fund": contingency_fund,
        "contingency_percent": contingency_percent,
        "total_allocated": total_allocated,
        "total_allocated_percent": total_allocated_percent,
        "total_contributions": total_contributions,
        "received_contributions": received_contributions,
        "total_estimated": total_estimated,
        "total_actual": total_actual,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "remaining_budget": remaining_budget,
        "remaining_cash": remaining_cash,
        "spend_progress_pct": spend_progress_pct,
        "paid_progress_pct": paid_progress_pct,
        "expense_count": expense_count,
        "overbudget_categories": overbudget_cats,
        "currency_code": user.get("currency_code", "INR"),
        "currency_symbol": user.get("currency_symbol", "₹")
    })

@app.route("/api/budget/quick-update", methods=["POST"])
@login_required
def quick_update_budget(user_id):
    data = request.get_json() or {}
    new_budget = float(data.get("total_budget", 0.0))
    rebalance = data.get("rebalance_categories", True)

    if new_budget <= 0:
        return jsonify({"error": "Budget must be greater than zero."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET total_budget = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_budget, user_id))

    if rebalance:
        cursor.execute("SELECT id, allocation_percent FROM categories WHERE user_id = ?", (user_id,))
        cats = cursor.fetchall()
        for cat in cats:
            new_allocated = round((cat["allocation_percent"] / 100.0) * new_budget, 2)
            cursor.execute("UPDATE categories SET allocated_amount = ? WHERE id = ?", (new_allocated, cat["id"]))

    conn.commit()
    conn.close()

    return jsonify({"message": "Budget updated successfully.", "total_budget": new_budget})

# ----------------- EXPENSES CRUD & FILTERS ----------------- #

@app.route("/api/expenses", methods=["GET"])
@login_required
def get_expenses(user_id):
    category_id = request.args.get("category_id")
    payment_status = request.args.get("payment_status")
    priority = request.args.get("priority")
    search = request.args.get("search", "").strip()
    sort_by = request.args.get("sort_by", "due_date")
    order = request.args.get("order", "asc").lower()

    valid_sorts = {
        "title": "e.title",
        "estimated_amount": "e.estimated_amount",
        "actual_amount": "e.actual_amount",
        "amount_paid": "e.amount_paid",
        "due_date": "e.due_date",
        "created_at": "e.created_at",
        "priority": "e.priority"
    }
    sort_col = valid_sorts.get(sort_by, "e.due_date")
    sort_dir = "DESC" if order == "desc" else "ASC"

    query = '''
        SELECT
            e.*,
            c.name as category_name,
            c.color as category_color,
            c.icon as category_icon,
            v.name as vendor_name,
            (e.actual_amount - e.amount_paid) as pending_amount
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN vendors v ON e.vendor_id = v.id
        WHERE e.user_id = ?
    '''
    params = [user_id]

    if category_id:
        query += " AND e.category_id = ?"
        params.append(category_id)
    if payment_status:
        query += " AND e.payment_status = ?"
        params.append(payment_status)
    if priority:
        query += " AND e.priority = ?"
        params.append(priority)
    if search:
        query += " AND (e.title LIKE ? OR v.name LIKE ? OR e.notes LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += f" ORDER BY {sort_col} {sort_dir}"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, tuple(params))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({"expenses": rows, "count": len(rows)})

@app.route("/api/expenses", methods=["POST"])
@login_required
def create_expense(user_id):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    category_id = data.get("category_id")
    vendor_id = data.get("vendor_id")
    estimated_amount = float(data.get("estimated_amount", 0.0))
    actual_amount = float(data.get("actual_amount", estimated_amount))
    amount_paid = float(data.get("amount_paid", 0.0))
    due_date = data.get("due_date")
    priority = data.get("priority", "must-have")
    notes = data.get("notes", "").strip()

    if not title or not category_id:
        return jsonify({"error": "Title and Category are required."}), 400

    # Determine payment status automatically based on payments made
    if amount_paid >= actual_amount and actual_amount > 0:
        payment_status = "paid"
    elif amount_paid > 0:
        payment_status = "partial"
    else:
        payment_status = "unpaid"

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO expenses (
            user_id, category_id, vendor_id, title, estimated_amount, actual_amount,
            amount_paid, due_date, payment_status, priority, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, category_id, vendor_id, title, estimated_amount, actual_amount, amount_paid, due_date, payment_status, priority, notes))
    exp_id = cursor.lastrowid

    # If an initial amount was paid, create a payment record for it
    if amount_paid > 0:
        cursor.execute('''
            INSERT INTO payments (
                user_id, expense_id, vendor_id, payment_title, amount, due_date,
                paid_date, status, payment_method, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', 'Bank Transfer', 'Initial recorded payment')
        ''', (user_id, exp_id, vendor_id, f"Initial Payment: {title}", amount_paid, due_date or datetime.now().strftime("%Y-%m-%d"), datetime.now().strftime("%Y-%m-%d")))

    conn.commit()

    cursor.execute('''
        SELECT e.*, c.name as category_name, c.color as category_color, v.name as vendor_name,
               (e.actual_amount - e.amount_paid) as pending_amount
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN vendors v ON e.vendor_id = v.id
        WHERE e.id = ?
    ''', (exp_id,))
    new_expense = dict(cursor.fetchone())
    conn.close()

    return jsonify({"expense": new_expense, "message": "Expense created successfully."}), 201

@app.route("/api/expenses/<int:exp_id>", methods=["PUT"])
@login_required
def update_expense(user_id, exp_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    title = data.get("title")
    category_id = data.get("category_id")
    vendor_id = data.get("vendor_id")
    estimated_amount = float(data.get("estimated_amount", 0.0)) if "estimated_amount" in data else None
    actual_amount = float(data.get("actual_amount", 0.0)) if "actual_amount" in data else None
    amount_paid = float(data.get("amount_paid", 0.0)) if "amount_paid" in data else None
    due_date = data.get("due_date")
    priority = data.get("priority")
    notes = data.get("notes")

    cursor.execute("SELECT * FROM expenses WHERE id = ? AND user_id = ?", (exp_id, user_id))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Expense not found."}), 404

    new_est = estimated_amount if estimated_amount is not None else existing["estimated_amount"]
    new_act = actual_amount if actual_amount is not None else existing["actual_amount"]
    new_paid = amount_paid if amount_paid is not None else existing["amount_paid"]

    # Compute status
    if new_paid >= new_act and new_act > 0:
        status = "paid"
    elif new_paid > 0:
        status = "partial"
    else:
        status = "unpaid"

    cursor.execute('''
        UPDATE expenses SET
            title = COALESCE(?, title),
            category_id = COALESCE(?, category_id),
            vendor_id = ?,
            estimated_amount = ?,
            actual_amount = ?,
            amount_paid = ?,
            due_date = COALESCE(?, due_date),
            payment_status = ?,
            priority = COALESCE(?, priority),
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    ''', (title, category_id, vendor_id, new_est, new_act, new_paid, due_date, status, priority, notes, exp_id, user_id))

    conn.commit()

    cursor.execute('''
        SELECT e.*, c.name as category_name, c.color as category_color, v.name as vendor_name,
               (e.actual_amount - e.amount_paid) as pending_amount
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN vendors v ON e.vendor_id = v.id
        WHERE e.id = ?
    ''', (exp_id,))
    updated = dict(cursor.fetchone())
    conn.close()

    return jsonify({"expense": updated, "message": "Expense updated successfully."})

@app.route("/api/expenses/<int:exp_id>", methods=["DELETE"])
@login_required
def delete_expense(user_id, exp_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (exp_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Expense deleted."})

# ----------------- VENDORS MANAGEMENT ----------------- #

@app.route("/api/vendors", methods=["GET"])
@login_required
def get_vendors(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT
            v.*,
            c.name as category_name,
            c.color as category_color,
            COALESCE(SUM(p.amount), 0.0) as total_paid,
            COALESCE(SUM(CASE WHEN p.status = 'scheduled' OR p.status = 'overdue' THEN p.amount ELSE 0 END), 0.0) as total_scheduled
        FROM vendors v
        LEFT JOIN categories c ON v.category_id = c.id
        LEFT JOIN payments p ON p.vendor_id = v.id AND p.status = 'paid'
        WHERE v.user_id = ?
        GROUP BY v.id
        ORDER BY v.name ASC
    ''', (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"vendors": rows})

@app.route("/api/vendors", methods=["POST"])
@login_required
def create_vendor(user_id):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    service_type = data.get("service_type", "").strip()
    category_id = data.get("category_id")
    contact_name = data.get("contact_name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip()
    website = data.get("website", "").strip()
    quotation_amount = float(data.get("quotation_amount", 0.0))
    agreed_price = float(data.get("agreed_price", quotation_amount))
    booking_status = data.get("booking_status", "shortlisted")
    notes = data.get("notes", "").strip()

    if not name or not service_type:
        return jsonify({"error": "Vendor name and service type are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO vendors (
            user_id, name, service_type, category_id, contact_name, phone, email, website,
            quotation_amount, agreed_price, booking_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, name, service_type, category_id, contact_name, phone, email, website, quotation_amount, agreed_price, booking_status, notes))
    vid = cursor.lastrowid
    conn.commit()

    cursor.execute('''
        SELECT v.*, c.name as category_name, c.color as category_color
        FROM vendors v
        LEFT JOIN categories c ON v.category_id = c.id
        WHERE v.id = ?
    ''', (vid,))
    item = dict(cursor.fetchone())
    conn.close()

    return jsonify({"vendor": item, "message": "Vendor saved."}), 201

@app.route("/api/vendors/<int:vid>", methods=["PUT"])
@login_required
def update_vendor(user_id, vid):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        UPDATE vendors SET
            name = COALESCE(?, name),
            service_type = COALESCE(?, service_type),
            category_id = COALESCE(?, category_id),
            contact_name = COALESCE(?, contact_name),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            website = COALESCE(?, website),
            quotation_amount = COALESCE(?, quotation_amount),
            agreed_price = COALESCE(?, agreed_price),
            booking_status = COALESCE(?, booking_status),
            notes = COALESCE(?, notes)
        WHERE id = ? AND user_id = ?
    ''', (
        data.get("name"), data.get("service_type"), data.get("category_id"),
        data.get("contact_name"), data.get("phone"), data.get("email"),
        data.get("website"), data.get("quotation_amount"), data.get("agreed_price"),
        data.get("booking_status"), data.get("notes"), vid, user_id
    ))
    conn.commit()

    cursor.execute('''
        SELECT v.*, c.name as category_name, c.color as category_color
        FROM vendors v
        LEFT JOIN categories c ON v.category_id = c.id
        WHERE v.id = ?
    ''', (vid,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Vendor not found."}), 404
    return jsonify({"vendor": dict(row), "message": "Vendor updated."})

@app.route("/api/vendors/<int:vid>", methods=["DELETE"])
@login_required
def delete_vendor(user_id, vid):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vendors WHERE id = ? AND user_id = ?", (vid, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Vendor deleted."})

# ----------------- PAYMENTS & REMINDERS ----------------- #

@app.route("/api/payments", methods=["GET"])
@login_required
def get_payments(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    today = datetime.now().strftime("%Y-%m-%d")

    cursor.execute('''
        SELECT
            p.*,
            v.name as vendor_name,
            v.service_type as vendor_service,
            e.title as expense_title,
            c.name as category_name,
            c.color as category_color,
            CASE
                WHEN p.status = 'paid' THEN 'paid'
                WHEN p.due_date < ? THEN 'overdue'
                ELSE 'scheduled'
            END as computed_status
        FROM payments p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        LEFT JOIN expenses e ON p.expense_id = e.id
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE p.user_id = ?
        ORDER BY p.due_date ASC
    ''', (today, user_id))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({"payments": rows})

@app.route("/api/payments", methods=["POST"])
@login_required
def create_payment(user_id):
    data = request.get_json() or {}
    payment_title = data.get("payment_title", "").strip()
    amount = float(data.get("amount", 0.0))
    due_date = data.get("due_date", datetime.now().strftime("%Y-%m-%d"))
    vendor_id = data.get("vendor_id")
    expense_id = data.get("expense_id")
    payment_method = data.get("payment_method", "Bank Transfer")
    notes = data.get("notes", "").strip()

    if not payment_title or amount <= 0:
        return jsonify({"error": "Payment title and a valid amount are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO payments (
            user_id, expense_id, vendor_id, payment_title, amount, due_date,
            status, payment_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
    ''', (user_id, expense_id, vendor_id, payment_title, amount, due_date, payment_method, notes))
    pid = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM payments WHERE id = ?", (pid,))
    item = dict(cursor.fetchone())
    conn.close()

    return jsonify({"payment": item, "message": "Payment scheduled."}), 201

@app.route("/api/payments/<int:pid>/mark-paid", methods=["POST"])
@login_required
def mark_payment_paid(user_id, pid):
    data = request.get_json() or {}
    paid_date = data.get("paid_date", datetime.now().strftime("%Y-%m-%d"))
    payment_method = data.get("payment_method", "Bank Transfer")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM payments WHERE id = ? AND user_id = ?", (pid, user_id))
    pmt = cursor.fetchone()
    if not pmt:
        conn.close()
        return jsonify({"error": "Payment not found."}), 404

    cursor.execute('''
        UPDATE payments SET
            status = 'paid',
            paid_date = ?,
            payment_method = ?
        WHERE id = ? AND user_id = ?
    ''', (paid_date, payment_method, pid, user_id))

    # If linked to an expense, update the amount_paid on the expense
    if pmt["expense_id"]:
        cursor.execute('''
            UPDATE expenses
            SET amount_paid = amount_paid + ?
            WHERE id = ? AND user_id = ?
        ''', (pmt["amount"], pmt["expense_id"], user_id))

        # Check and update payment_status
        cursor.execute("SELECT actual_amount, amount_paid FROM expenses WHERE id = ?", (pmt["expense_id"],))
        exp = cursor.fetchone()
        if exp:
            new_status = "paid" if exp["amount_paid"] >= exp["actual_amount"] else "partial"
            cursor.execute("UPDATE expenses SET payment_status = ? WHERE id = ?", (new_status, pmt["expense_id"]))

    conn.commit()
    cursor.execute("SELECT * FROM payments WHERE id = ?", (pid,))
    updated_pmt = dict(cursor.fetchone())
    conn.close()

    return jsonify({"payment": updated_pmt, "message": "Payment recorded as completed."})

@app.route("/api/payments/<int:pid>", methods=["DELETE"])
@login_required
def delete_payment(user_id, pid):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM payments WHERE id = ? AND user_id = ?", (pid, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Payment record deleted."})

@app.route("/api/payments/reminders", methods=["GET"])
@login_required
def get_payment_reminders(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    today = datetime.now().strftime("%Y-%m-%d")
    upcoming_limit = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    # Overdue payments
    cursor.execute('''
        SELECT p.*, v.name as vendor_name, e.title as expense_title
        FROM payments p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        LEFT JOIN expenses e ON p.expense_id = e.id
        WHERE p.user_id = ? AND p.status != 'paid' AND p.due_date < ?
        ORDER BY p.due_date ASC
    ''', (user_id, today))
    overdue = [dict(r) for r in cursor.fetchall()]

    # Upcoming within 30 days
    cursor.execute('''
        SELECT p.*, v.name as vendor_name, e.title as expense_title
        FROM payments p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        LEFT JOIN expenses e ON p.expense_id = e.id
        WHERE p.user_id = ? AND p.status != 'paid' AND p.due_date >= ? AND p.due_date <= ?
        ORDER BY p.due_date ASC
    ''', (user_id, today, upcoming_limit))
    upcoming = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return jsonify({
        "in_app_only": True,
        "notification_channel": "In-App Notification Center (Email/SMS integration not enabled)",
        "overdue_count": len(overdue),
        "upcoming_count": len(upcoming),
        "overdue": overdue,
        "upcoming": upcoming
    })

# ----------------- BUDGET INSIGHTS & SAVINGS TIPS ----------------- #

@app.route("/api/insights", methods=["GET"])
@login_required
def get_insights(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT total_budget, contingency_percent, guest_count, wedding_style, city FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())
    total_budget = float(user["total_budget"])
    contingency_percent = float(user["contingency_percent"])
    contingency_fund = round((contingency_percent / 100.0) * total_budget, 2)
    guest_count = int(user["guest_count"]) or 150

    cursor.execute('''
        SELECT
            c.id, c.name, c.color, c.icon, c.allocated_amount, c.allocation_percent,
            COALESCE(SUM(e.estimated_amount), 0.0) as total_estimated,
            COALESCE(SUM(e.actual_amount), 0.0) as total_actual,
            COALESCE(SUM(e.amount_paid), 0.0) as total_paid
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id
        WHERE c.user_id = ?
        GROUP BY c.id
        ORDER BY c.allocated_amount DESC
    ''', (user_id,))
    categories = [dict(r) for r in cursor.fetchall()]

    # Overall totals
    total_actual = sum(c["total_actual"] for c in categories)
    total_estimated = sum(c["total_estimated"] for c in categories)
    cost_per_guest = round(total_actual / guest_count, 2) if guest_count > 0 else 0

    overbudget_categories = []
    near_limit_categories = []

    for c in categories:
        diff = round(c["total_actual"] - c["allocated_amount"], 2)
        pct = (c["total_actual"] / c["allocated_amount"] * 100) if c["allocated_amount"] > 0 else 0
        c["spending_percentage"] = round(pct, 1)
        c["variance"] = diff

        if diff > 0:
            overbudget_categories.append({
                "category_id": c["id"],
                "category_name": c["name"],
                "allocated": c["allocated_amount"],
                "actual": c["total_actual"],
                "overrun": diff,
                "percentage_over": round(pct - 100, 1),
                "severity": "high" if diff > 0.15 * c["allocated_amount"] else "medium"
            })
        elif pct >= 85.0:
            near_limit_categories.append({
                "category_id": c["id"],
                "category_name": c["name"],
                "allocated": c["allocated_amount"],
                "actual": c["total_actual"],
                "headroom": round(c["allocated_amount"] - c["total_actual"], 2),
                "percentage_used": round(pct, 1)
            })

    # Algorithmic personalized savings tips based on actual expenditures
    savings_tips = []

    # Check Catering & Bar
    catering = next((c for c in categories if "catering" in c["name"].lower() or "bar" in c["name"].lower()), None)
    if catering and catering["total_actual"] > 0.20 * total_budget:
        savings_tips.append({
            "category": "Catering & Bar",
            "title": "Streamline Live Food Counters & Spirits",
            "description": f"Catering accounts for {round(catering['total_actual']/total_budget*100, 1)}% of your budget. Consider swapping 2 redundant live counters for signature sharing platters to save approximately 8-12% on per-plate pricing.",
            "estimated_savings_pct": 10
        })

    # Check Decoration & Floral
    decor = next((c for c in categories if "decor" in c["name"].lower() or "floral" in c["name"].lower()), None)
    if decor and decor["total_actual"] > 0.10 * total_budget:
        savings_tips.append({
            "category": "Decoration & Floral",
            "title": "Repurpose Ceremony Flowers for Reception",
            "description": "Have your planner transfer the Mandap/Altar floral arrangements to the bridal stage or dining entrance before evening celebrations begin. This easily saves ₹30,000 to ₹75,000 in fresh blooms.",
            "estimated_savings_pct": 15
        })

    # Check Photography
    photo = next((c for c in categories if "photo" in c["name"].lower()), None)
    if photo and photo["total_actual"] > 0.08 * total_budget:
        savings_tips.append({
            "category": "Photography & Video",
            "title": "Bundle Combined Photo & Cinema Team",
            "description": "Contracting a single unified media boutique rather than separate photographers and cinematographers avoids gear redundancy and unlocks combined multi-day package discounts of 10-15%.",
            "estimated_savings_pct": 12
        })

    # General Contingency Tip
    savings_tips.append({
        "category": "Contingency Fund",
        "title": "Keep A 10% Cash Emergency Buffer Locked",
        "description": f"Your current contingency reserve is {user['city']} standard ({contingency_percent}%). Keep ₹{contingency_fund:,.0f} untouched until 72 hours before the ceremony for final logistics, overtime staff tips, and unexpected guest additions.",
        "estimated_savings_pct": 5
    })

    conn.close()

    return jsonify({
        "total_budget": total_budget,
        "total_actual": total_actual,
        "total_estimated": total_estimated,
        "cost_per_guest": cost_per_guest,
        "guest_count": guest_count,
        "contingency_fund": contingency_fund,
        "categories": categories,
        "overbudget_categories": overbudget_categories,
        "near_limit_categories": near_limit_categories,
        "savings_tips": savings_tips
    })

# ----------------- WEDDING CHECKLIST / TASKS ----------------- #

@app.route("/api/tasks", methods=["GET"])
@login_required
def get_tasks(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE user_id = ? ORDER BY is_completed ASC, due_date ASC, priority DESC", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"tasks": rows, "count": len(rows)})

@app.route("/api/tasks", methods=["POST"])
@login_required
def create_task(user_id):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    category = data.get("category", "General").strip()
    due_date = data.get("due_date")
    priority = data.get("priority", "medium")
    notes = data.get("notes", "").strip()

    if not title:
        return jsonify({"error": "Task title is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO tasks (user_id, title, category, due_date, priority, is_completed, notes)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    ''', (user_id, title, category, due_date, priority, notes))
    tid = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (tid,))
    item = dict(cursor.fetchone())
    conn.close()

    return jsonify({"task": item, "message": "Task created."}), 201

@app.route("/api/tasks/<int:tid>", methods=["PUT"])
@login_required
def update_task(user_id, tid):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    title = data.get("title")
    category = data.get("category")
    due_date = data.get("due_date")
    priority = data.get("priority")
    notes = data.get("notes")
    is_completed = data.get("is_completed")

    completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if is_completed else None

    cursor.execute('''
        UPDATE tasks SET
            title = COALESCE(?, title),
            category = COALESCE(?, category),
            due_date = COALESCE(?, due_date),
            priority = COALESCE(?, priority),
            is_completed = COALESCE(?, is_completed),
            completed_at = CASE WHEN ? = 1 THEN ? ELSE NULL END,
            notes = COALESCE(?, notes)
        WHERE id = ? AND user_id = ?
    ''', (title, category, due_date, priority, is_completed, is_completed, completed_at, notes, tid, user_id))
    conn.commit()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (tid,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Task not found."}), 404
    return jsonify({"task": dict(row), "message": "Task updated."})

@app.route("/api/tasks/<int:tid>/toggle", methods=["POST"])
@login_required
def toggle_task(user_id, tid):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT is_completed FROM tasks WHERE id = ? AND user_id = ?", (tid, user_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Task not found."}), 404

    new_state = 0 if row["is_completed"] == 1 else 1
    completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if new_state == 1 else None

    cursor.execute("UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ? AND user_id = ?", (new_state, completed_at, tid, user_id))
    conn.commit()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (tid,))
    item = dict(cursor.fetchone())
    conn.close()

    return jsonify({"task": item, "message": "Task status updated."})

@app.route("/api/tasks/<int:tid>", methods=["DELETE"])
@login_required
def delete_task(user_id, tid):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (tid, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Task deleted."})

# ----------------- CSV DATA EXPORT ----------------- #

@app.route("/api/export/csv", methods=["GET"])
@login_required
def export_budget_csv(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())

    cursor.execute('''
        SELECT
            e.title as "Expense Item",
            c.name as "Category",
            v.name as "Vendor",
            e.estimated_amount as "Estimated Amount",
            e.actual_amount as "Actual Amount",
            e.amount_paid as "Amount Paid",
            (e.actual_amount - e.amount_paid) as "Pending Balance",
            e.due_date as "Payment Due Date",
            e.payment_status as "Payment Status",
            e.priority as "Priority",
            e.notes as "Notes"
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        LEFT JOIN vendors v ON e.vendor_id = v.id
        WHERE e.user_id = ?
        ORDER BY c.name ASC, e.due_date ASC
    ''', (user_id,))
    rows = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header section
    writer.writerow(["AURA & VOW - WEDDING BUDGET REPORT"])
    writer.writerow(["Couple", f"{user['partner1_name']} & {user['partner2_name']}"])
    writer.writerow(["Wedding Date", user['wedding_date'] or "Not specified"])
    writer.writerow(["City", user['city'] or "Not specified"])
    writer.writerow(["Currency", f"{user['currency_code']} ({user['currency_symbol']})"])
    writer.writerow(["Total Wedding Budget", f"{user['total_budget']:.2f}"])
    writer.writerow(["Contingency Reserve %", f"{user['contingency_percent']}%"])
    writer.writerow([])

    # Table columns
    if rows:
        col_names = [col[0] for col in cursor.description]
        writer.writerow(col_names)
        for row in rows:
            writer.writerow([r if r is not None else "" for r in row])
    else:
        writer.writerow(["No expenses recorded yet."])

    conn.close()

    csv_data = output.getvalue()
    response = make_response(csv_data)
    response.headers["Content-Disposition"] = f"attachment; filename=Wedding_Budget_{user['partner1_name']}_{user['partner2_name']}.csv"
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    return response

# ----------------- SYSTEM STATUS & HEALTH ----------------- #

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "Aura & Vow Wedding Budget API",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Starting Aura & Vow Wedding Budget server on http://127.0.0.1:{port} (debug={debug})...")
    app.run(host="0.0.0.0", port=port, debug=debug)
