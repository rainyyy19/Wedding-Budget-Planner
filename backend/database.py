import sqlite3
import os
import secrets
from datetime import datetime

DB_PATH = os.environ.get('DATABASE_PATH', os.path.join(os.path.dirname(__file__), 'wedding_planner.db'))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        partner1_name TEXT DEFAULT 'Partner 1',
        partner2_name TEXT DEFAULT 'Partner 2',
        wedding_date TEXT,
        city TEXT DEFAULT 'New Delhi',
        guest_count INTEGER DEFAULT 200,
        wedding_style TEXT DEFAULT 'Royal Elegance',
        currency_code TEXT DEFAULT 'INR',
        currency_symbol TEXT DEFAULT '₹',
        total_budget REAL DEFAULT 2500000.0,
        contingency_percent REAL DEFAULT 10.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contributor_name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0.0,
        is_received INTEGER DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        allocation_percent REAL NOT NULL DEFAULT 0.0,
        allocated_amount REAL NOT NULL DEFAULT 0.0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        contact_name TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        quotation_amount REAL DEFAULT 0.0,
        agreed_price REAL DEFAULT 0.0,
        booking_status TEXT DEFAULT 'shortlisted',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        estimated_amount REAL NOT NULL DEFAULT 0.0,
        actual_amount REAL NOT NULL DEFAULT 0.0,
        amount_paid REAL NOT NULL DEFAULT 0.0,
        due_date TEXT,
        payment_status TEXT DEFAULT 'unpaid',
        priority TEXT DEFAULT 'must-have',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
        payment_title TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0.0,
        due_date TEXT NOT NULL,
        paid_date TEXT,
        status TEXT DEFAULT 'scheduled',
        payment_method TEXT,
        notes TEXT,
        reminder_dismissed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        is_completed INTEGER DEFAULT 0,
        completed_at TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    conn.commit()
    conn.close()

# Default category template percentages based on wedding industry benchmarks
DEFAULT_CATEGORY_TEMPLATES = [
    {"name": "Venue & Banquets", "percent": 24.0, "icon": "Building2", "color": "#802F48", "description": "Wedding venue rental, hall charges, lawns, and caution deposits."},
    {"name": "Catering & Bar", "percent": 22.0, "icon": "Utensils", "color": "#C4A47C", "description": "Menu tasting, per-plate dinners, mocktails, cocktails, live counters, and servers."},
    {"name": "Decoration & Floral", "percent": 12.0, "icon": "Flower2", "color": "#748671", "description": "Mandap or altar styling, stage backdrop, centerpieces, fairy lights, entrance arch."},
    {"name": "Clothing & Jewellery", "percent": 11.0, "icon": "Gem", "color": "#945266", "description": "Bridal lehenga / gown, groom sherwani / suit, fine jewelry, alteration fittings."},
    {"name": "Photography & Video", "percent": 9.0, "icon": "Camera", "color": "#4A6B82", "description": "Candid photos, pre-wedding shoot, drone coverage, traditional albums, teaser film."},
    {"name": "Makeup & Hair Styling", "percent": 4.0, "icon": "Sparkles", "color": "#D48B96", "description": "Bridal makeup trials, wedding day glam, hairstyling, family touch-ups."},
    {"name": "Entertainment & Music", "percent": 4.0, "icon": "Music", "color": "#A06B52", "description": "DJ sound system, live acoustic band, sangeet choreographers, percussionist."},
    {"name": "Guest Accommodation", "percent": 4.0, "icon": "Hotel", "color": "#637B6E", "description": "Hotel block rooms for out-of-town guests and close family hospitality."},
    {"name": "Rituals & Ceremonies", "percent": 3.0, "icon": "HeartHandshake", "color": "#B35B47", "description": "Officiant / Pandit dakshina, puja samagri, holy fire offerings, registry fees."},
    {"name": "Invitations & Stationery", "percent": 2.0, "icon": "Mail", "color": "#8C7B9E", "description": "Printed physical invites, gold foil envelopes, e-invitations, signage board."},
    {"name": "Transportation & Logistics", "percent": 2.0, "icon": "Car", "color": "#5A7280", "description": "Vintage bridal entry car, guest luxury coaches, airport airport shuttles."},
    {"name": "Favors & Wedding Gifts", "percent": 2.0, "icon": "Gift", "color": "#BD925B", "description": "Welcome hamper boxes, return gifts for relatives, bridal party bridesmaid boxes."},
    {"name": "Miscellaneous & Tips", "percent": 2.0, "icon": "Coins", "color": "#7E8289", "description": "Vendor gratuities, emergency kit, extra printouts, day-of ad-hoc needs."},
    {"name": "Contingency Fund", "percent": 3.0, "icon": "ShieldAlert", "color": "#B8860B", "description": "Dedicated buffer allocated for surprise charges, guest additions, or weather contingencies."}
]

DEFAULT_STARTER_TASKS = [
    {"title": "Finalize and book primary wedding venue", "category": "Venue & Banquets", "priority": "high", "offset_days": -180},
    {"title": "Schedule food tastings & confirm catering contract", "category": "Catering & Bar", "priority": "high", "offset_days": -150},
    {"title": "Book lead photographer & cinematography team", "category": "Photography & Video", "priority": "high", "offset_days": -140},
    {"title": "Order custom bridal outfit and groom attire", "category": "Clothing & Jewellery", "priority": "high", "offset_days": -120},
    {"title": "Lock floral concept, mandap theme, and decor vendor", "category": "Decoration & Floral", "priority": "medium", "offset_days": -100},
    {"title": "Book certified bridal hair and makeup artist", "category": "Makeup & Hair Styling", "priority": "high", "offset_days": -90},
    {"title": "Design invitations and finalize guest address list", "category": "Invitations & Stationery", "priority": "medium", "offset_days": -75},
    {"title": "Reserve room block for traveling out-of-town guests", "category": "Guest Accommodation", "priority": "medium", "offset_days": -60},
    {"title": "Hire DJ, sound system, and finalize sangeet playlist", "category": "Entertainment & Music", "priority": "medium", "offset_days": -45},
    {"title": "Arrange wedding day car and guest shuttles", "category": "Transportation & Logistics", "priority": "low", "offset_days": -30},
    {"title": "Assemble welcome kits and wedding favors", "category": "Favors & Wedding Gifts", "priority": "low", "offset_days": -20},
    {"title": "Review contingency fund, vendor payout dates & cash tips", "category": "Miscellaneous & Tips", "priority": "high", "offset_days": -7}
]

def generate_default_categories(user_id, total_budget):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Calculate allocated amount per category
    for cat in DEFAULT_CATEGORY_TEMPLATES:
        allocated = round((cat["percent"] / 100.0) * total_budget, 2)
        cursor.execute('''
            INSERT INTO categories (user_id, name, icon, color, allocation_percent, allocated_amount, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, cat["name"], cat["icon"], cat["color"], cat["percent"], allocated, cat["description"]))
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DB_PATH)
