import os
import django
import datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_os.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.core.models import Hospital, Branch, Department, User, UserRole, SystemSetting, AuditLog
from apps.patients.models import Patient, PatientDocument, PatientTimeline
from apps.doctors.models import Doctor, DoctorSchedule
from apps.appointments.models import Appointment
from apps.queues.models import QueueToken
from apps.clinical.models import OPDConsultation, Prescription, PrescriptionItem
from apps.ipd.models import Ward, Bed, Admission, NursingNote, MedicationAdministration
from apps.emergency.models import EmergencyCase, VitalMonitoringRecord
from apps.operation_theatre.models import OTRoom, Surgery, OTEquipment
from apps.pharmacy.models import MedicineCategory, Supplier, Medicine, MedicineBatch, PharmacySale, PharmacySaleItem
from apps.laboratory.models import LabCategory, LabTest, LabOrder, LabOrderItem
from apps.radiology.models import RadiologyModality, RadiologyInvestigation, RadiologyOrder
from apps.billing.models import Invoice, InvoiceItem, Payment
from apps.insurance.models import InsuranceProvider, PatientInsurance, InsuranceClaim
from apps.blood_bank.models import BloodDonor, BloodUnit, BloodRequest
from apps.hr.models import StaffProfile, Attendance, LeaveRequest, PayrollRecord
from apps.accounting.models import AccountHead, TransactionVoucher, DoctorCommission
from apps.telemedicine.models import TelemedicineSession

