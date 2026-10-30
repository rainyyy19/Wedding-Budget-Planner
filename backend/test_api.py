import sys
sys.path.append('backend')
from app import app
from seed_demo import seed_demo_user

def test_routes():
    client = app.test_client()
    
    # 1. Health check
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.data}"
    print("[OK] Health check passed")

    # 1b. Frontend index.html served
    res = client.get('/')
    assert res.status_code == 200
    assert b"Aura & Vow" in res.data
    print("[OK] Frontend static client serving verified")

    # 2. Demo login
    res = client.post('/api/auth/demo')
    assert res.status_code == 200, f"Demo login failed: {res.data}"
    demo_json = res.get_json()
    token = demo_json["token"]
    assert token, "Token missing from demo login"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[OK] Demo login passed. Token: {token[:10]}...")

    # 3. Budget summary
    res = client.get('/api/budget/summary', headers=headers)
    assert res.status_code == 200, f"Budget summary failed: {res.data}"
    summary = res.get_json()
    assert summary["total_budget"] == 3000000.0
    assert summary["total_paid"] > 0
    assert summary["remaining_budget"] > 0
    print(f"[OK] Budget summary passed: Total={summary['total_budget']}, Actual={summary['total_actual']}, Paid={summary['total_paid']}, Pending={summary['total_pending']}")

    # 4. Categories
    res = client.get('/api/categories', headers=headers)
    assert res.status_code == 200
    cats = res.get_json()["categories"]
    assert len(cats) >= 10
    print(f"[OK] Categories retrieved: {len(cats)} categories")

    # 5. Expenses
    res = client.get('/api/expenses', headers=headers)
    assert res.status_code == 200
    expenses = res.get_json()["expenses"]
    assert len(expenses) >= 10
    print(f"[OK] Expenses retrieved: {len(expenses)} expenses")

    # 6. Vendors
    res = client.get('/api/vendors', headers=headers)
    assert res.status_code == 200
    vendors = res.get_json()["vendors"]
    assert len(vendors) >= 5
    print(f"[OK] Vendors retrieved: {len(vendors)} vendors")

    # 7. Payments
    res = client.get('/api/payments', headers=headers)
    assert res.status_code == 200
    pmts = res.get_json()["payments"]
    assert len(pmts) >= 10
    print(f"[OK] Payments retrieved: {len(pmts)} payments")

    # 8. Reminders
    res = client.get('/api/payments/reminders', headers=headers)
    assert res.status_code == 200
    reminders = res.get_json()
    assert reminders["in_app_only"] is True
    print(f"[OK] Payment reminders verified (In-app only: {reminders['in_app_only']})")

    # 9. Insights
    res = client.get('/api/insights', headers=headers)
    assert res.status_code == 200
    insights = res.get_json()
    assert len(insights["categories"]) > 0
    assert len(insights["savings_tips"]) > 0
    print(f"[OK] Insights verified with {len(insights['savings_tips'])} personalized savings tips")

    # 10. Tasks
    res = client.get('/api/tasks', headers=headers)
    assert res.status_code == 200
    tasks = res.get_json()["tasks"]
    assert len(tasks) >= 5
    print(f"[OK] Tasks verified: {len(tasks)} tasks")

    # 11. CSV Export
    res = client.get('/api/export/csv', headers=headers)
    assert res.status_code == 200
    assert b"AURA & VOW" in res.data
    print("[OK] CSV Export generated and validated")

    print("\nALL 11 BACKEND API TESTS PASSED FLAWLESSLY! SUCCESS")

if __name__ == '__main__':
    test_routes()
