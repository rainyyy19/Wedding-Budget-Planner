# Aura & Vow — Elegant Wedding Budget Planner 💍

A complete, modern, and romantic Wedding Budget Planner web application inspired by high-touch wedding finance workflows like Zola, built with an original brand identity, layout, and functionality.

**Aura & Vow** brings financial serenity to couples planning their wedding, allowing them to allocate total budgets, track estimated vs. actual vendor quotes, manage milestone advance payments, receive in-app payment reminders, and know down to the exact rupee or dollar how much money remains.

---

## 🌸 Visual Identity & Aesthetic

- **Color Palette**: Warm ivory backgrounds (`#FAF8F5`, `#FDFBF7`), soft blush accents (`#E8C5C8`, `#FBF4F5`), royal muted burgundy (`#6B2D44`, `#853754`), gentle sage green (`#748671`, `#EEF3ED`), and champagne gold highlights (`#C4A47C`).
- **Typography**: Classic luxury serif headings (*Playfair Display*, *Cormorant Garamond*) paired with clean, readable sans-serif body text (*Plus Jakarta Sans*).
- **Design Experience**: Generous whitespace, subtle borders, editorial wedding photography, and polished micro-interactions without aggressive neon gradients or generic AI dashboard styling.

---

## ✨ Features & Pages Overview

### Page 1 — Public Landing Page
- **Hero Section**: Editorial wedding photography, compelling headline (*"Your dream wedding. A budget that makes sense."*), and dual action buttons (*Start Planning Free* and *Try Live Demo*).
- **Interactive Budget Simulator**: Live slider on the hero section allowing visitors to simulate allocations for ₹5 Lakhs to ₹1 Crore in real-time.
- **4 Feature Pillars**: Algorithmic Allocations, Advance & Partial Payments, In-App Payment Reminders, and Tailored Savings Insights.
- **How It Works**: 3 simple steps to wedding financial peace.
- **Interactive FAQ Accordion**: Answers to common questions regarding benchmarks, partial payments, and privacy.
- **Polished Footer**: Mission statement, quick navigation links, and benchmark disclaimer.

### Page 2 — Wedding Setup & Budget Calculator
- **Wedding Parameters**: Total wedding budget, wedding date, destination city, guest count, and wedding aesthetic.
- **Multi-Currency Support**: Defaults to **INR (₹)** with proper Indian numerical formatting (e.g. `₹25,00,000`), with instant switching to USD (`$`), EUR (`€`), GBP (`£`), AED (`د.إ`), CAD, and AUD.
- **Family & Partner Contributions**: Add funds from yourselves, parents, or in-laws with status tracking (*Received / In Bank* vs. *Promised / Future Pledge*).
- **Configurable Contingency Fund**: Dedicated slider (5% to 25%) protecting emergency reserves for weather or surprise day-of charges.
- **14 Customizable Categories**: Venue, Catering, Decor & Floral, Outfits & Jewellery, Photography & Video, Makeup & Hair, Music & Entertainment, Guest Accommodation, Rituals & Ceremonies, Invitations, Transportation, Favors & Gifts, Tips & Miscellaneous, and Contingency.
- **Live Rebalancing**: Edit percentage or currency amount directly; totals recalculate automatically.
- **Transparent Disclaimer**: Explicitly identifies estimates as regional planning benchmarks, clearly distinguished from live contracted vendor prices.

### Page 3 — Personal Budget Dashboard
- **6 Key Financial Pulse Tiles**: Total Budget, Allocated Amount, Actual Spent (Committed), Total Paid Out, Pending Milestone Payments, and Remaining Budget.
- **Spending Progress Indicator**: Dual-layer visual bar showing cleared payments vs. committed contracts with budget health badge (*On Track*, *Near Limit*, *Over Budget*).
- **Category Progress Bars**: Planned allocation vs. actual spent comparison for top categories.
- **Overspending Warnings**: Prominent alert banners whenever any category exceeds its allocated budget.
- **Upcoming Payment Deadlines**: Next 30 days of upcoming vendor deposits with countdown status.
- **Checklist Action Center**: High-priority tasks requiring immediate attention.

### Page 4 — Expense Management
- **Dual View Modes**: Switch between an **Interactive Data Table View** and an editorial **Visual Category-Card View**.
- **Full CRUD Support**: Create, edit, delete, and inspect expenses.
- **Granular Fields**: Title, Category, Vendor, Estimated Budget, Actual/Quoted Amount, Amount Paid, Pending Due Date, Payment Status (*Unpaid*, *Partial*, *Paid*), Priority (*Must-Have*, *Nice-to-Have*, *Luxury*), and notes.
- **Advance & Partial Payments**: Direct "Pay" action on any item to record advance deposits or milestone installments.
- **Search, Filter & Sort**: Real-time search by title or vendor, filters by category, payment status, and priority, with multi-attribute sorting.

