import urllib.request
import json

base = 'https://bvg-clinicos-api.onrender.com/api'
roles = [
    ('admin', 'Clinicos@2026', 'SUPER_ADMIN'),
    ('hosp_admin', 'Clinicos@2026', 'HOSPITAL_ADMIN'),
    ('branch_admin', 'Clinicos@2026', 'BRANCH_ADMIN'),
    ('dr_sharma', 'Clinicos@2026', 'DOCTOR'),
    ('receptionist', 'Clinicos@2026', 'RECEPTIONIST'),
    ('nurse_priya', 'Clinicos@2026', 'NURSE'),
    ('pharmacist_rahul', 'Clinicos@2026', 'PHARMACIST'),
    ('lab_tech_anil', 'Clinicos@2026', 'LAB_TECHNICIAN'),
    ('radiologist_sunil', 'Clinicos@2026', 'RADIOLOGIST'),
    ('accountant_neha', 'Clinicos@2026', 'ACCOUNTANT'),
    ('hr_manager', 'Clinicos@2026', 'HR_MANAGER'),
    ('ot_staff_vikram', 'Clinicos@2026', 'OT_STAFF'),
    ('patient_rajesh', 'Clinicos@2026', 'PATIENT'),
]

passed = 0
for u, p, r in roles:
    try:
        req = urllib.request.Request(
            f"{base}/auth/login/",
            data=json.dumps({'username': u, 'password': p}).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            res = json.loads(resp.read().decode('utf-8'))
        tok = res['access']
        req2 = urllib.request.Request(
            f"{base}/auth/me/",
            headers={'Authorization': f'Bearer {tok}'}
        )
        with urllib.request.urlopen(req2, timeout=15) as resp2:
            me = json.loads(resp2.read().decode('utf-8'))
        assert me['role'] == r, f"Role mismatch: {me['role']} != {r}"
        print(f"[OK] {r:16} | User: {u:18} -> {me.get('full_name')}")
        passed += 1
    except Exception as e:
        print(f"[FAIL] {r:16} | User: {u:18} -> {e}")

print(f"\nTotal Passed: {passed}/{len(roles)}")
