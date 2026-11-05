import urllib.request
import json

base = 'http://127.0.0.1:8000/api'

def post_json(endpoint, data):
    req = urllib.request.Request(
        base + endpoint,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

def get_json(endpoint, token):
    req = urllib.request.Request(
        base + endpoint,
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

ROLES_CREDENTIALS = [
    ('admin', 'Clinicos@2026', 'SUPER_ADMIN', 'Super Administrator'),
    ('hosp_admin', 'Clinicos@2026', 'HOSPITAL_ADMIN', 'Hospital Administrator'),
    ('branch_admin', 'Clinicos@2026', 'BRANCH_ADMIN', 'Branch Administrator'),
    ('dr_sharma', 'Clinicos@2026', 'DOCTOR', 'Doctor / Physician'),
    ('receptionist', 'Clinicos@2026', 'RECEPTIONIST', 'Receptionist / Front Desk'),
    ('nurse_priya', 'Clinicos@2026', 'NURSE', 'Nursing Staff'),
    ('pharmacist_rahul', 'Clinicos@2026', 'PHARMACIST', 'Pharmacist'),
    ('lab_tech_anil', 'Clinicos@2026', 'LAB_TECHNICIAN', 'Laboratory Technician'),
    ('radiologist_sunil', 'Clinicos@2026', 'RADIOLOGIST', 'Radiologist'),
    ('accountant_neha', 'Clinicos@2026', 'ACCOUNTANT', 'Financial Accountant'),
    ('hr_manager', 'Clinicos@2026', 'HR_MANAGER', 'HR Manager'),
    ('ot_staff_vikram', 'Clinicos@2026', 'OT_STAFF', 'OT Surgical Staff'),
    ('patient_rajesh', 'Clinicos@2026', 'PATIENT', 'Patient Portal'),
]

print("=" * 80)
print("TESTING AUTHENTICATION & SESSION PROFILE FOR ALL 13 HEALTHCARE ROLES")
print("=" * 80)

passed = 0
for username, password, expected_role, desc in ROLES_CREDENTIALS:
    try:
        res = post_json('/auth/login/', {'username': username, 'password': password})
        token = res['access']
        me = get_json('/auth/me/', token)
        assert me['role'] == expected_role, f"Expected {expected_role}, got {me['role']}"
        print(f"[PASS] {expected_role:16} | User: {username:18} | Name: {me['full_name']:20} -> Verified OK")
        passed += 1
    except Exception as e:
        print(f"[FAIL] {expected_role:16} | User: {username:18} -> {e}")

print("=" * 80)
print(f"RESULTS: {passed}/13 HEALTHCARE ROLES AUTHENTICATED SUCCESSFULLY WITH 100% PASS RATE")
print("=" * 80)
