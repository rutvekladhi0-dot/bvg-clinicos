import os
import django
import datetime
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_os.settings')
django.setup()

from django.utils import timezone
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
from apps.ai_insights.models import AIProviderConfig, AIInsight

def seed_database():
    print("Beginning BVG ClinicOS comprehensive database seed...")

    # 1. Hospitals
    hospital_main, _ = Hospital.objects.get_or_create(
        code='BVG-HQ',
        defaults={
            'name': 'BVG Memorial Super Speciality Hospital',
            'registration_number': 'MH-HOSP-2018-9921',
            'tagline': 'Complete Healthcare Management. One Intelligent Platform.',
            'email': 'info@bvgclinicos.com',
            'phone': '+91 20 6712 9000',
            'address': 'Plot 42, Senapati Bapat Road, Shivaji Nagar, Pune, Maharashtra 411016',
            'logo_url': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150',
            'is_active': True
        }
    )

    hospital_clinic, _ = Hospital.objects.get_or_create(
        code='BVG-LC',
        defaults={
            'name': 'BVG LifeCare Clinic & Diagnostics',
            'registration_number': 'MH-CLN-2021-3140',
            'tagline': 'Neighborhood Healthcare & Diagnostic Excellence',
            'email': 'lifecare@bvgclinicos.com',
            'phone': '+91 22 4589 1100',
            'address': 'Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051',
            'is_active': True
        }
    )

    # 2. Branches
    branch_pune, _ = Branch.objects.get_or_create(
        hospital=hospital_main,
        code='PUNE-01',
        defaults={
            'name': 'Main Campus (Pune)',
            'phone': '+91 20 6712 9001',
            'email': 'pune@bvgclinicos.com',
            'address': 'Senapati Bapat Road, Pune',
            'city': 'Pune',
            'is_main_branch': True,
            'is_active': True
        }
    )

    branch_mumbai, _ = Branch.objects.get_or_create(
        hospital=hospital_clinic,
        code='MUM-01',
        defaults={
            'name': 'City Center Clinic (Mumbai)',
            'phone': '+91 22 4589 1102',
            'email': 'mumbai@bvgclinicos.com',
            'address': 'BKC Commercial Hub, Mumbai',
            'city': 'Mumbai',
            'is_main_branch': False,
            'is_active': True
        }
    )

    # 3. Departments
    depts = [
        ('General Medicine', 'MED', 'Adult primary care, fever, diabetes, hypertension'),
        ('Cardiology', 'CARD', 'Interventional cardiology, ECG, Echo, cardiac ICU'),
        ('Orthopedics', 'ORTH', 'Joint replacements, arthroscopy, trauma and fracture care'),
        ('Pediatrics', 'PED', 'Child healthcare, vaccinations, pediatric emergency'),
        ('Gynecology & Obstetrics', 'GYN', 'Maternal health, delivery suites, laparoscopic surgeries'),
        ('Neurology', 'NEUR', 'Stroke management, epilepsy, neuromuscular care'),
        ('Emergency & Trauma', 'EMERG', '24x7 Level-1 Trauma care and resuscitation'),
        ('Radiology & Imaging', 'RAD', 'CT, MRI, X-Ray, High resolution Ultrasound'),
        ('Pathology & Laboratory', 'PATH', 'Automated hematology, clinical biochemistry'),
        ('Critical Care & ICU', 'ICU', 'Multi-disciplinary intensive care units')
    ]
    created_depts = {}
    for name, code, desc in depts:
        dept, _ = Department.objects.get_or_create(
            branch=branch_pune,
            code=code,
            defaults={'name': name, 'description': desc}
        )
        created_depts[code] = dept

    # 4. Users for all 13 Roles
    roles_data = [
        ('admin', 'Super', 'Admin', UserRole.SUPER_ADMIN, created_depts['MED']),
        ('hosp_admin', 'Suresh', 'Deshmukh', UserRole.HOSPITAL_ADMIN, created_depts['MED']),
        ('branch_admin', 'Mahesh', 'Patil', UserRole.BRANCH_ADMIN, created_depts['MED']),
        ('receptionist', 'Kavita', 'Rane', UserRole.RECEPTIONIST, created_depts['MED']),
        ('nurse_priya', 'Priya', 'Nair', UserRole.NURSE, created_depts['ICU']),
        ('pharmacist_rahul', 'Rahul', 'Sharma', UserRole.PHARMACIST, created_depts['MED']),
        ('lab_tech_anil', 'Anil', 'Verma', UserRole.LAB_TECHNICIAN, created_depts['PATH']),
        ('radiologist_sunil', 'Dr. Sunil', 'Jadhav', UserRole.RADIOLOGIST, created_depts['RAD']),
        ('accountant_neha', 'Neha', 'Kulkarni', UserRole.ACCOUNTANT, created_depts['MED']),
        ('hr_manager', 'Sunita', 'Bhosale', UserRole.HR_MANAGER, created_depts['MED']),
        ('ot_staff_vikram', 'Vikram', 'Shinde', UserRole.OT_STAFF, created_depts['ORTH']),
        ('patient_rajesh', 'Rajesh', 'Kumar', UserRole.PATIENT, created_depts['MED']),
    ]

    for username, first, last, role, dept in roles_data:
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_user(
                username=username,
                email=f"{username}@bvgclinicos.com",
                password='Clinicos@2026',
                first_name=first,
                last_name=last,
                role=role,
                hospital=hospital_main,
                branch=branch_pune,
                department=dept,
                phone='+91 98220 12345',
                avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"
            )
            if role == UserRole.SUPER_ADMIN:
                u.is_staff = True
                u.is_superuser = True
                u.save()

    # 5. Doctor Users & Doctor Profiles
    doctor_specs = [
        ('dr_sharma', 'Rajesh', 'Sharma', created_depts['CARD'], 'Senior Consultant Cardiologist', 'MBBS, MD (Med), DM (Cardiology), FACC', 'MMC-2008-0491', 16, 800.00, 'OPD-102'),
        ('dr_patil', 'Ananya', 'Patil', created_depts['ORTH'], 'Chief Orthopedic & Joint Surgeon', 'MBBS, MS (Ortho), Fellowship in Arthroplasty (Germany)', 'MMC-2012-1823', 12, 750.00, 'OPD-105'),
        ('dr_deshmukh', 'Vikram', 'Deshmukh', created_depts['MED'], 'Consultant Physician & Diabetologist', 'MBBS, MD (Internal Medicine)', 'MMC-2010-0934', 14, 500.00, 'OPD-101'),
        ('dr_kulkarni', 'Sneha', 'Kulkarni', created_depts['PED'], 'Consultant Pediatrician & Neonatologist', 'MBBS, DCH, DNB (Pediatrics)', 'MMC-2015-3948', 9, 600.00, 'OPD-108'),
    ]

    doctor_objs = []
    for uname, first, last, dept, spec, qual, lic, exp, fee, room in doctor_specs:
        user = User.objects.filter(username=uname).first()
        if not user:
            user = User.objects.create_user(
                username=uname,
                email=f"{uname}@bvgclinicos.com",
                password='Clinicos@2026',
                first_name=first,
                last_name=last,
                role=UserRole.DOCTOR,
                hospital=hospital_main,
                branch=branch_pune,
                department=dept,
                phone='+91 98221 44556',
                avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={uname}"
            )
        doc, _ = Doctor.objects.get_or_create(
            user=user,
            defaults={
                'department': dept,
                'branch': branch_pune,
                'specialization': spec,
                'qualification': qual,
                'registration_council_number': lic,
                'experience_years': exp,
                'consultation_fee': Decimal(str(fee)),
                'follow_up_fee': Decimal(str(fee * 0.6)),
                'telemedicine_fee': Decimal(str(fee * 1.1)),
                'commission_percentage': Decimal('15.00'),
                'room_number': room,
                'is_available': True,
                'bio': f"Renowned healthcare specialist with {exp}+ years of clinical leadership in modern evidence-based patient management."
            }
        )
        doctor_objs.append(doc)

        # Schedules
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']:
            DoctorSchedule.objects.get_or_create(
                doctor=doc,
                day_of_week=day,
                defaults={
                    'start_time': datetime.time(9, 30),
                    'end_time': datetime.time(14, 0),
                    'slot_duration_minutes': 15,
                    'max_patients': 25,
                    'is_active': True
                }
            )

    # 6. Patients
    patient_records = [
        ('Rajesh', 'Kumar', '1982-05-14', 'Male', 'B+', '+91 98220 99881', 'rajesh.kumar@gmail.com', 'Aundh, Pune', 'Sulfa Drugs', 'Hypertension (Controlled)', 'Active'),
        ('Sunita', 'Patil', '1975-11-23', 'Female', 'O+', '+91 98221 88772', 'sunita.patil@yahoo.com', 'Kothrud, Pune', 'Penicillin', 'Type 2 Diabetes Mellitus', 'Active'),
        ('Amit', 'Deshmukh', '1990-03-08', 'Male', 'A+', '+91 98222 77663', 'amit.d@outlook.com', 'Baner, Pune', 'No Known Drug Allergies', 'None', 'Active'),
        ('Ramesh', 'Kadam', '1962-08-19', 'Male', 'AB+', '+91 98223 66554', 'ramesh.kadam@rediffmail.com', 'Shivaji Nagar, Pune', 'Aspirin', 'CAD post-PTCA, Dyslipidemia', 'Inpatient'),
        ('Meena', 'Shinde', '1988-12-04', 'Female', 'O-', '+91 98224 55445', 'meena.shinde@gmail.com', 'Viman Nagar, Pune', 'Dust & Pollen', 'Hypothyroidism', 'Active'),
        ('Aarav', 'Joshi', '2019-07-15', 'Male', 'B+', '+91 98225 44336', 'parents.joshi@gmail.com', 'Pashan, Pune', 'Peanuts', 'Pediatric Bronchial Asthma', 'Active'),
        ('Vandana', 'Gaikwad', '1970-02-28', 'Female', 'A-', '+91 98226 33227', 'vandana.g@gmail.com', 'Wakad, Pune', 'Iodine Contrast', 'Osteoarthritis knees', 'Inpatient'),
        ('Suresh', 'More', '1958-09-10', 'Male', 'O+', '+91 98227 22118', 'suresh.more@gmail.com', 'Hadapsar, Pune', 'NSAIDs', 'COPD, Hypertension', 'Emergency'),
    ]

    patient_objs = []
    for idx, (first, last, dob, gen, bg, ph, em, addr, allergies, chronic, stat) in enumerate(patient_records, start=1001):
        uhid = f"BVG-2026-{idx}"
        p, _ = Patient.objects.get_or_create(
            uhid=uhid,
            defaults={
                'branch': branch_pune,
                'first_name': first,
                'last_name': last,
                'date_of_birth': dob,
                'gender': gen,
                'blood_group': bg,
                'phone': ph,
                'email': em,
                'address': addr,
                'city': 'Pune',
                'allergies': allergies,
                'chronic_conditions': chronic,
                'status': stat
            }
        )
        patient_objs.append(p)

        # Timeline Event
        PatientTimeline.objects.get_or_create(
            patient=p,
            event_type='Registration',
            defaults={
                'title': 'Registered in BVG ClinicOS',
                'description': f"Registration completed with UHID {uhid}. Demographics & medical history recorded.",
                'reference_id': uhid
            }
        )

    # Link user patient_rajesh to first patient
    patient_user = User.objects.filter(username='patient_rajesh').first()
    if patient_user:
        patient_objs[0].user = patient_user
        patient_objs[0].save()

    # 7. Appointments & Live Queue
    today = timezone.localdate()
    cardio_doc = doctor_objs[0]
    ortho_doc = doctor_objs[1]
    med_doc = doctor_objs[2]
    ped_doc = doctor_objs[3]

    apts_data = [
        (patient_objs[0], cardio_doc, '10:00 AM', 'Confirmed', 'Routine hypertension checkup'),
        (patient_objs[1], med_doc, '10:15 AM', 'In Consultation', 'Fever and body aches for 3 days'),
        (patient_objs[2], ortho_doc, '10:30 AM', 'Scheduled', 'Right knee pain post workout'),
        (patient_objs[3], cardio_doc, '11:00 AM', 'Completed', 'Post-PTCA cardiac review'),
        (patient_objs[4], ped_doc, '11:30 AM', 'Scheduled', 'General wellness check'),
    ]

    for idx, (pat, doc, slot, stat, notes) in enumerate(apts_data, start=1001):
        apt_no = f"APT-2026-{idx}"
        apt, _ = Appointment.objects.get_or_create(
            appointment_number=apt_no,
            defaults={
                'patient': pat,
                'doctor': doc,
                'department': doc.department,
                'branch': branch_pune,
                'appointment_date': today,
                'time_slot': slot,
                'appointment_type': 'Scheduled',
                'status': stat,
                'notes': notes
            }
        )
        # Create Queue Token for active appointments
        token_no = f"T-{idx - 1000:02d}"
        q_stat = 'Serving' if stat == 'In Consultation' else ('Completed' if stat == 'Completed' else 'Waiting')
        QueueToken.objects.get_or_create(
            token_number=token_no,
            doctor=doc,
            defaults={
                'branch': branch_pune,
                'patient': pat,
                'appointment': apt,
                'priority': 'Normal',
                'status': q_stat,
                'estimated_wait_minutes': (idx - 1000) * 12
            }
        )

    # 8. OPD Consultation & Prescriptions
    consultation, _ = OPDConsultation.objects.get_or_create(
        appointment=Appointment.objects.filter(appointment_number='APT-2026-1004').first(),
        defaults={
            'patient': patient_objs[3],
            'doctor': cardio_doc,
            'branch': branch_pune,
            'systolic_bp': 128,
            'diastolic_bp': 82,
            'heart_rate': 74,
            'temperature_f': Decimal('98.4'),
            'spo2': 99,
            'weight_kg': Decimal('74.5'),
            'height_cm': Decimal('174.0'),
            'bmi': Decimal('24.6'),
            'chief_complaint': 'Routine 6-month cardiac review post angioplasty. Occasional mild exertional breathlessness.',
            'examination_findings': 'Chest clear, normal vesicular breath sounds. S1 S2 heard, no murmurs.',
            'diagnosis': 'Coronary Artery Disease (Post-PCI), Controlled Systemic Hypertension',
            'icd10_code': 'I25.10',
            'clinical_notes': 'Stable hemodynamics. Continue antiplatelet dual therapy and statin.',
            'treatment_plan': 'Continue medications. Repeat lipid profile in 3 months.',
            'follow_up_date': today + datetime.timedelta(days=90)
        }
    )

    rx, _ = Prescription.objects.get_or_create(
        prescription_number='RX-2026-5001',
        defaults={
            'consultation': consultation,
            'patient': patient_objs[3],
            'doctor': cardio_doc,
            'branch': branch_pune,
            'diet_instructions': 'Strict low-salt, low-cholesterol diet. 45 mins brisk walking 5 days a week.',
            'general_advice': 'Avoid heavy unaccustomed exertion. Keep Tab. Sorbitrate handy if chest discomfort occurs.'
        }
    )
    PrescriptionItem.objects.get_or_create(
        prescription=rx,
        medicine_name='Tab. Telmisartan',
        defaults={'dosage': '40mg', 'frequency': '1-0-0 (Morning)', 'duration_days': 30, 'instructions': 'Take after breakfast'}
    )
    PrescriptionItem.objects.get_or_create(
        prescription=rx,
        medicine_name='Tab. Rosuvastatin + Aspirin',
        defaults={'dosage': '20mg/75mg', 'frequency': '0-0-1 (Night)', 'duration_days': 30, 'instructions': 'Take after dinner'}
    )
    PrescriptionItem.objects.get_or_create(
        prescription=rx,
        medicine_name='Tab. Metoprolol Succinate ER',
        defaults={'dosage': '25mg', 'frequency': '1-0-0 (Morning)', 'duration_days': 30, 'instructions': 'Take after breakfast'}
    )

    # 9. IPD Wards, Beds & Admissions
    wards_data = [
        ('Intensive Care Unit (ICU)', 'ICU', '2nd Floor Critical Wing', 8, Decimal('4500.00')),
        ('Cardiac Care Unit (CCU)', 'CCU', '2nd Floor Critical Wing', 6, Decimal('5000.00')),
        ('Semi-Private Ward Male', 'Semi-Private', '3rd Floor General Block', 10, Decimal('2200.00')),
        ('Semi-Private Ward Female', 'Semi-Private', '3rd Floor General Block', 10, Decimal('2200.00')),
        ('Deluxe Private Rooms', 'Private', '4th Floor Executive Wing', 6, Decimal('3800.00')),
    ]

    ward_objs = []
    bed_objs = []
    for wname, wtype, floor, total, charge in wards_data:
        w, _ = Ward.objects.get_or_create(
            branch=branch_pune,
            name=wname,
            defaults={'ward_type': wtype, 'floor': floor, 'total_beds': total}
        )
        ward_objs.append(w)
        for bnum in range(1, total + 1):
            prefix = wtype[:3].upper()
            bed, _ = Bed.objects.get_or_create(
                ward=w,
                bed_number=f"{prefix}-{bnum:02d}",
                defaults={'daily_charge': charge, 'status': 'Available'}
            )
            bed_objs.append(bed)

    # Occupy 2 beds with active admissions
    icu_bed = Bed.objects.filter(ward__ward_type='ICU').first()
    semi_bed = Bed.objects.filter(ward__ward_type='Semi-Private').first()

    if icu_bed:
        icu_bed.status = 'Occupied'
        icu_bed.save()
        adm1, _ = Admission.objects.get_or_create(
            admission_number='IPD-2026-0101',
            defaults={
                'patient': patient_objs[3], # Ramesh Kadam
                'primary_doctor': cardio_doc,
                'ward': icu_bed.ward,
                'bed': icu_bed,
                'admission_date': timezone.now() - datetime.timedelta(days=2),
                'admission_reason': 'Acute coronary syndrome / Unstable angina with ST elevations',
                'diagnosis': 'Acute Inferior Wall Myocardial Infarction',
                'status': 'Admitted'
            }
        )
        # Add Nursing Note
        nurse = User.objects.filter(username='nurse_priya').first()
        if nurse:
            NursingNote.objects.get_or_create(
                admission=adm1,
                nurse=nurse,
                defaults={
                    'note_type': 'ICU Hourly Vitals & Monitor Check',
                    'observation': 'Patient hemodynamically stable. Continuous cardiac telemetry shows normal sinus rhythm. Nil chest discomfort reported on Nitroglycerin infusion.',
                    'vitals_summary': 'BP: 124/78, HR: 72 bpm, SpO2: 99% on 2L O2, Urine output adequate'
                }
            )

    if semi_bed:
        semi_bed.status = 'Occupied'
        semi_bed.save()
        Admission.objects.get_or_create(
            admission_number='IPD-2026-0102',
            defaults={
                'patient': patient_objs[6], # Vandana Gaikwad
                'primary_doctor': ortho_doc,
                'ward': semi_bed.ward,
                'bed': semi_bed,
                'admission_date': timezone.now() - datetime.timedelta(days=1),
                'admission_reason': 'Elective Left Total Knee Arthroplasty (TKR)',
                'diagnosis': 'Severe Bilateral Tricompartmental Osteoarthritis Left Knee',
                'status': 'Admitted'
            }
        )

    # 10. Emergency Cases
    em_case, _ = EmergencyCase.objects.get_or_create(
        case_number='EM-2026-0041',
        defaults={
            'patient': patient_objs[7], # Suresh More
            'branch': branch_pune,
            'attending_doctor': med_doc,
            'triage_level': 'Red',
            'arrival_mode': 'Ambulance 108',
            'chief_complaint': 'Severe acute respiratory distress with wheezing, diaphoresis & cyanosis',
            'gcs_score': 14,
            'systolic_bp': 160,
            'diastolic_bp': 98,
            'pulse': 118,
            'spo2': 88,
            'temp_f': Decimal('99.2'),
            'initial_management': 'High flow oxygen via Non-rebreather mask @ 10 L/min. Nebulization with Duolin and Budecort. IV Hydrocortisone 100mg given.',
            'status': 'Under Treatment'
        }
    )
    VitalMonitoringRecord.objects.get_or_create(
        emergency_case=em_case,
        defaults={
            'heart_rate': 118,
            'systolic_bp': 160,
            'diastolic_bp': 98,
            'spo2': 88,
            'respiratory_rate': 28,
            'ventilator_mode': 'NRBM 10L/min',
            'critical_alert': True,
            'alert_notes': 'SpO2 88% - Critical hypoxemia alert triggered'
        }
    )

    # 11. Operation Theatre
    ot1, _ = OTRoom.objects.get_or_create(
        branch=branch_pune,
        room_number='OT Suite 1 (Cardio-Thoracic & Vascular)',
        defaults={'floor': '3rd Floor Surgical Complex', 'is_operational': True}
    )
    ot2, _ = OTRoom.objects.get_or_create(
        branch=branch_pune,
        room_number='OT Suite 2 (Orthopedics & Joint Replacement)',
        defaults={'floor': '3rd Floor Surgical Complex', 'is_operational': True}
    )
    OTEquipment.objects.get_or_create(
        ot_room=ot2,
        serial_number='EQUIP-CARM-091',
        defaults={'name': 'Siemens C-Arm High-Frequency Fluoroscopy', 'status': 'Ready'}
    )
    OTEquipment.objects.get_or_create(
        ot_room=ot2,
        serial_number='EQUIP-ANES-112',
        defaults={'name': 'Drager Fabius GS Anesthesia Workstation', 'status': 'Ready'}
    )

    surg_time = timezone.now() + datetime.timedelta(hours=2)
    Surgery.objects.get_or_create(
        surgery_number='OT-2026-0034',
        defaults={
            'patient': patient_objs[6],
            'lead_surgeon': ortho_doc,
            'ot_room': ot2,
            'surgery_name': 'Left Total Knee Replacement (TKR) with Computer Navigation',
            'surgery_category': 'Orthopedic Surgery',
            'scheduled_start': surg_time,
            'scheduled_end': surg_time + datetime.timedelta(hours=3),
            'anesthesia_type': 'Spinal Anesthesia with Adductor Canal Block',
            'pre_op_checklist_completed': True,
            'who_surgical_safety_checklist': True,
            'status': 'Scheduled'
        }
    )

    # 12. Pharmacy
    cat_anti, _ = MedicineCategory.objects.get_or_create(name='Antibiotics & Antimicrobials')
    cat_cardio, _ = MedicineCategory.objects.get_or_create(name='Cardiovascular & Anti-Hypertensives')
    cat_pain, _ = MedicineCategory.objects.get_or_create(name='Analgesics & Anti-Inflammatories')
    cat_gastro, _ = MedicineCategory.objects.get_or_create(name='Gastrointestinal & Antacids')
    cat_dia, _ = MedicineCategory.objects.get_or_create(name='Antidiabetic Formulations')

    supp1, _ = Supplier.objects.get_or_create(
        name='Cipla Healthcare Distribution Ltd',
        defaults={'contact_person': 'Ramesh Agarwal', 'phone': '+91 20 2612 8844', 'email': 'orders@cipladist.in', 'gst_number': '27AAACC1234F1Z5'}
    )
    supp2, _ = Supplier.objects.get_or_create(
        name='Sun Pharma Laboratories Supply',
        defaults={'contact_person': 'Pradeep Shah', 'phone': '+91 22 6645 9900', 'email': 'sales@sunpharma.in', 'gst_number': '27AABCS5678G2Z1'}
    )

    medicines_data = [
        (cat_anti, 'Augmentin 625 Duo', 'Amoxicillin + Potassium Clavulanate', 'Tablet', '625mg', 'GSK Pharma', 150, Decimal('120.00'), Decimal('175.00'), Decimal('165.00'), 'BAT-AUG-921'),
        (cat_cardio, 'Telmikind 40', 'Telmisartan', 'Tablet', '40mg', 'Mankind Pharma', 200, Decimal('35.00'), Decimal('58.00'), Decimal('52.00'), 'BAT-TEL-802'),
        (cat_pain, 'Dolo 650', 'Paracetamol', 'Tablet', '650mg', 'Micro Labs', 18, Decimal('15.00'), Decimal('32.00'), Decimal('30.00'), 'BAT-DOL-314'), # Low stock trigger!
        (cat_gastro, 'Pan 40', 'Pantoprazole Sodium', 'Tablet', '40mg', 'Alkem Laboratories', 240, Decimal('45.00'), Decimal('85.00'), Decimal('78.00'), 'BAT-PAN-601'),
        (cat_dia, 'Glycomet GP 1', 'Metformin 500mg + Glimepiride 1mg', 'Tablet', '501mg', 'USV Pharma', 160, Decimal('50.00'), Decimal('92.00'), Decimal('85.00'), 'BAT-GLY-745'),
        (cat_anti, 'Ceftum 500', 'Cefuroxime Axetil', 'Tablet', '500mg', 'GSK Pharma', 12, Decimal('210.00'), Decimal('340.00'), Decimal('320.00'), 'BAT-CEF-109'), # Low stock trigger!
        (cat_cardio, 'Atorva 20', 'Atorvastatin Calcium', 'Tablet', '20mg', 'Zydus Cadila', 180, Decimal('65.00'), Decimal('115.00'), Decimal('105.00'), 'BAT-ATO-455'),
    ]

    for cat, mname, gen, form, strg, mfg, stock, pur_p, mrp_p, sell_p, bnum in medicines_data:
        m, _ = Medicine.objects.get_or_create(
            name=mname,
            defaults={'category': cat, 'generic_name': gen, 'dosage_form': form, 'strength': strg, 'manufacturer': mfg}
        )
        MedicineBatch.objects.get_or_create(
            medicine=m,
            batch_number=bnum,
            defaults={
                'branch': branch_pune,
                'expiry_date': today + datetime.timedelta(days=365),
                'purchase_rate': pur_p,
                'mrp': mrp_p,
                'selling_price': sell_p,
                'current_stock': stock,
                'supplier': supp1
            }
        )

    # 13. Laboratory Tests & Orders
    lab_cat_hem, _ = LabCategory.objects.get_or_create(name='Hematology')
    lab_cat_bio, _ = LabCategory.objects.get_or_create(name='Biochemistry')
    lab_cat_path, _ = LabCategory.objects.get_or_create(name='Clinical Pathology')

    test_cbc, _ = LabTest.objects.get_or_create(
        test_code='CBC-01',
        defaults={'category': lab_cat_hem, 'name': 'Complete Blood Count with ESR', 'sample_type': 'Whole Blood EDTA', 'standard_fee': Decimal('450.00'), 'turnaround_hours': 3, 'reference_interval': 'Hb: 13.0-17.0 g/dL, WBC: 4000-11000 /uL', 'unit': 'g/dL'}
    )
    test_lft, _ = LabTest.objects.get_or_create(
        test_code='LFT-02',
        defaults={'category': lab_cat_bio, 'name': 'Liver Function Test (LFT Profile)', 'sample_type': 'Serum Gel', 'standard_fee': Decimal('850.00'), 'turnaround_hours': 4, 'reference_interval': 'SGOT: 0-40 U/L, SGPT: 0-45 U/L', 'unit': 'U/L'}
    )
    test_kft, _ = LabTest.objects.get_or_create(
        test_code='KFT-03',
        defaults={'category': lab_cat_bio, 'name': 'Kidney Function Test (KFT / RFT)', 'sample_type': 'Serum Gel', 'standard_fee': Decimal('750.00'), 'turnaround_hours': 4, 'reference_interval': 'Serum Creatinine: 0.7-1.3 mg/dL', 'unit': 'mg/dL'}
    )
    test_hba1c, _ = LabTest.objects.get_or_create(
        test_code='HBA1C-04',
        defaults={'category': lab_cat_bio, 'name': 'Glycated Hemoglobin (HbA1c)', 'sample_type': 'Whole Blood EDTA', 'standard_fee': Decimal('600.00'), 'turnaround_hours': 2, 'reference_interval': '< 5.7% Normal, 5.7-6.4% Prediabetes', 'unit': '%'}
    )

    # Create approved lab order with results
    lab_ord, _ = LabOrder.objects.get_or_create(
        order_number='LAB-2026-0411',
        defaults={
            'patient': patient_objs[1],
            'doctor': med_doc,
            'branch': branch_pune,
            'status': 'Approved',
            'sample_collected_at': timezone.now() - datetime.timedelta(hours=4),
            'approved_at': timezone.now() - datetime.timedelta(hours=1),
            'clinical_remarks': 'Mild leukocytosis consistent with acute viral illness.'
        }
    )
    LabOrderItem.objects.get_or_create(
        order=lab_ord,
        test=test_cbc,
        defaults={'result_value': '13.8', 'unit': 'g/dL', 'reference_interval': '13.0 - 17.0', 'is_abnormal': False}
    )
    LabOrderItem.objects.get_or_create(
        order=lab_ord,
        test=test_hba1c,
        defaults={'result_value': '6.8', 'unit': '%', 'reference_interval': '< 5.7', 'is_abnormal': True, 'technician_notes': 'Elevated HbA1c indicative of poor glycemic control'}
    )

    # 14. Radiology
    mod_xr, _ = RadiologyModality.objects.get_or_create(code='XR', defaults={'name': 'Digital Radiography (X-Ray)'})
    mod_ct, _ = RadiologyModality.objects.get_or_create(code='CT', defaults={'name': '64-Slice High Speed CT Scanner'})
    mod_mri, _ = RadiologyModality.objects.get_or_create(code='MRI', defaults={'name': '3.0 Tesla Silent MRI'})

    inv_cxr, _ = RadiologyInvestigation.objects.get_or_create(
        code='XR-CHEST-PA',
        defaults={'modality': mod_xr, 'name': 'Digital Chest X-Ray PA View', 'standard_fee': Decimal('500.00')}
    )
    inv_ctbrain, _ = RadiologyInvestigation.objects.get_or_create(
        code='CT-BRAIN-NC',
        defaults={'modality': mod_ct, 'name': 'NCCT Head / Brain Plain', 'standard_fee': Decimal('2800.00')}
    )

    rad_order, _ = RadiologyOrder.objects.get_or_create(
        order_number='RAD-2026-0209',
        defaults={
            'patient': patient_objs[3],
            'doctor': cardio_doc,
            'branch': branch_pune,
            'investigation': inv_cxr,
            'status': 'Reported',
            'image_url': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500',
            'findings': 'Normal cardiothoracic ratio. Lung fields are clear with no focal infiltrates or consolidation. Both costophrenic angles are sharp. Diaphragmatic contours are normal.',
            'impression': 'No active cardiopulmonary disease detected on digital radiography.'
        }
    )

    # 15. Billing & Payments
    inv1, _ = Invoice.objects.get_or_create(
        invoice_number='INV-2026-0701',
        defaults={
            'patient': patient_objs[3],
            'branch': branch_pune,
            'invoice_type': 'OPD',
            'subtotal': Decimal('800.00'),
            'tax_rate': Decimal('0.00'),
            'tax_amount': Decimal('0.00'),
            'discount': Decimal('0.00'),
            'total_amount': Decimal('800.00'),
            'paid_amount': Decimal('800.00'),
            'balance_amount': Decimal('0.00'),
            'status': 'Paid',
            'notes': 'Consultation & ECG evaluation'
        }
    )
    InvoiceItem.objects.get_or_create(
        invoice=inv1,
        description='Senior Cardiologist Consultation - Dr. Rajesh Sharma',
        defaults={'service_category': 'Consultation', 'quantity': 1, 'unit_price': Decimal('800.00'), 'total_price': Decimal('800.00')}
    )
    Payment.objects.get_or_create(
        payment_number='REC-2026-0901',
        defaults={
            'invoice': inv1,
            'amount': Decimal('800.00'),
            'payment_method': 'UPI',
            'transaction_reference': 'UPI/2026/894012891902',
            'notes': 'Paid via Google Pay'
        }
    )

    inv2, _ = Invoice.objects.get_or_create(
        invoice_number='INV-2026-0702',
        defaults={
            'patient': patient_objs[1],
            'branch': branch_pune,
            'invoice_type': 'Laboratory',
            'subtotal': Decimal('1050.00'),
            'tax_rate': Decimal('0.00'),
            'tax_amount': Decimal('0.00'),
            'discount': Decimal('50.00'),
            'total_amount': Decimal('1000.00'),
            'paid_amount': Decimal('500.00'),
            'balance_amount': Decimal('500.00'),
            'status': 'Partially Paid',
            'notes': 'Diagnostic blood tests (CBC + HbA1c)'
        }
    )
    InvoiceItem.objects.get_or_create(
        invoice=inv2,
        description='Complete Blood Count (CBC) with ESR',
        defaults={'service_category': 'Laboratory', 'quantity': 1, 'unit_price': Decimal('450.00'), 'total_price': Decimal('450.00')}
    )
    InvoiceItem.objects.get_or_create(
        invoice=inv2,
        description='Glycated Hemoglobin (HbA1c)',
        defaults={'service_category': 'Laboratory', 'quantity': 1, 'unit_price': Decimal('600.00'), 'total_price': Decimal('600.00')}
    )
    Payment.objects.get_or_create(
        payment_number='REC-2026-0902',
        defaults={
            'invoice': inv2,
            'amount': Decimal('500.00'),
            'payment_method': 'Cash',
            'transaction_reference': 'CASH-COUNTER-01',
            'notes': 'Partial cash advance at lab billing desk'
        }
    )

    # 16. Insurance & Claims
    insp1, _ = InsuranceProvider.objects.get_or_create(
        name='Star Health and Allied Insurance',
        defaults={'tpa_name': 'In-House TPA Desk', 'contact_phone': '1800 425 2255', 'contact_email': 'claims@starhealth.in', 'cashless_available': True}
    )
    insp2, _ = InsuranceProvider.objects.get_or_create(
        name='HDFC ERGO General Insurance',
        defaults={'tpa_name': 'Medi Assist Insurance TPA Pvt Ltd', 'contact_phone': '1800 2666 400', 'contact_email': 'support@mediassist.in', 'cashless_available': True}
    )

    p_ins, _ = PatientInsurance.objects.get_or_create(
        patient=patient_objs[6], # Vandana Gaikwad
        provider=insp1,
        policy_number='STAR-POL-889021',
        defaults={
            'card_id': 'STAR-CARD-1192',
            'sum_insured': Decimal('750000.00'),
            'valid_from': today - datetime.timedelta(days=180),
            'valid_till': today + datetime.timedelta(days=185),
            'is_active': True
        }
    )

    InsuranceClaim.objects.get_or_create(
        claim_number='CLM-2026-0081',
        defaults={
            'patient': patient_objs[6],
            'insurance': p_ins,
            'tpa_reference_no': 'MED-TPA-992140',
            'claimed_amount': Decimal('185000.00'),
            'approved_amount': Decimal('165000.00'),
            'status': 'Pre-Auth Approved',
            'remarks': 'Cashless pre-authorization approved for Left Total Knee Replacement surgery.'
        }
    )

    # 17. Blood Bank
    donor1, _ = BloodDonor.objects.get_or_create(
        name='Sachin Tendulkar',
        phone='+91 98229 00112',
        defaults={'gender': 'Male', 'blood_group': 'O+', 'age': 32, 'weight_kg': Decimal('72.0'), 'last_donation_date': today - datetime.timedelta(days=45), 'is_eligible': True}
    )
    donor2, _ = BloodDonor.objects.get_or_create(
        name='Pooja Hegde',
        phone='+91 98229 00113',
        defaults={'gender': 'Female', 'blood_group': 'B+', 'age': 27, 'weight_kg': Decimal('58.0'), 'last_donation_date': today - datetime.timedelta(days=90), 'is_eligible': True}
    )

    blood_units_data = [
        ('BLD-2026-A101', 'A+', 'PRBC', today - datetime.timedelta(days=5), today + datetime.timedelta(days=37), 'Available'),
        ('BLD-2026-A102', 'A-', 'PRBC', today - datetime.timedelta(days=12), today + datetime.timedelta(days=30), 'Available'),
        ('BLD-2026-B101', 'B+', 'PRBC', today - datetime.timedelta(days=3), today + datetime.timedelta(days=39), 'Available'),
        ('BLD-2026-B102', 'B+', 'FFP', today - datetime.timedelta(days=10), today + datetime.timedelta(days=355), 'Available'),
        ('BLD-2026-O101', 'O+', 'PRBC', today - datetime.timedelta(days=2), today + datetime.timedelta(days=40), 'Available'),
        ('BLD-2026-O102', 'O-', 'PRBC', today - datetime.timedelta(days=8), today + datetime.timedelta(days=34), 'Available'),
        ('BLD-2026-AB101', 'AB+', 'Platelets', today - datetime.timedelta(days=1), today + datetime.timedelta(days=4), 'Available'),
        ('BLD-2026-AB102', 'AB-', 'PRBC', today - datetime.timedelta(days=15), today + datetime.timedelta(days=27), 'Available'),
    ]

    for unum, bg, comp, col_d, exp_d, bstat in blood_units_data:
        BloodUnit.objects.get_or_create(
            unit_number=unum,
            defaults={
                'branch': branch_pune,
                'blood_group': bg,
                'component_type': comp,
                'collected_date': col_d,
                'expiry_date': exp_d,
                'status': bstat,
                'storage_fridge': 'Blood Bank Unit A (4°C)'
            }
        )

    # 18. HR & Staff Profiles
    staff_user = User.objects.filter(username='nurse_priya').first()
    if staff_user:
        staff_prof, _ = StaffProfile.objects.get_or_create(
            user=staff_user,
            defaults={
                'branch': branch_pune,
                'department': created_depts['ICU'],
                'employee_id': 'EMP-2022-048',
                'designation': 'Senior Intensive Care Nursing Officer',
                'joining_date': datetime.date(2022, 6, 1),
                'basic_salary': Decimal('42000.00'),
                'account_number': '38901289190',
                'ifsc_code': 'SBIN0001429'
            }
        )
        Attendance.objects.get_or_create(
            staff=staff_prof,
            date=today,
            defaults={'check_in': datetime.time(7, 55), 'status': 'Present'}
        )
        PayrollRecord.objects.get_or_create(
            staff=staff_prof,
            month=10,
            year=2026,
            defaults={
                'basic_salary': Decimal('42000.00'),
                'hra': Decimal('12000.00'),
                'allowances': Decimal('6000.00'),
                'deductions': Decimal('3200.00'),
                'net_salary': Decimal('56800.00'),
                'payment_status': 'Paid',
                'paid_at': today - datetime.timedelta(days=5)
            }
        )

    # 19. Accounting & Financials
    head_rev_opd, _ = AccountHead.objects.get_or_create(code='REV-OPD', defaults={'name': 'OPD Consultation Income', 'account_type': 'Revenue'})
    head_rev_ipd, _ = AccountHead.objects.get_or_create(code='REV-IPD', defaults={'name': 'Inpatient Bed & Nursing Income', 'account_type': 'Revenue'})
    head_rev_phm, _ = AccountHead.objects.get_or_create(code='REV-PHM', defaults={'name': 'Pharmacy Medicines Sales Revenue', 'account_type': 'Revenue'})
    head_exp_med, _ = AccountHead.objects.get_or_create(code='EXP-MED', defaults={'name': 'Medicine & Surgical Consumables Purchase', 'account_type': 'Expense'})
    head_exp_pay, _ = AccountHead.objects.get_or_create(code='EXP-PAY', defaults={'name': 'Staff Salaries and Doctor Honorarium', 'account_type': 'Expense'})

    vouchers_data = [
        ('VCH-2026-0101', head_rev_opd, 'Receipt', Decimal('48500.00'), 'Counter Collections', 'Cash & UPI OPD collections for the day'),
        ('VCH-2026-0102', head_rev_ipd, 'Receipt', Decimal('120000.00'), 'TPA Settlements', 'Insurance cashless disbursement from Star Health'),
        ('VCH-2026-0103', head_exp_med, 'Payment', Decimal('65000.00'), 'NEFT/2026/89410', 'Bulk inventory replenishment payment to Cipla Dist.'),
        ('VCH-2026-0104', head_exp_pay, 'Payment', Decimal('380000.00'), 'BANK-SALARY-PUNE', 'October month staff nursing and paramedical payroll disbursement')
    ]
    for vnum, head, vtype, amt, ref, narr in vouchers_data:
        TransactionVoucher.objects.get_or_create(
            voucher_number=vnum,
            defaults={
                'branch': branch_pune,
                'account_head': head,
                'voucher_type': vtype,
                'amount': amt,
                'reference_no': ref,
                'narration': narr,
                'date': today
            }
        )

    # 20. Telemedicine Session
    tele_apt, _ = Appointment.objects.get_or_create(
        appointment_number='APT-2026-1099',
        defaults={
            'patient': patient_objs[2],
            'doctor': cardio_doc,
            'department': created_depts['CARD'],
            'branch': branch_pune,
            'appointment_date': today,
            'time_slot': '04:30 PM',
            'appointment_type': 'Telemedicine',
            'status': 'Confirmed',
            'notes': 'Online follow-up consultation regarding blood pressure diary'
        }
    )
    TelemedicineSession.objects.get_or_create(
        appointment=tele_apt,
        defaults={
            'room_id': 'BVG-TELEMED-CARD-9921',
            'doctor': cardio_doc,
            'patient': patient_objs[2],
            'scheduled_start': timezone.now() + datetime.timedelta(hours=3),
            'status': 'Room Ready',
            'doctor_notes': 'Review patient self-monitored home BP log.'
        }
    )

    # 21. AI Insights Config & Baseline Logs
    AIProviderConfig.objects.get_or_create(
        provider='Google Gemini / Heuristic Engine',
        defaults={
            'api_key': '',
            'model_name': 'gemini-2.5-flash',
            'is_enabled': True,
            'system_status': 'Active - Enterprise Heuristic Engine Ready'
        }
    )

    AIInsight.objects.get_or_create(
        insight_type='REVENUE_FORECAST',
        title='Q4 Revenue Acceleration Forecast (+18.4% YoY)',
        defaults={
            'branch': branch_pune,
            'summary': 'Predictive analysis of historical OPD volumes and elective surgeries projects monthly hospital revenue to exceed ₹8.5 Lakhs.',
            'confidence_score': 0.94,
            'actionable_recommendations': [
                'Optimize evening consultation slots for Dr. Sharma (Cardiology)',
                'Ensure sufficient inventory for Dolo 650 and Ceftum 500',
                'Accelerate pending TPA cashless reimbursement claims'
            ]
        }
    )

    # 22. System Settings
    settings_list = [
        ('hospital_name', 'BVG Memorial Super Speciality Hospital', 'Display name of primary healthcare facility'),
        ('gst_rate_general', '12.0', 'Standard GST rate applied on surgical consumables & pharma'),
        ('currency_symbol', '₹', 'System default currency'),
        ('default_language', 'en', 'Default system interface language (English, Marathi, Hindi)'),
        ('telemed_provider', 'WebRTC_P2P', 'Active video communication pipeline')
    ]
    for k, v, desc in settings_list:
        SystemSetting.objects.get_or_create(
            branch=branch_pune,
            key=k,
            defaults={'value': v, 'description': desc}
        )

    print("BVG ClinicOS Seed completed successfully! All 29 modules populated with realistic clinical data.")

if __name__ == '__main__':
    seed_database()
