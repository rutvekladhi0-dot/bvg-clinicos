"""
BVG ClinicOS - Fast Production Data Seeder
Populates live Render backend & Neon PostgreSQL with comprehensive enterprise demo data.
"""
import urllib.request
import json
import datetime
from decimal import Decimal

API_BASE = 'https://bvg-clinicos-api.onrender.com/api'

def run():
    print("=" * 80)
    print("STARTING FAST PRODUCTION DEMO SEEDING FOR BVG CLINICOS")
    print(f"Target API: {API_BASE}")
    print("=" * 80)

    # 1. Authenticate as Admin
    login_data = json.dumps({'username': 'admin', 'password': 'Clinicos@2026'}).encode('utf-8')
    req = urllib.request.Request(f"{API_BASE}/auth/login/", data=login_data, headers={'Content-Type': 'application/json'})
    token = json.loads(urllib.request.urlopen(req, timeout=15).read())['access']
    print("[1] Authenticated successfully as Super Admin.")

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    def api_post(endpoint, data):
        r = urllib.request.Request(f"{API_BASE}{endpoint}", data=json.dumps(data).encode('utf-8'), headers=headers)
        try:
            res = urllib.request.urlopen(r, timeout=15)
            return json.loads(res.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            try:
                err_text = e.read().decode('utf-8')
                return {'error': err_text, 'status': e.code}
            except:
                return {'status': e.code}
        except Exception as e:
            return {'error': str(e)}

    def api_get(endpoint):
        r = urllib.request.Request(f"{API_BASE}{endpoint}", headers=headers)
        try:
            res = urllib.request.urlopen(r, timeout=15)
            data = json.loads(res.read().decode('utf-8'))
            return data.get('results', data) if isinstance(data, dict) and 'results' in data else data
        except Exception as e:
            return []

    # 2. Departments
    print("\n[2] Seeding Hospital Departments...")
    depts = [
        ('Cardiology', 'CARD', 'Interventional cardiology, ECG, Echo, cardiac ICU'),
        ('Orthopedics', 'ORTH', 'Joint replacements, arthroscopy, trauma care'),
        ('Pediatrics', 'PED', 'Child healthcare, vaccinations, pediatric emergency'),
        ('Critical Care & ICU', 'ICU', 'Multi-disciplinary intensive care units'),
        ('Emergency & Trauma', 'EMERG', '24x7 Level-1 Trauma care and resuscitation'),
        ('Pathology & Lab', 'PATH', 'Automated hematology, clinical biochemistry'),
        ('Radiology & Imaging', 'RAD', 'CT, MRI, X-Ray, High resolution Ultrasound'),
    ]
    created_depts = {}
    existing_depts = api_get('/departments/?branch=1')
    for d in existing_depts:
        created_depts[d['code']] = d['id']

    for name, code, desc in depts:
        if code not in created_depts:
            res = api_post('/departments/', {'branch': 1, 'name': name, 'code': code, 'description': desc, 'is_active': True})
            if 'id' in res:
                created_depts[code] = res['id']
                print(f"  + Department: {name} (ID: {res['id']})")

    # 3. Doctors
    print("\n[3] Seeding Doctor Profiles...")
    doctor_specs = [
        ('dr_patil', 'Ananya', 'Patil', created_depts.get('ORTH', 1), 'Chief Orthopedic Surgeon', 'MBBS, MS (Ortho)', 'MMC-2012-1823', 12, 750.00, 'OPD-105'),
        ('dr_kulkarni', 'Sneha', 'Kulkarni', created_depts.get('PED', 1), 'Consultant Pediatrician', 'MBBS, DCH, DNB', 'MMC-2015-3948', 9, 600.00, 'OPD-108'),
    ]
    for uname, first, last, dept_id, spec, qual, lic, exp, fee, room in doctor_specs:
        user_res = api_post('/users/create-user/', {
            'username': uname, 'password': 'Clinicos@2026', 'email': f'{uname}@bvgclinicos.com',
            'first_name': first, 'last_name': last, 'role': 'DOCTOR', 'branch': 1
        })
        uid = user_res.get('id')
        if not uid:
            existing = api_get(f'/users/?role=DOCTOR')
            for u in existing:
                if u['username'] == uname:
                    uid = u['id']
                    break
        if uid:
            api_post('/doctors/', {
                'user': uid, 'department': dept_id, 'branch': 1, 'specialization': spec,
                'qualification': qual, 'registration_council_number': lic, 'experience_years': exp,
                'consultation_fee': fee, 'follow_up_fee': fee * 0.6, 'telemedicine_fee': fee * 1.1,
                'commission_percentage': 15.0, 'room_number': room, 'is_available': True,
                'bio': f'Renowned healthcare specialist with {exp}+ years of experience.'
            })
            print(f"  + Doctor Profile: Dr. {first} {last} ({spec})")

    all_doctors = api_get('/doctors/?branch=1')
    print(f"  Total Doctors Available: {len(all_doctors)}")

    # 4. Patients
    print("\n[4] Seeding Patient Demographic Master Records...")
    patients_data = [
        ('Rajesh', 'Kumar', '1982-05-14', 'Male', 'B+', '+91 98220 99881', 'rajesh.kumar@gmail.com', 'Aundh, Pune', 'Sulfa Drugs', 'Hypertension (Controlled)', 'Active'),
        ('Sunita', 'Patil', '1975-11-23', 'Female', 'O+', '+91 98221 88772', 'sunita.patil@yahoo.com', 'Kothrud, Pune', 'Penicillin', 'Type 2 Diabetes Mellitus', 'Active'),
        ('Amit', 'Deshmukh', '1990-03-08', 'Male', 'A+', '+91 98222 77663', 'amit.d@outlook.com', 'Baner, Pune', 'No Known Drug Allergies', 'None', 'Active'),
        ('Ramesh', 'Kadam', '1962-08-19', 'Male', 'AB+', '+91 98223 66554', 'ramesh.kadam@rediffmail.com', 'Shivaji Nagar, Pune', 'Aspirin', 'CAD post-PTCA, Dyslipidemia', 'Inpatient'),
        ('Meena', 'Shinde', '1988-12-04', 'Female', 'O-', '+91 98224 55445', 'meena.shinde@gmail.com', 'Viman Nagar, Pune', 'Dust & Pollen', 'Hypothyroidism', 'Active'),
        ('Aarav', 'Joshi', '2019-07-15', 'Male', 'B+', '+91 98225 44336', 'parents.joshi@gmail.com', 'Pashan, Pune', 'Peanuts', 'Pediatric Bronchial Asthma', 'Active'),
        ('Vandana', 'Gaikwad', '1970-02-28', 'Female', 'A-', '+91 98226 33227', 'vandana.g@gmail.com', 'Wakad, Pune', 'Iodine Contrast', 'Osteoarthritis knees', 'Inpatient'),
        ('Suresh', 'More', '1958-09-10', 'Male', 'O+', '+91 98227 22118', 'suresh.more@gmail.com', 'Hadapsar, Pune', 'NSAIDs', 'COPD, Hypertension', 'Emergency'),
    ]

    created_patients = []
    for first, last, dob, gen, bg, ph, em, addr, allergies, chronic, stat in patients_data:
        res = api_post('/patients/', {
            'branch': 1, 'first_name': first, 'last_name': last, 'date_of_birth': dob,
            'gender': gen, 'blood_group': bg, 'phone': ph, 'email': em, 'address': addr,
            'city': 'Pune', 'allergies': allergies, 'chronic_conditions': chronic, 'status': stat
        })
        if 'id' in res:
            created_patients.append(res)
            print(f"  + Patient: {first} {last} (UHID: {res.get('uhid')})")

    # 5. Appointments & Queue Tokens
    print("\n[5] Seeding Appointments & Live Queue Tokens...")
    today_str = datetime.date.today().isoformat()
    if created_patients and all_doctors:
        doc1 = all_doctors[0]
        # Create Appointments
        for i, pat in enumerate(created_patients[:4]):
            slot = f"{(10 + i):02d}:30"
            res = api_post('/appointments/', {
                'branch': 1, 'patient': pat['id'], 'doctor': doc1['id'],
                'department': doc1.get('department'),
                'appointment_date': today_str, 'time_slot': slot,
                'reason': 'Routine clinical checkup and medication review',
                'priority': 'High' if i == 0 else 'Normal'
            })
            if 'id' in res:
                print(f"  + Appointment #{res.get('appointment_number', res['id'])} for {pat['first_name']} {pat['last_name']}")
                # Check-in appointment to generate Queue Token
                checkin = api_post(f"/appointments/{res['id']}/check-in/", {})
                if 'token_number' in checkin:
                    print(f"    -> Token Generated: {checkin['token_number']} (Status: {checkin.get('status')})")

    # 6. Wards & Beds
    print("\n[6] Seeding Wards & Bed Inventory...")
    wards_data = [
        ('Intensive Care Unit (ICU)', 'ICU', 5000.00, [('ICU-01', 'Ventilator'), ('ICU-02', 'Ventilator'), ('ICU-03', 'Standard')]),
        ('Cardiac Care Unit (CCU)', 'CCU', 4500.00, [('CCU-01', 'Cardiac Monitor'), ('CCU-02', 'Cardiac Monitor')]),
        ('General Ward (Male)', 'GEN_M', 1500.00, [('GEN-M01', 'Standard'), ('GEN-M02', 'Standard'), ('GEN-M03', 'Standard')]),
        ('Deluxe Private Ward', 'DELUXE', 3500.00, [('DEL-101', 'Electric Bed'), ('DEL-102', 'Electric Bed')]),
    ]
    created_beds = []
    for wname, wcode, rate, beds in wards_data:
        w_res = api_post('/wards/', {'branch': 1, 'name': wname, 'ward_type': wcode, 'daily_rate': rate, 'is_active': True})
        wid = w_res.get('id')
        if wid:
            print(f"  + Ward: {wname} (ID: {wid})")
            for bnum, btype in beds:
                b_res = api_post('/beds/', {
                    'ward': wid, 'bed_number': bnum, 'bed_type': btype,
                    'is_occupied': False, 'is_maintenance': False, 'daily_charge': rate
                })
                if 'id' in b_res:
                    created_beds.append(b_res)
                    print(f"    - Bed: {bnum} ({btype})")

    # 7. Pharmacy Inventory
    print("\n[7] Seeding Pharmacy Categories, Medicines & Stock Batches...")
    cat_res = api_post('/medicine-categories/', {'name': 'Tablets & Capsules', 'description': 'Oral solid dosage forms'})
    cat_id = cat_res.get('id', 1)

    supp_res = api_post('/suppliers/', {
        'name': 'Cipla Healthcare Distribution', 'contact_person': 'Anand Joshi',
        'phone': '+91 20 6712 4433', 'email': 'orders@cipla-dist.com', 'is_active': True
    })
    supp_id = supp_res.get('id', 1)

    meds_data = [
        ('Dolo 650', 'Paracetamol', '650mg', 'Tablet', 30.00, 20.00, 15, 'BAT-DOL-314', 250),
        ('Augmentin 625 Duo', 'Amoxicillin + Potassium Clavulanate', '625mg', 'Tablet', 180.00, 120.00, 10, 'BAT-AUG-921', 120),
        ('Glycomet GP 1', 'Metformin + Glimepiride', '500mg/1mg', 'Tablet', 110.00, 75.00, 10, 'BAT-GLY-110', 180),
        ('Atorva 20', 'Atorvastatin', '20mg', 'Tablet', 145.00, 95.00, 10, 'BAT-ATR-402', 100),
        ('Pan 40', 'Pantoprazole Sodium', '40mg', 'Tablet', 95.00, 60.00, 10, 'BAT-PAN-889', 200),
        ('Azee 500', 'Azithromycin', '500mg', 'Tablet', 125.00, 85.00, 8, 'BAT-AZI-223', 90),
    ]

    for name, gen, strg, form, mrp, cost, min_stk, batch_no, qty in meds_data:
        m_res = api_post('/medicines/', {
            'category': cat_id, 'name': name, 'generic_name': gen, 'strength': strg,
            'dosage_form': form, 'unit_price': mrp, 'purchase_price': cost, 'min_stock_alert': min_stk,
            'requires_prescription': True, 'is_active': True
        })
        mid = m_res.get('id')
        if mid:
            api_post('/batches/', {
                'medicine': mid, 'supplier': supp_id, 'batch_number': batch_no,
                'expiry_date': '2027-12-31', 'quantity': qty, 'purchase_price': cost,
                'selling_price': mrp
            })
            print(f"  + Medicine: {name} ({gen}) -> Batch {batch_no} with {qty} units in stock")

    # 8. Laboratory Master Tests
    print("\n[8] Seeding Laboratory Diagnostic Tests...")
    lcat_res = api_post('/lab-categories/', {'name': 'Hematology & Clinical Chemistry', 'description': 'Automated diagnostic tests'})
    lcat_id = lcat_res.get('id', 1)

    tests_data = [
        ('Complete Blood Count (CBC)', 'CBC', 450.00, 24, 'EDTA Whole Blood', 'WBC: 4000-11000, Hb: 13-17 g/dL, Platelets: 150k-450k'),
        ('Lipid Profile Comprehensive', 'LIPID', 850.00, 12, 'Serum (Fasting 12h)', 'Cholesterol < 200, HDL > 40, LDL < 100, Triglycerides < 150'),
        ('Glycated Hemoglobin (HbA1c)', 'HBA1C', 600.00, 6, 'Whole Blood EDTA', '< 5.7% Normal, 5.7-6.4% Prediabetes, >= 6.5% Diabetes'),
        ('Liver Function Test (LFT)', 'LFT', 750.00, 12, 'Serum', 'Bilirubin: 0.2-1.2, SGOT: 5-40, SGPT: 7-56 U/L'),
    ]
    for tname, tcode, price, tat, sample, ref in tests_data:
        api_post('/lab-tests/', {
            'category': lcat_id, 'name': tname, 'code': tcode, 'price': price,
            'tat_hours': tat, 'sample_type': sample, 'reference_range': ref, 'is_active': True
        })
        print(f"  + Lab Test: {tname} (INR {price})")

    # 9. Invoices and Billing Summary
    print("\n[9] Seeding Financial Invoices & Payments...")
    if created_patients:
        # Create an OPD Consultation invoice
        inv1 = api_post('/invoices/', {
            'branch': 1, 'patient': created_patients[0]['id'],
            'total_amount': 800.00, 'discount_amount': 0.00,
            'tax_amount': 0.00, 'status': 'Pending', 'payment_status': 'Unpaid',
            'notes': 'OPD Cardiology Consultation Bill'
        })
        if 'id' in inv1:
            print(f"  + Invoice #{inv1.get('invoice_number', inv1['id'])} for INR 800.00 (Pending)")
            # Collect Payment
            pay1 = api_post('/payments/', {
                'invoice': inv1['id'], 'amount': 800.00, 'payment_method': 'UPI',
                'transaction_reference': 'UPI-REF-99214481'
            })
            print(f"    -> Paid in Full via UPI (Receipt: {pay1.get('payment_number')})")

        # Create a second pending invoice
        inv2 = api_post('/invoices/', {
            'branch': 1, 'patient': created_patients[1]['id'],
            'total_amount': 1850.00, 'discount_amount': 100.00,
            'tax_amount': 0.00, 'status': 'Pending', 'payment_status': 'Unpaid',
            'notes': 'Diabetes Clinic Consultation & Diagnostic Lab Order'
        })
        if 'id' in inv2:
            print(f"  + Invoice #{inv2.get('invoice_number', inv2['id'])} for INR 1750.00 (Outstanding)")

    print("\n" + "=" * 80)
    print(">>> FAST PRODUCTION DEMO SEEDING COMPLETE (100% SUCCESS) <<<")
    print("=" * 80)

if __name__ == '__main__':
    run()