### Page 5 — Vendor & Payment Management
- **Vendor Directory**: Track contact name, phone, email, website portfolio, quotation amount, agreed contract price, and booking status (*Shortlisted*, *Inquiry*, *Booked*, *Completed*, *Declined*).
- **Payment Ledger & Milestones**: Record deposits, stage releases, and final balances.
- **In-App Payment Reminders**: Prominently designated as **In-App Notifications Only** (no unconfigured email/SMS spam).
- **Payment Calendar View**: Monthly interactive grid highlighting due dates and scheduled vendor payouts.
- **Explicit User Action Confirmation**: Payments are **never auto-marked as paid**; requires explicit user action to select payment date and method (*UPI, Bank Transfer, Card, Cash*).

### Page 6 — Budget Insights & Analytics
- **Interactive Visual Charts**:
  - Donut Chart of category expense distribution using Chart.js.
  - Grouped Bar Chart of planned budget vs. actual committed spending.
- **Calculated Cost Per Guest**: Real-time cost divided by guest count.
- **Personalized Algorithmic Savings Tips**: Proactive optimization recommendations based on actual spending patterns (catering simplifications, mandap floral repurposing, media team bundling).
- **Contingency Fund Tracker**: Monitor intact emergency reserves.
- **One-Click CSV Export**: Download a complete wedding budget and expense ledger formatted for Excel and accounting.

### Page 7 — Wedding Checklist
- **Timeline Milestone Tracker**: Organize wedding tasks with due dates, priority badges, categories, and completion timestamps.
- **Filters**: Filter by *All*, *To-Do*, *Overdue*, and *Completed*.
- **Starter Milestones Generator**: 1-click load of essential wedding milestones (venue booking, caterer tasting, bridal outfits, photographer booking, invitations).
- **Checklist Progress Bar**: Visual percentage completion metric.

### Authentication & Privacy
- **Secure Registration & Login**: Real database persistence using SQLite.
- **Private Data Vault**: All queries scoped to the authenticated `user_id`.
- **Pre-Seeded Live Demo Mode**: 1-click access to explore a realistic destination wedding budget (Kabir & Aanya's wedding with ₹30,00,000 budget, 9 booked vendors, 13 realistic expenses, and scheduled payments).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Chart.js, `react-chartjs-2`, Lucide Icons, Modern CSS Design Tokens.
- **Backend**: Python 3.14, Flask, Flask-CORS, Werkzeug Security, SQLite3.
- **Persistence**: SQLite database (`wedding_planner.db`) with foreign key constraints and automated schema migration.

---

## 🚀 Setup & Run Instructions

### Prerequisites
- **Python 3.10+** (with virtual environment support)
- **Node.js v18+** & **npm**

### Step 1: Backend Setup
```bash
# Navigate to project root
cd "Budget planner"

# The virtual environment is already created in ./venv
# Or create a fresh one:
python -m venv venv

# Activate virtual environment:
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# Install backend dependencies:
pip install flask flask-cors werkzeug
```

### Step 2: Initialize Database & Seed Demo Data
```bash
# Initialize SQLite database schema
python backend/database.py

# (Optional) Seed realistic demo wedding (Aanya & Kabir)
python backend/seed_demo.py
```

### Step 3: Frontend Build
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 4: Run the Application

#### Option A: Unified Production Server (Recommended)
Flask serves both the REST API and the built React frontend on port 5000:
```bash
# From project root:
.\venv\Scripts\python.exe backend/app.py
```
Open your browser at: **`http://localhost:5000`**

#### Option B: Concurrent Development Mode
Run the Flask API on port 5000 and Vite dev server on port 5173 with hot reloading:
```bash
# Terminal 1: Run Flask API
.\venv\Scripts\python.exe backend/app.py

# Terminal 2: Run Vite Frontend Dev Server
cd frontend
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 🔑 Demo Account Credentials

You can use the **"Live Demo"** button in the navigation header or log in with:
- **Email**: `demo@auraandvow.com`
- **Password**: `weddingplanner`

---

## 🧪 Testing

Run the automated integration test suite:
```bash
.\venv\Scripts\python.exe backend/test_api.py
```
This tests:
1. Health check & frontend static delivery
2. Registration and login authentication
3. Budget summary calculation accuracy
4. Category allocation and proportional percentages
5. Expense creation, filtering, and partial payment updates
6. Vendor quotation and contract tracking
7. Payment ledger scheduling and mark-as-paid validation
8. In-app payment reminders and overdue detection
9. Algorithmic savings tips generation
10. Task management and completion toggles
11. CSV export generation
