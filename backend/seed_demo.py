import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import secrets
from database import get_db_connection, DEFAULT_CATEGORY_TEMPLATES, DEFAULT_STARTER_TASKS

DEMO_EMAIL = "demo@auraandvow.com"
DEMO_PASSWORD = "weddingplanner"

def seed_demo_user():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if demo user already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (DEMO_EMAIL,))
    existing = cursor.fetchone()
    if existing:
        demo_user_id = existing['id']
        # Clean up existing demo data to keep it fresh
        cursor.execute("DELETE FROM contributions WHERE user_id = ?", (demo_user_id,))
        cursor.execute("DELETE FROM expenses WHERE user_id = ?", (demo_user_id,))
        cursor.execute("DELETE FROM payments WHERE user_id = ?", (demo_user_id,))
        cursor.execute("DELETE FROM vendors WHERE user_id = ?", (demo_user_id,))
        cursor.execute("DELETE FROM categories WHERE user_id = ?", (demo_user_id,))
        cursor.execute("DELETE FROM tasks WHERE user_id = ?", (demo_user_id,))
        cursor.execute("DELETE FROM auth_tokens WHERE user_id = ?", (demo_user_id,))
    else:
        # Create user
        pwd_hash = generate_password_hash(DEMO_PASSWORD)
        wedding_date = (datetime.now() + timedelta(days=175)).strftime("%Y-%m-%d")
        cursor.execute('''
            INSERT INTO users (
                email, password_hash, partner1_name, partner2_name, wedding_date,
                city, guest_count, wedding_style, currency_code, currency_symbol,
                total_budget, contingency_percent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            DEMO_EMAIL, pwd_hash, "Aanya Verma", "Kabir Malhotra", wedding_date,
            "Udaipur & New Delhi", 250, "Royal Heritage & Modern Elegance", "INR", "₹",
            3000000.0, 10.0
        ))
        demo_user_id = cursor.lastrowid

    # Create persistent demo auth token
    demo_token = "demo-session-token-aura-vow-2027"
    cursor.execute("INSERT OR REPLACE INTO auth_tokens (token, user_id) VALUES (?, ?)", (demo_token, demo_user_id))

    # Add Contributions
    contributions = [
        ("Kabir & Aanya", "Personal Savings", 1200000.0, 1, "Liquid savings, mutual funds earmarked for wedding."),
        ("Verma Family", "Bride's Family", 1000000.0, 1, "Dedicated family contribution for venue and attire."),
        ("Malhotra Family", "Groom's Family", 800000.0, 1, "Family contribution towards catering & entertainment.")
    ]
    for name, rel, amt, rec, notes in contributions:
        cursor.execute('''
            INSERT INTO contributions (user_id, contributor_name, relationship, amount, is_received, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (demo_user_id, name, rel, amt, rec, notes))

    # Insert Categories
    cat_map = {}
    total_budget = 3000000.0
    for cat in DEFAULT_CATEGORY_TEMPLATES:
        allocated = round((cat["percent"] / 100.0) * total_budget, 2)
        cursor.execute('''
            INSERT INTO categories (user_id, name, icon, color, allocation_percent, allocated_amount, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (demo_user_id, cat["name"], cat["icon"], cat["color"], cat["percent"], allocated, cat["description"]))
        cat_map[cat["name"]] = cursor.lastrowid

    # Insert Vendors
    vendors_data = [
        ("The Leela Palace & Courtyard", "Venue & Banquets", cat_map.get("Venue & Banquets"), "Rajesh Singhania", "+91 98110 24890", "events@leelapalace.com", "https://theleela.com", 720000.0, 700000.0, "booked", "Includes main palace courtyard, mandap lawn & 2 luxury bridal suites."),
        ("Flavours of Rajputana Catering", "Catering & Bar", cat_map.get("Catering & Bar"), "Chef Ranveer Rathore", "+91 99280 11234", "concierge@flavoursrajputana.in", "https://flavoursrajputana.in", 675000.0, 650000.0, "booked", "250 guests, 4-course traditional Mewari and pan-Asian buffet, live tandoor and cocktail bar."),
        ("Velvet & Vine Floral Designers", "Decoration & Floral", cat_map.get("Decoration & Floral"), "Anamika Khurana", "+91 98711 55667", "design@velvetandvine.in", "https://velvetandvine.in", 380000.0, 360000.0, "booked", "Mogra floral mandap canopy, brass lanterns, customized floral entrance and fairytale lighting."),
        ("Lumière Wedding Stories", "Photography & Video", cat_map.get("Photography & Video"), "Arjun & Tara Mehta", "+91 97118 99001", "hello@lumiereweddings.com", "https://lumiereweddings.com", 295000.0, 280000.0, "booked", "3 days coverage: Mehendi, Sangeet, Wedding & Reception with 2 candid photographers and 4K cinema drone."),
        ("Sabyasachi Heritage Collective", "Clothing & Jewellery", cat_map.get("Clothing & Jewellery"), "Pooja Merchant", "+91 98200 44556", "bespoke@sabyasachicollective.com", "https://sabyasachi.com", 330000.0, 320000.0, "booked", "Bridal crimson velvet lehenga, customized safa, and groom raw silk sherwani."),
        ("Meera Sakhrani Artistry", "Makeup & Hair Styling", cat_map.get("Makeup & Hair Styling"), "Meera Sakhrani", "+91 98101 22334", "bookings@meerasakhrani.com", "https://instagram.com/meerasakhrani", 125000.0, 120000.0, "booked", "HD airbrush bridal makeup for Sangeet, Wedding, plus complimentary trial."),
        ("DJ Zaeden & Acoustic Beats", "Entertainment & Music", cat_map.get("Entertainment & Music"), "Vikram Batra", "+91 98300 77889", "gigs@acousticbeats.in", "https://acousticbeats.in", 120000.0, 110000.0, "shortlisted", "Sangeet live fusion dhol band, DJ console and stage sound engineering."),
        ("Royal Haveli Boutique Suites", "Guest Accommodation", cat_map.get("Guest Accommodation"), "Naveen Joshi", "+91 99112 33445", "reservations@royalhaveli.com", "https://royalhaveli.com", 125000.0, 120000.0, "booked", "15 deluxe rooms reserved for 2 nights for immediate family and VIP guests."),
        ("The Paper Trunk Couture Invites", "Invitations & Stationery", cat_map.get("Invitations & Stationery"), "Shreya Roy", "+91 97171 00998", "studio@thepapertrunk.com", "https://thepapertrunk.com", 60000.0, 55000.0, "completed", "Rose gold wax seal invitations, boxed dry fruits, and animated WhatsApp video invite.")
    ]

    vendor_map = {}
    for name, stype, cid, cname, ph, em, web, qamt, aprice, bstatus, notes in vendors_data:
        cursor.execute('''
            INSERT INTO vendors (user_id, name, service_type, category_id, contact_name, phone, email, website, quotation_amount, agreed_price, booking_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (demo_user_id, name, stype, cid, cname, ph, em, web, qamt, aprice, bstatus, notes))
        vendor_map[name] = cursor.lastrowid

    # Insert Expenses
    expenses_data = [
        ("Palace Ballroom & Lawn Booking", "Venue & Banquets", "The Leela Palace & Courtyard", 720000.0, 700000.0, 400000.0, -45, "partial", "must-have", "Deposit paid. Remaining due 2 weeks before wedding."),
        ("Royal Feast Dinner & Cocktails", "Catering & Bar", "Flavours of Rajputana Catering", 650000.0, 660000.0, 250000.0, -30, "partial", "must-have", "Includes welcome drinks, gala dinner, and late-night chaat counter."),
        ("Mandap Architecture & Fresh Floral Canopies", "Decoration & Floral", "Velvet & Vine Floral Designers", 350000.0, 360000.0, 180000.0, -35, "partial", "must-have", "Custom blush and crimson rose theme with brass diyas."),
        ("3-Day Cinematic Film & Candid Photography", "Photography & Video", "Lumière Wedding Stories", 275000.0, 280000.0, 150000.0, -20, "partial", "must-have", "Advance paid upon signing contract. Next installment before Sangeet."),
        ("Bridal Silk Lehenga & Custom Jewelry", "Clothing & Jewellery", "Sabyasachi Heritage Collective", 330000.0, 320000.0, 320000.0, -110, "paid", "must-have", "Full payment made upon final trial delivery."),
        ("Bridal & Sangeet Makeup Package", "Makeup & Hair Styling", "Meera Sakhrani Artistry", 120000.0, 120000.0, 60000.0, -15, "partial", "must-have", "50% advance deposited. Balance on wedding day."),
        ("Luxury Foil Letterpress Invitations", "Invitations & Stationery", "The Paper Trunk Couture Invites", 60000.0, 55000.0, 55000.0, -90, "paid", "nice-to-have", "Fully printed and dispatched to guests."),
        ("Sangeet Live Band & Sound Setup", "Entertainment & Music", "DJ Zaeden & Acoustic Beats", 120000.0, 110000.0, 0.0, -25, "unpaid", "must-have", "Quotation approved. Token advance due next week."),
        ("Family & Out-of-Town Rooms (15 Suites)", "Guest Accommodation", "Royal Haveli Boutique Suites", 120000.0, 120000.0, 60000.0, -40, "partial", "must-have", "50% booking deposit transferred."),
        ("Wedding Rituals, Vedic Pandit & Samagri", "Rituals & Ceremonies", None, 75000.0, 70000.0, 35000.0, -10, "partial", "must-have", "Panditji dakshina and puja items arranged."),
        ("Guest Luxury Mini-Coaches & Airport Pickup", "Transportation & Logistics", None, 60000.0, 55000.0, 0.0, -12, "unpaid", "medium", "Airport transfers for wedding guests."),
        ("Handcrafted Kashmiri Stoles & Return Favors", "Favors & Wedding Gifts", None, 60000.0, 58000.0, 58000.0, -70, "paid", "nice-to-have", "Gift boxes packaged with brass seals."),
        ("Emergency Miscellaneous Reserve & Gratuities", "Miscellaneous & Tips", None, 50000.0, 40000.0, 10000.0, -5, "partial", "must-have", "Cash envelopes prepared for hotel staff tips.")
    ]

    base_wedding_date = datetime.now() + timedelta(days=175)
    expense_ids = []

    for title, cat_name, vname, est, act, paid, due_offset, status, priority, notes in expenses_data:
        cid = cat_map.get(cat_name)
        vid = vendor_map.get(vname) if vname else None
        due_str = (base_wedding_date + timedelta(days=due_offset)).strftime("%Y-%m-%d")
        
        cursor.execute('''
            INSERT INTO expenses (
                user_id, category_id, vendor_id, title, estimated_amount, actual_amount,
                amount_paid, due_date, payment_status, priority, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (demo_user_id, cid, vid, title, est, act, paid, due_str, status, priority, notes))
        exp_id = cursor.lastrowid
        expense_ids.append((exp_id, vid, title, act, paid, due_str))

    # Payments schedule
    # 1. Past paid payments
    payments_data = [
        # (exp_idx, title, amount, due_offset, paid_offset, status, method, notes)
        (0, "Palace Initial Token & Hall Lock Deposit", 400000.0, -120, -120, "paid", "Bank Transfer", "NEFT Ref: HDFC9901844. Venue booked."),
        (1, "Catering 1st Tasting & Date Advance", 250000.0, -90, -90, "paid", "UPI", "Tasting completed and menu approved."),
        (2, "Floral & Mandap Design Commitment Advance", 180000.0, -80, -80, "paid", "Bank Transfer", "Mandap 3D mockup finalized."),
        (3, "Photography Signing Retainer (50%)", 150000.0, -75, -75, "paid", "Credit Card", "Pre-wedding shoot scheduled."),
        (4, "Sabyasachi Lehenga & Sherwani Full Payment", 320000.0, -110, -110, "paid", "Credit Card", "Outfits received in garment bags."),
        (5, "Bridal Makeup Booking Retainer", 60000.0, -60, -60, "paid", "UPI", "Makeup artist slot secured for 3 dates."),
        (6, "Invitations Printing & Luxury Box Dispatch", 55000.0, -90, -90, "paid", "Bank Transfer", "All packages dispatched via courier."),
        (8, "Hotel Room Block Deposit (50%)", 60000.0, -70, -70, "paid", "Credit Card", "15 suites confirmed for 2 nights."),
        (11, "Return Gift Hampers Full Settlement", 58000.0, -70, -70, "paid", "UPI", "Hampers packed with dry fruits & stoles."),
        
        # 2. Upcoming & Pending Payments
        (0, "Palace Final Venue Balance Due", 300000.0, 15, None, "scheduled", "Bank Transfer", "Final banquet settlement before event day."),
        (1, "Catering Final Ingredient & Headcount Balance", 410000.0, 25, None, "scheduled", "Bank Transfer", "Due after final guest RSVP count confirmation."),
        (2, "Floral & Stage Decor Milestone Payment", 180000.0, 18, None, "scheduled", "Bank Transfer", "Due upon start of stage setup."),
        (3, "Photography Post-Shoot & Album Balance", 130000.0, 30, None, "scheduled", "Bank Transfer", "Due on delivery of raw drives & teaser."),
        (5, "Makeup Artist Final Balance on Wedding Day", 60000.0, 28, None, "scheduled", "UPI", "Payable after bridal glam."),
        (7, "DJ & Band Booking Advance", 50000.0, 7, None, "scheduled", "UPI", "Urgent: Token advance required to block dates!"),
        (8, "Hotel Room Balance upon Check-in", 60000.0, 22, None, "scheduled", "Credit Card", "Payable at hotel front desk."),
        (9, "Panditji & Samagri Balance", 35000.0, 26, None, "scheduled", "Cash", "Keep cash envelopes prepared."),
        (10, "Guest Shuttles Transport Fee", 55000.0, 24, None, "scheduled", "UPI", "Payable to fleet coordinator.")
    ]

    for exp_idx, ptitle, pamt, due_days_from_now, paid_days, pstatus, pmethod, pnotes in payments_data:
        exp_info = expense_ids[exp_idx]
        exp_id = exp_info[0]
        vid = exp_info[1]
        p_due = (datetime.now() + timedelta(days=due_days_from_now)).strftime("%Y-%m-%d")
        p_paid = (datetime.now() + timedelta(days=paid_days)).strftime("%Y-%m-%d") if paid_days else None

        cursor.execute('''
            INSERT INTO payments (
                user_id, expense_id, vendor_id, payment_title, amount, due_date,
                paid_date, status, payment_method, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (demo_user_id, exp_id, vid, ptitle, pamt, p_due, p_paid, pstatus, pmethod, pnotes))

    # Starter Tasks for Demo
    tasks_data = [
        ("Finalize and book primary wedding venue", "Venue & Banquets", -120, "high", 1, "Completed! Leela Palace booked."),
        ("Schedule food tastings & confirm catering contract", "Catering & Bar", -90, "high", 1, "Tasting was extraordinary. Menu fixed."),
        ("Book lead photographer & cinematography team", "Photography & Video", -75, "high", 1, "Lumiere team locked in."),
        ("Order custom bridal outfit and groom attire", "Clothing & Jewellery", -110, "high", 1, "Sabyasachi pieces picked up."),
        ("Lock floral concept, mandap theme, and decor vendor", "Decoration & Floral", -60, "medium", 1, "Velvet & Vine contracted."),
        ("Book certified bridal hair and makeup artist", "Makeup & Hair Styling", -50, "high", 1, "Meera Sakhrani booked."),
        ("Design invitations and finalize guest address list", "Invitations & Stationery", -40, "medium", 1, "Couture boxed invites dispatched."),
        ("Reserve room block for traveling out-of-town guests", "Guest Accommodation", -30, "medium", 1, "15 suites confirmed."),
        ("Hire DJ, sound system, and finalize sangeet playlist", "Entertainment & Music", 7, "high", 0, "Needs immediate token advance!"),
        ("Arrange wedding day car and guest shuttles", "Transportation & Logistics", 20, "medium", 0, "Get quote for 4 luxury tempo travelers."),
        ("Assemble welcome kits and wedding favors", "Favors & Wedding Gifts", 25, "low", 0, "Assemble hampers with dry fruits & notes."),
        ("Review contingency fund, vendor payout dates & cash tips", "Miscellaneous & Tips", 35, "high", 0, "Double-check cash envelopes for staff.")
    ]

    for title, cat, due_offset, priority, is_done, notes in tasks_data:
        t_due = (datetime.now() + timedelta(days=due_offset)).strftime("%Y-%m-%d")
        t_done_at = (datetime.now() + timedelta(days=due_offset)).strftime("%Y-%m-%d %H:%M:%S") if is_done else None
        cursor.execute('''
            INSERT INTO tasks (user_id, title, category, due_date, priority, is_completed, completed_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (demo_user_id, title, cat, t_due, priority, is_done, t_done_at, notes))

    conn.commit()
    conn.close()
    print("Demo user seeded successfully! Email: demo@auraandvow.com | Pass: weddingplanner")
    return demo_token

if __name__ == '__main__':
    seed_demo_user()