def seed_rich_demo_data():
    print("=" * 80)
    print("SEEDING COMPREHENSIVE RICH DEMO DATA FOR BVG CLINICOS")
    print("=" * 80)

    # 1. Hospital & Branch
    hospital, _ = Hospital.objects.get_or_create(
        code='BVG-HQ',
        defaults={
            'name': 'BVG Memorial Super Speciality Hospital',
            'registration_number': 'MH-HOSP-2018-9921',
            'tagline': 'Complete Healthcare Management. One Intelligent Platform.',
            'city': 'Pune',
            'address': 'Plot 42, Senapati Bapat Road, Shivaji Nagar, Pune, Maharashtra 411016',
            'is_active': True,
        }
    )

    branch, _ = Branch.objects.get_or_create(
        hospital=hospital,
        code='PUNE-01',
        defaults={
            'name': 'Main Campus (Pune)',
            'city': 'Pune',
            'phone': '+91 20 6712 9001',
            'email': 'pune@bvgclinicos.com',
            'address': 'Senapati Bapat Road, Pune 411016',
            'is_main_branch': True,
            'is_active': True,
        }
    )

    # 2. Departments
    depts_data = [
        ('Cardiology', 'CARD', 'Interventional cardiology, ECG, Echo, cardiac ICU'),
        ('Orthopedics', 'ORTH', 'Joint replacements, arthroscopy, trauma and fracture care'),
        ('General Medicine', 'MED', 'Adult primary care, fever, diabetes, hypertension'),
        ('Pediatrics', 'PED', 'Child healthcare, vaccinations, pediatric emergency'),
        ('General Surgery & Laparoscopy', 'SURG', 'Advanced laparoscopic and open abdominal surgeries'),
        ('Gynecology & Obstetrics', 'GYN', 'Maternal health, delivery suites, laparoscopic surgeries'),
        ('Neurology', 'NEUR', 'Stroke management, epilepsy, neuromuscular care'),
        ('Emergency & Trauma', 'EMERG', '24x7 Level-1 Trauma care and resuscitation'),
        ('Pathology & Laboratory', 'PATH', 'Automated hematology, clinical biochemistry'),
        ('Radiology & Imaging', 'RAD', 'CT, MRI, X-Ray, High resolution Ultrasound'),
    ]
    created_depts = {}
    for name, code, desc in depts_data:
        dept, _ = Department.objects.get_or_create(
            branch=branch,
            code=code,
            defaults={'name': name, 'description': desc, 'is_active': True}
        )
        created_depts[code] = dept

    # 3. All 13 User Personas with hashed password
    roles_users = [
        ('admin', 'SUPER_ADMIN', 'Super', 'Administrator', 'admin@bvgclinicos.com'),
        ('hosp_admin', 'HOSPITAL_ADMIN', 'Hospital', 'Administrator', 'hospadmin@bvgclinicos.com'),
        ('branch_admin', 'BRANCH_ADMIN', 'Branch', 'Director', 'branchadmin@bvgclinicos.com'),
        ('dr_sharma', 'DOCTOR', 'Rajiv', 'Sharma', 'dr.sharma@bvgclinicos.com'),
        ('receptionist', 'RECEPTIONIST', 'Pooja', 'Kulkarni', 'reception@bvgclinicos.com'),
        ('nurse_priya', 'NURSE', 'Priya', 'Nair', 'nurse.priya@bvgclinicos.com'),
        ('pharmacist_rahul', 'PHARMACIST', 'Rahul', 'Verma', 'pharma@bvgclinicos.com'),
        ('lab_tech_anil', 'LAB_TECHNICIAN', 'Anil', 'Deshmukh', 'lab@bvgclinicos.com'),
        ('radiologist_sunil', 'RADIOLOGIST', 'Sunil', 'Mehta', 'radio@bvgclinicos.com'),
        ('accountant_neha', 'ACCOUNTANT', 'Neha', 'Patel', 'accounts@bvgclinicos.com'),
        ('hr_manager', 'HR_MANAGER', 'Arjun', 'Kapoor', 'hr@bvgclinicos.com'),
        ('ot_staff_vikram', 'OT_STAFF', 'Vikram', 'Rathod', 'ot@bvgclinicos.com'),
        ('patient_rajesh', 'PATIENT', 'Rajesh', 'Chauhan', 'patient@bvgclinicos.com'),
    ]

    for uname, urole, fname, lname, email in roles_users:
        user = User.objects.filter(username=uname).first()
        if not user:
            user = User.objects.create_user(
                username=uname,
                email=email,
                password='Clinicos@2026',
                first_name=fname,
                last_name=lname,
                role=urole,
                hospital=hospital,
                branch=branch,
                is_staff=True,
                is_superuser=(urole == 'SUPER_ADMIN')
            )
        else:
            user.set_password('Clinicos@2026')
            user.role = urole
            user.branch = branch
            user.hospital = hospital
            user.save()

    print("[OK] All 13 User Personas verified and credentials set to 'Clinicos@2026'.")

    # 4. Doctors
    doctor_records = [
        ('dr_sharma', created_depts['CARD'], 'Senior Interventional Cardiologist', 'MBBS, MD, DM (Cardiology)', 'MMC-2010-4421', 14, 800.00, 'OPD-101'),
        ('dr_patil', created_depts['ORTH'], 'Chief Orthopedic & Joint Surgeon', 'MBBS, MS (Ortho), MCh', 'MMC-2012-1823', 12, 750.00, 'OPD-102'),
        ('dr_deshmukh', created_depts['SURG'], 'Senior Laparoscopic & GI Surgeon', 'MBBS, MS (General Surgery)', 'MMC-2011-3091', 13, 700.00, 'OPD-103'),
        ('dr_kulkarni', created_depts['PED'], 'Consultant Pediatrician & Neonatologist', 'MBBS, DCH, DNB (Pediatrics)', 'MMC-2015-3948', 9, 600.00, 'OPD-104'),
        ('dr_iyer', created_depts['GYN'], 'Consultant Obstetrician & Gynecologist', 'MBBS, MS (OBGYN), FICOG', 'MMC-2014-2287', 10, 650.00, 'OPD-105'),
        ('dr_joshi', created_depts['NEUR'], 'Consultant Neurologist', 'MBBS, MD, DM (Neurology)', 'MMC-2009-5112', 15, 900.00, 'OPD-106'),
        ('dr_sawant', created_depts['MED'], 'Consultant Physician & Diabetologist', 'MBBS, MD (Internal Medicine)', 'MMC-2016-7734', 8, 500.00, 'OPD-107'),
    ]

    created_docs = []
    for uname, dept, spec, qual, lic, exp, fee, room in doctor_records:
        user = User.objects.filter(username=uname).first()
        if not user:
            user = User.objects.create_user(
                username=uname,
                email=f"{uname}@bvgclinicos.com",
                password='Clinicos@2026',
                first_name=uname.replace('dr_', '').capitalize(),
                last_name='Specialist',
                role='DOCTOR',
                hospital=hospital,
                branch=branch,
                department=dept
            )
        doc, _ = Doctor.objects.get_or_create(
            user=user,
            defaults={
                'department': dept,
                'branch': branch,
                'specialization': spec,
                'qualification': qual,
                'registration_council_number': lic,
                'experience_years': exp,
                'consultation_fee': fee,
                'follow_up_fee': round(fee * 0.6, 2),
                'telemedicine_fee': round(fee * 1.1, 2),
                'room_number': room,
                'is_available': True,
                'bio': f'Renowned specialist with {exp}+ years clinical excellence.'
            }
        )
        created_docs.append(doc)

        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']:
            DoctorSchedule.objects.get_or_create(
                doctor=doc,
                day_of_week=day,
                defaults={
                    'start_time': '09:00:00',
                    'end_time': '17:00:00',
                    'slot_duration_minutes': 15,
                    'max_patients': 25,
                    'is_active': True,
                }
            )

    print(f"[OK] {len(created_docs)} Specialist Doctors verified with OPD schedules.")

    # 5. Patients with DIVERSE Registration Dates (Today, Yesterday, Day Before, Past Week)
    now = timezone.now()
    today_date = now.date()
    yesterday_date = today_date - datetime.timedelta(days=1)
    day_before_date = today_date - datetime.timedelta(days=2)
    three_days_ago = today_date - datetime.timedelta(days=3)
    five_days_ago = today_date - datetime.timedelta(days=5)
    last_week = today_date - datetime.timedelta(days=7)
    last_month = today_date - datetime.timedelta(days=30)

    patients_seed = [
        # Today
        ('Suresh', 'Kadam', 'Male', 'B+', '9822114455', 'suresh.kadam@example.com', 'Pune', 'Active', today_date, 'Hypertension, Diabetes'),
        ('Aniket', 'Deshpande', 'Male', 'O+', '9822336677', 'aniket.d@example.com', 'Kothrud, Pune', 'Active', today_date, 'Chest pain, ECG regular'),
        ('Pooja', 'Chavan', 'Female', 'A+', '9822558899', 'pooja.chavan@example.com', 'Shivaji Nagar, Pune', 'Emergency', today_date, 'Acute appendicitis'),

        # Yesterday (काल)
        ('Sunita', 'More', 'Female', 'AB+', '9833441122', 'sunita.more@example.com', 'Aundh, Pune', 'Active', yesterday_date, 'Fever, Cough, Viral prodrome'),
        ('Rajeshwari', 'Pawar', 'Female', 'B+', '9833552233', 'rajeshwari.pawar@example.com', 'Hadapsar, Pune', 'Active', yesterday_date, 'Knee joint osteoarthrosis'),
        ('Vijay', 'Gaikwad', 'Male', 'O-', '9833663344', 'vijay.g@example.com', 'Baner, Pune', 'Inpatient', yesterday_date, 'Dengue with thrombocytopenia'),

        # Day Before Yesterday (परवा)
        ('Ganesh', 'Shinde', 'Male', 'A+', '9844112233', 'ganesh.shinde@example.com', 'Wakad, Pune', 'Active', day_before_date, 'Severe migraine, vomiting'),
        ('Meena', 'Gokhale', 'Female', 'O+', '9844223344', 'meena.g@example.com', 'Kalyani Nagar, Pune', 'Discharged', day_before_date, 'Post laparoscopic cholecystectomy'),
        ('Rahul', 'Joshi', 'Male', 'B+', '9844334455', 'rahul.joshi@example.com', 'Viman Nagar, Pune', 'Active', day_before_date, 'Routine executive health checkup'),

        # Earlier this week & month
        ('Amitabh', 'Bapat', 'Male', 'AB+', '9855112233', 'amitabh.bapat@example.com', 'Deccan, Pune', 'Active', three_days_ago, 'Ischemic heart disease, CAD'),
        ('Kavita', 'Suryavanshi', 'Female', 'A-', '9855223344', 'kavita.s@example.com', 'Magarpatta, Pune', 'Inpatient', five_days_ago, 'Pneumonia consolidation'),
        ('Deepak', 'Kulkarni', 'Male', 'O+', '9855334455', 'deepak.k@example.com', 'Bavdhan, Pune', 'Active', last_week, 'Type-2 Diabetes mellitus review'),
        ('Shrikant', 'Patil', 'Male', 'B-', '9866112233', 'shrikant.p@example.com', 'Pimple Saudagar, Pune', 'Discharged', last_month, 'Lumbar spine decompression'),
    ]

    created_patients = []
    p_counter = 1001
    for first, last, gender, blood, phone, email, city, p_status, reg_date, conditions in patients_seed:
        patient = Patient.objects.filter(phone=phone).first()
        if not patient:
            while Patient.objects.filter(uhid=f"BVG-{today_date.year}-{p_counter:04d}").exists():
                p_counter += 1
            uhid = f"BVG-{today_date.year}-{p_counter:04d}"
            p_counter += 1
            patient = Patient.objects.create(
                branch=branch,
                uhid=uhid,
                first_name=first,
                last_name=last,
                gender=gender,
                blood_group=blood,
                phone=phone,
                email=email,
                date_of_birth='1985-06-15',
                address=f"{city}, Maharashtra",
                city=city,
                status=p_status,
                chronic_conditions=conditions,
                allergies='Penicillin' if 'appendicitis' in conditions else ''
            )
        # Update registration timestamp to match date filter
        reg_datetime = timezone.make_aware(datetime.datetime.combine(reg_date, datetime.time(10, 30)))
        Patient.objects.filter(id=patient.id).update(registered_at=reg_datetime)
        patient.refresh_from_db()
        created_patients.append(patient)

    print(f"[OK] {len(created_patients)} Patients seeded covering Today, Yesterday, Day Before Yesterday & Past Week.")

    # 6. Wards & Beds
    wards_seed = [
        ('General Medical Ward A', 'General', '1st Floor East Wing', 12),
        ('General Surgical Ward B', 'General', '1st Floor West Wing', 12),
        ('Intensive Care Unit (ICU)', 'ICU', '2nd Floor Critical Care Tower', 8),
        ('Coronary Care Unit (CCU)', 'CCU', '2nd Floor Cardiac Tower', 6),
        ('Deluxe Private Suites', 'Deluxe', '4th Floor Executive Wing', 6),
        ('Semi-Private Ward', 'Semi-Private', '3rd Floor South Wing', 8),
        ('Pediatric Ward', 'General', '3rd Floor Children Wing', 8),
    ]

    created_wards = []
    for wname, wtype, wfloor, bed_cnt in wards_seed:
        ward, _ = Ward.objects.get_or_create(
            branch=branch,
            name=wname,
            defaults={'ward_type': wtype, 'floor': wfloor, 'total_beds': bed_cnt, 'is_active': True}
        )
        created_wards.append(ward)

        # Seed Beds for this ward
        prefix = 'BED' if wtype == 'General' else ('ICU' if wtype == 'ICU' else ('CCU' if wtype == 'CCU' else ('DLX' if wtype == 'Deluxe' else 'SP')))
        rate = 1200 if wtype == 'General' else (4500 if wtype == 'ICU' else (4000 if wtype == 'CCU' else (3500 if wtype == 'Deluxe' else 2000)))
        features = 'Oxygen Port, Cardiac Monitor, Fowler Bed' if wtype in ['ICU', 'CCU'] else 'Oxygen Port, Standard Fowler Bed, Call Bell'

        for b_idx in range(1, bed_cnt + 1):
            b_num = f"{prefix}-{b_idx:02d}"
            # Make some occupied, some available
            b_status = 'Occupied' if (b_idx % 3 == 0) else ('Maintenance' if (b_idx == 7) else 'Available')
            Bed.objects.get_or_create(
                ward=ward,
                bed_number=b_num,
                defaults={'daily_charge': rate, 'features': features, 'status': b_status}
            )

    print(f"[OK] {len(created_wards)} Inpatient Wards and 60+ Beds provisioned.")

    # 7. OT Suites & Surgeries
    ot_suites = [
        ('OT-1 (Modular Cardiac & Hybrid Cath Suite)', '3rd Floor Surgical Complex', True, 'HEPA 100 Laminar Flow, Maquet Anesthesia Station, Philips C-Arm, Intra-Aortic Balloon Pump'),
        ('OT-2 (Joint Replacement & Ortho Trauma Suite)', '3rd Floor Surgical Complex', True, 'HEPA 100, Ortho Traction Table, Stryker Arthroscopy Tower, Fluoroscopy C-Arm'),
        ('OT-3 (General & Advanced Laparoscopy OT)', '3rd Floor Surgical Complex', True, 'Karl Storz 4K Laparoscopic Tower, Harmonic Scalpel, Draeger Workstation'),
        ('OT-4 (Robotic Surgery & Neuro-Navigation Suite)', '3rd Floor Surgical Complex', True, 'Da Vinci Xi Robotic System, Medtronic StealthStation Neuro-navigation, Zeiss Neuro Microscope'),
        ('OT-5 (Daycare & Emergency Trauma OT)', 'Ground Floor Emergency Trauma Bay', True, 'Rapid Resuscitation Console, Mobile C-Arm, Multipara Patient Monitors'),
    ]

    created_ot_rooms = []
    for r_num, floor, op, equip in ot_suites:
        room, _ = OTRoom.objects.get_or_create(
            branch=branch,
            room_number=r_num,
            defaults={'floor': floor, 'is_operational': op, 'equipment_details': equip}
        )
        created_ot_rooms.append(room)

    # Surgeries
    surgeries_seed = [
        (created_patients[0], created_docs[0], created_ot_rooms[0], 'Coronary Artery Bypass Grafting (CABG)', 'Cardiothoracic Surgery', 'General Anesthesia', 'Scheduled'),
        (created_patients[4], created_docs[1], created_ot_rooms[1], 'Total Knee Replacement (Right TKR)', 'Orthopedics', 'Spinal + Epidural', 'Completed'),
        (created_patients[2], created_docs[2], created_ot_rooms[2], 'Emergency Laparoscopic Appendectomy', 'General Surgery', 'General Anesthesia', 'In Recovery'),
        (created_patients[6], created_docs[2], created_ot_rooms[2], 'Laparoscopic Cholecystectomy', 'General Surgery', 'General Anesthesia', 'Scheduled'),
        (created_patients[9], created_docs[0], created_ot_rooms[0], 'Percutaneous Transluminal Coronary Angioplasty (PTCA)', 'Cardiology', 'Local + Sedation', 'Completed'),
    ]

    for idx, (p, doc, ot_rm, s_name, s_cat, anes, status) in enumerate(surgeries_seed):
        s_num = f"OT-2026-{101 + idx:04d}"
        s_start = now + datetime.timedelta(hours=(idx * 4 - 6))
        s_end = s_start + datetime.timedelta(hours=2)
        Surgery.objects.get_or_create(
            surgery_number=s_num,
            defaults={
                'patient': p,
                'lead_surgeon': doc,
                'ot_room': ot_rm,
                'surgery_name': s_name,
                'surgery_category': s_cat,
                'scheduled_start': s_start,
                'scheduled_end': s_end,
                'anesthesia_type': anes,
                'status': status,
                'pre_op_checklist_completed': True,
                'who_surgical_safety_checklist': True,
            }
        )

    print(f"[OK] {len(created_ot_rooms)} OT Suites and active surgeries verified.")

    # 8. Medicine Categories & 20+ Essential Medicines
    med_cats = [
        ('Antibiotics & Anti-infectives', 'Broad-spectrum penicillins, macrolides, cephalosporins'),
        ('Analgesics & Anti-inflammatory', 'NSAIDs, antipyretics, post-op pain management'),
        ('Cardiovascular & Antihypertensives', 'ARBs, ACE inhibitors, beta-blockers, statins'),
        ('Antidiabetic', 'Biguanides, sulfonylureas, DPP-4 inhibitors'),
        ('Gastrointestinal & Antacids', 'PPIs, H2 blockers, prokinetics, antiemetics'),
        ('Respiratory & Anti-allergic', 'Bronchodilators, antihistamines, corticosteroids'),
        ('IV Fluids & Electrolytes', 'Crystalloids, maintenance fluids, rehydration solutions'),
        ('Vitamins & Minerals', 'Hematinics, calcium supplements, multi-vitamins'),
    ]
    created_med_cats = {}
    for c_name, c_desc in med_cats:
        c, _ = MedicineCategory.objects.get_or_create(name=c_name, defaults={'description': c_desc})
        created_med_cats[c_name] = c

    medicines_catalog = [
        ('Augmentin 625 Duo', 'Amoxicillin + Clavulanic Acid', created_med_cats['Antibiotics & Anti-infectives'], 'Tablet', '625mg', 'GSK', 120.00, 204.00, 190.00, 180),
        ('Azithral 500', 'Azithromycin', created_med_cats['Antibiotics & Anti-infectives'], 'Tablet', '500mg', 'Alembic', 75.00, 132.00, 120.00, 150),
        ('Monocef 1g Inj', 'Ceftriaxone Sodium', created_med_cats['Antibiotics & Anti-infectives'], 'Injection', '1g', 'Aristo', 35.00, 68.00, 60.00, 220),
        ('Dolo 650', 'Paracetamol', created_med_cats['Analgesics & Anti-inflammatory'], 'Tablet', '650mg', 'Micro Labs', 18.00, 34.00, 30.00, 500),
        ('Dynapar AQ Inj', 'Diclofenac Sodium', created_med_cats['Analgesics & Anti-inflammatory'], 'Injection', '75mg/ml', 'Troikaa', 15.00, 32.00, 28.00, 250),
        ('Pan-D', 'Pantoprazole + Domperidone', created_med_cats['Gastrointestinal & Antacids'], 'Capsule', '40mg/30mg', 'Alkem', 95.00, 198.00, 180.00, 210),
        ('Ondem 4mg', 'Ondansetron', created_med_cats['Gastrointestinal & Antacids'], 'Tablet', '4mg', 'Alkem', 25.00, 52.00, 48.00, 160),
        ('Telma 40', 'Telmisartan', created_med_cats['Cardiovascular & Antihypertensives'], 'Tablet', '40mg', 'Glenmark', 65.00, 130.00, 115.00, 280),
        ('Amlong 5', 'Amlodipine Besylate', created_med_cats['Cardiovascular & Antihypertensives'], 'Tablet', '5mg', 'Micro Labs', 20.00, 45.00, 38.00, 200),
        ('Atorva 10', 'Atorvastatin', created_med_cats['Cardiovascular & Antihypertensives'], 'Tablet', '10mg', 'Zydus Cadila', 55.00, 110.00, 95.00, 190),
        ('Glycomet-GP 2', 'Metformin + Glimepiride', created_med_cats['Antidiabetic'], 'Tablet', '500mg/2mg', 'USV', 80.00, 165.00, 150.00, 310),
        ('Janumet 50/500', 'Sitagliptin + Metformin', created_med_cats['Antidiabetic'], 'Tablet', '50mg/500mg', 'MSD', 210.00, 340.00, 310.00, 140),
        ('Montair-LC', 'Montelukast + Levocetirizine', created_med_cats['Respiratory & Anti-allergic'], 'Tablet', '10mg/5mg', 'Cipla', 110.00, 220.00, 195.00, 175),
        ('Asthalin Inhaler', 'Salbutamol', created_med_cats['Respiratory & Anti-allergic'], 'Inhaler', '100mcg', 'Cipla', 95.00, 165.00, 150.00, 90),
        ('Budecort Respules 0.5mg', 'Budesonide', created_med_cats['Respiratory & Anti-allergic'], 'Inhaler', '0.5mg/2ml', 'Cipla', 22.00, 42.00, 38.00, 130),
        ('Electral ORS Sachet', 'Oral Rehydration Salts', created_med_cats['IV Fluids & Electrolytes'], 'Syrup', '21.8g', 'FDC', 12.00, 24.00, 22.00, 400),
        ('Ringer Lactate 500ml', 'Sodium Lactate Infusion', created_med_cats['IV Fluids & Electrolytes'], 'Injection', '500ml', 'Baxter', 30.00, 65.00, 55.00, 350),
        ('Shelcal 500', 'Calcium + Vitamin D3', created_med_cats['Vitamins & Minerals'], 'Tablet', '500mg', 'Torrent', 65.00, 125.00, 110.00, 220),
        ('Becosules', 'Vitamin B Complex + Vitamin C', created_med_cats['Vitamins & Minerals'], 'Capsule', 'Standard', 'Pfizer', 28.00, 54.00, 48.00, 320),
        ('Autolac Eye Drops', 'Carboxymethylcellulose', created_med_cats['Respiratory & Anti-allergic'], 'Drops', '0.5%', 'Sun Pharma', 85.00, 160.00, 140.00, 85),
    ]

    created_meds = []
    created_batches = []
    supplier, _ = Supplier.objects.get_or_create(
        name='Apollo Healthcare Distributors Ltd',
        defaults={'phone': '9822998877', 'email': 'sales@apollodist.com', 'is_active': True}
    )

    for m_name, g_name, cat, form, strg, mfg, p_rate, mrp, s_rate, stock in medicines_catalog:
        med, _ = Medicine.objects.get_or_create(
            name=m_name,
            defaults={
                'generic_name': g_name,
                'category': cat,
                'dosage_form': form,
                'strength': strg,
                'manufacturer': mfg,
                'reorder_threshold': 30
            }
        )
        created_meds.append(med)

        batch, _ = MedicineBatch.objects.get_or_create(
            medicine=med,
            batch_number=f"BAT-2026-{med.id:03d}",
            defaults={
                'branch': branch,
                'barcode': f"BAR-MED-{med.id:04d}",
                'expiry_date': today_date + datetime.timedelta(days=540),
                'purchase_rate': p_rate,
                'mrp': mrp,
                'selling_price': s_rate,
                'current_stock': stock,
                'supplier': supplier
            }
        )
        created_batches.append(batch)

    print(f"[OK] {len(created_meds)} Core Formularies and Batches configured.")

    # 9. Monthly Pharmacy Sales Data Across 11 Months of 2026 for Medicine Analytics
    months_sales_plan = [
        (datetime.date(2026, 1, 15), 18, 42000),
        (datetime.date(2026, 2, 14), 22, 49000),
        (datetime.date(2026, 3, 20), 25, 56000),
        (datetime.date(2026, 4, 18), 28, 62000),
        (datetime.date(2026, 5, 22), 32, 71000),
        (datetime.date(2026, 6, 19), 38, 85000),  # Monsoon surge in Antibiotics
        (datetime.date(2026, 7, 24), 45, 98000),  # Peak Monsoon
        (datetime.date(2026, 8, 20), 48, 105000), # Peak Viral & Antibiotics
        (datetime.date(2026, 9, 18), 42, 94000),
        (datetime.date(2026, 10, 22), 36, 82000), # Winter allergy onset
        (datetime.date(2026, 11, 5), 29, 68000),  # Current month
    ]

    sale_seq = 1001
    for m_date, sales_count, target_rev in months_sales_plan:
        # Check if sales already exist for this month
        existing_count = PharmacySale.objects.filter(created_at__year=m_date.year, created_at__month=m_date.month).count()
        if existing_count < 5:
            for s_idx in range(5):
                while PharmacySale.objects.filter(sale_number=f"PHM-2026-{sale_seq:04d}").exists():
                    sale_seq += 1
                s_num = f"PHM-2026-{sale_seq:04d}"
                sale_seq += 1
                p_item = created_patients[s_idx % len(created_patients)]

                # Pick batches according to seasonal trend
                if m_date.month in [6, 7, 8]:
                    # Monsoon: Augmentin, Azithral, Dolo, Pan-D
                    selected_batches = [created_batches[0], created_batches[1], created_batches[3]]
                elif m_date.month in [10, 11, 1, 2]:
                    # Winter: Montair-LC, Asthalin, Pan-D, Dolo
                    selected_batches = [created_batches[12], created_batches[13], created_batches[5]]
                else:
                    # Summer: Electral, Ringer Lactate, Ondem, Dolo
                    selected_batches = [created_batches[15], created_batches[6], created_batches[3]]

                subtotal = sum([float(b.selling_price) * 2 for b in selected_batches])
                tax = subtotal * 0.12
                net = subtotal + tax

                sale = PharmacySale.objects.create(
                    sale_number=s_num,
                    patient=p_item,
                    branch=branch,
                    subtotal=subtotal,
                    tax_amount=tax,
                    discount_amount=0,
                    net_amount=net,
                    payment_status='Paid',
                    payment_method='UPI' if s_idx % 2 == 0 else 'Cash'
                )

                # Set created_at to specific month
                sale_dt = timezone.make_aware(datetime.datetime.combine(m_date, datetime.time(11, s_idx * 10)))
                PharmacySale.objects.filter(id=sale.id).update(created_at=sale_dt)

                for b in selected_batches:
                    PharmacySaleItem.objects.create(
                        sale=sale,
                        batch=b,
                        quantity=2 + (s_idx % 3),
                        unit_price=b.selling_price,
                        total_price=float(b.selling_price) * (2 + (s_idx % 3))
                    )

    print("[OK] Monthly Pharmacy Sales and Item records generated across Jan - Nov 2026.")

    # 10. Financial Accounting Accounts & Vouchers
    acct_heads = [
        ('OPD Consultation Income', 'Revenue', 'REV-OPD', 'Receipts from outpatient doctor consultations'),
        ('IPD Bed & Nursing Charges', 'Revenue', 'REV-IPD', 'Inpatient accommodation and clinical bed billing'),
        ('Pharmacy Dispensing Revenue', 'Revenue', 'REV-PHM', 'Over-the-counter and prescription medicine sales'),
        ('Diagnostic Pathology & Lab Fees', 'Revenue', 'REV-LAB', 'Laboratory testing and blood work revenue'),
        ('Staff & Nursing Salaries', 'Expense', 'EXP-SAL', 'Monthly payroll compensation for clinical & frontdesk staff'),
        ('Bulk Pharmaceutical Purchases', 'Expense', 'EXP-PHM', 'Procurement of medications from distributors'),
        ('Doctor Procedure Commissions', 'Expense', 'EXP-DOC', 'Consultant fees for surgeries and OPD procedures'),
        ('Biomedical & Facilities Maintenance', 'Expense', 'EXP-MAINT', 'Maintenance of OT equipment, CT/MRI, generators'),
        ('Hospital Oxygen, Power & Utilities', 'Expense', 'EXP-UTIL', 'Electricity, liquid medical oxygen and city water bills'),
    ]

    created_heads = {}
    for hname, htype, hcode, hdesc in acct_heads:
        head = AccountHead.objects.filter(code=hcode).first()
        if not head:
            head, _ = AccountHead.objects.get_or_create(
                code=hcode,
                defaults={'name': hname, 'account_type': htype, 'description': hdesc}
            )
        created_heads[hname] = head

    # Vouchers across 6 months
    vch_seq = 101
    months_vch = [
        (datetime.date(2026, 6, 28), 240000, 160000),
        (datetime.date(2026, 7, 28), 275000, 175000),
        (datetime.date(2026, 8, 28), 310000, 190000),
        (datetime.date(2026, 9, 28), 335000, 205000),
        (datetime.date(2026, 10, 28), 360000, 218000),
        (datetime.date(2026, 11, 4), 385000, 230000),
    ]

    for m_date, rev_amt, exp_amt in months_vch:
        while TransactionVoucher.objects.filter(voucher_number=f"VCH-2026-{vch_seq:04d}").exists():
            vch_seq += 1
        v_num_rec = f"VCH-2026-{vch_seq:04d}"
        vch_seq += 1
        TransactionVoucher.objects.get_or_create(
            voucher_number=v_num_rec,
            defaults={
                'branch': branch,
                'account_head': created_heads['IPD Bed & Nursing Charges'],
                'voucher_type': 'Receipt',
                'amount': rev_amt,
                'payment_mode': 'Bank Transfer',
                'reference_no': f'NEFT-HOSP-{vch_seq}',
                'narration': f'Monthly consolidated inpatient receipts for {m_date.strftime("%B %Y")}',
                'date': m_date,
            }
        )

        while TransactionVoucher.objects.filter(voucher_number=f"VCH-2026-{vch_seq:04d}").exists():
            vch_seq += 1
        v_num_pay = f"VCH-2026-{vch_seq:04d}"
        vch_seq += 1
        TransactionVoucher.objects.get_or_create(
            voucher_number=v_num_pay,
            defaults={
                'branch': branch,
                'account_head': created_heads['Staff & Nursing Salaries'],
                'voucher_type': 'Payment',
                'amount': exp_amt,
                'payment_mode': 'Bank Transfer',
                'reference_no': f'SAL-NEFT-{vch_seq}',
                'narration': f'Staff and nursing disbursement for {m_date.strftime("%B %Y")}',
                'date': m_date,
            }
        )

    print("[OK] Financial Account Heads, Ledgers and Monthly P&L Vouchers populated.")

    # 11. Laboratory Diagnostic Tests & Orders
    lab_cats = [
        ('Biochemistry & Pathology', 'Clinical biochemistry, liver, renal and metabolic assays'),
        ('Hematology & Blood Counts', 'Complete blood counts, ESR, coagulation studies'),
        ('Microbiology & Serology', 'Infectious disease markers, Dengue, cultures'),
        ('Endocrinology & Hormones', 'Thyroid profile, HbA1c, hormonal evaluations'),
    ]
    created_lab_cats = {}
    for cname, cdesc in lab_cats:
        c, _ = LabCategory.objects.get_or_create(name=cname, defaults={'description': cdesc})
        created_lab_cats[cname] = c

    lab_tests_seed = [
        ('Complete Blood Count (CBC with Automated Differential)', 'CBC-01', created_lab_cats['Hematology & Blood Counts'], 'Whole Blood EDTA', 350.00, 2, 'Hemoglobin: 12.0 - 15.5 g/dL, WBC: 4000 - 11000 /uL, Platelets: 1.5 - 4.5 Lakhs', 'g/dL'),
        ('Liver Function Test (LFT Profile)', 'LFT-01', created_lab_cats['Biochemistry & Pathology'], 'Serum Gel Clot', 650.00, 4, 'Bilirubin Total: 0.2 - 1.2 mg/dL, SGOT/AST: < 40 U/L, SGPT/ALT: < 45 U/L', 'U/L'),
        ('Kidney Function Test (KFT / RFT with Electrolytes)', 'KFT-01', created_lab_cats['Biochemistry & Pathology'], 'Serum Gel Clot', 600.00, 4, 'Serum Creatinine: 0.6 - 1.2 mg/dL, Blood Urea: 15 - 40 mg/dL, Uric Acid: 3.5 - 7.2 mg/dL', 'mg/dL'),
        ('HbA1c Glycated Hemoglobin', 'HBA1C-01', created_lab_cats['Endocrinology & Hormones'], 'Whole Blood EDTA', 450.00, 3, 'Normal: < 5.7 %, Pre-diabetic: 5.7 - 6.4 %, Diabetic: >= 6.5 %', '%'),
        ('Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)', 'LIPID-01', created_lab_cats['Biochemistry & Pathology'], 'Serum Fasting 12 Hrs', 550.00, 4, 'Total Cholesterol: < 200 mg/dL, Triglycerides: < 150 mg/dL, HDL: > 40 mg/dL', 'mg/dL'),
        ('Thyroid Profile Total (T3, T4, TSH)', 'THY-01', created_lab_cats['Endocrinology & Hormones'], 'Serum Clot', 500.00, 5, 'TSH: 0.4 - 4.2 uIU/mL, Total T3: 0.8 - 2.0 ng/mL, Total T4: 5.1 - 14.1 ug/dL', 'uIU/mL'),
        ('Dengue Duo Antigen (NS1 + IgM / IgG Antibodies)', 'DENG-01', created_lab_cats['Microbiology & Serology'], 'Serum Clot', 900.00, 3, 'NS1 Antigen: Negative, IgM Antibodies: Negative', 'Index'),
        ('High-Sensitivity Cardiac Troponin-I', 'TROP-01', created_lab_cats['Biochemistry & Pathology'], 'Serum Clot Activator', 1100.00, 1, 'Troponin-I: < 0.04 ng/mL (Normal/Negative)', 'ng/mL'),
    ]

    created_tests = []
    for tname, tcode, cat, stype, fee, tat, ref, unit in lab_tests_seed:
        test, _ = LabTest.objects.get_or_create(
            test_code=tcode,
            defaults={
                'name': tname,
                'category': cat,
                'sample_type': stype,
                'standard_fee': fee,
                'turnaround_hours': tat,
                'reference_interval': ref,
                'unit': unit,
            }
        )
        created_tests.append(test)

    # Orders
    for o_idx in range(4):
        p = created_patients[o_idx]
        doc = created_docs[o_idx % len(created_docs)]
        o_num = f"LAB-2026-{1001 + o_idx:04d}"
        lab_order, _ = LabOrder.objects.get_or_create(
            order_number=o_num,
            defaults={
                'patient': p,
                'doctor': doc,
                'branch': branch,
                'status': 'Approved' if o_idx < 2 else 'Sample Collected',
                'sample_barcode': f"BAR-{o_num}",
                'clinical_remarks': 'Routine clinical correlation recommended.'
            }
        )
        for t_item in created_tests[:2]:
            LabOrderItem.objects.get_or_create(
                order=lab_order,
                test=t_item,
                defaults={
                    'result_value': '13.8' if 'CBC' in t_item.test_code else '0.9',
                    'unit': t_item.unit,
                    'reference_interval': t_item.reference_interval
                }
            )

    print(f"[OK] {len(created_tests)} Diagnostic Lab Tests Catalog and active Lab Orders configured.")

    print("\n" + "=" * 80)
    print("SUCCESS: ALL CLINICAL, PHARMACY, OT, BED & FINANCIAL DATA POPULATED!")
    print("=" * 80)

if __name__ == '__main__':
    seed_rich_demo_data()
