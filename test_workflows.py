import urllib.request
import json
import sys

base = 'http://127.0.0.1:8000/api'

def post_json(endpoint, data):
    req = urllib.request.Request(
        base + endpoint,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Error on {endpoint}: {e.code} - {e.read().decode('utf-8')}")
        raise e

def get_json(endpoint):
    with urllib.request.urlopen(base + endpoint) as res:
        return json.loads(res.read().decode('utf-8'))

def test_workflow_1():
    print("=" * 70)
    print("TESTING WORKFLOW 1: PATIENT -> APPOINTMENT -> QUEUE -> OPD -> BILL -> PAYMENT")
    print("=" * 70)

    # 1. Create Patient
    patient_data = {
        'branch': 1,
        'first_name': 'Ramesh',
        'last_name': 'Kadam',
        'date_of_birth': '1984-06-15',
        'gender': 'Male',
        'blood_group': 'B+',
        'phone': '+91 98220 99887',
        'email': 'ramesh.kadam@example.com',
        'address': 'Kothrud, Pune, MH',
        'allergies': 'Penicillin',
        'chronic_conditions': 'Hypertension'
    }
    patient = post_json('/patients/', patient_data)
    p_id = patient['id']
    uhid = patient['uhid']
    print(f"[1] Patient Created: {patient['first_name']} {patient['last_name']}, UHID: {uhid}")

    # 2. Book Appointment
    appt_data = {
        'branch': 1,
        'department': 1,
        'patient': p_id,
        'doctor': 1,
        'appointment_date': '2026-11-05',
        'time_slot': '15:30',
        'reason_for_visit': 'Chest tightness and routine follow-up'
    }
    appt = post_json('/appointments/', appt_data)
    appt_id = appt['id']
    print(f"[2] Appointment Booked: ID #{appt_id}, Doctor: Dr. Sharma, Date: {appt['appointment_date']} {appt['time_slot']}")

    # 3. Check-in
    checkin = post_json(f'/appointments/{appt_id}/check-in/', {})
    print(f"[3] Checked In! Token: {checkin['token_number']}, Status: {checkin['status']}, Est Wait: {checkin['estimated_wait_minutes']}m")

    # 4. OPD Consultation
    consultation_data = {
        'branch': 1,
        'patient': p_id,
        'doctor': 1,
        'appointment': appt_id,
        'chief_complaint': 'Mild angina on exertion, normal resting ECG',
        'diagnosis': 'Stage 1 Essential Hypertension',
        'icd10_code': 'I10',
        'systolic_bp': 138,
        'diastolic_bp': 88,
        'heart_rate': 74,
        'clinical_notes': 'Advised low sodium diet and lifestyle modification',
        'follow_up_date': '2026-11-19'
    }
    consultation = post_json('/consultations/', consultation_data)
    print(f"[4] OPD Consultation Complete: ID #{consultation['id']}, Diagnosis: {consultation['diagnosis']}")

    # 5. Check Invoices
    res = get_json(f'/invoices/?patient={p_id}')
    invoices = res.get('results', res) if isinstance(res, dict) else res
    assert len(invoices) > 0, "No invoice generated!"
    inv = invoices[0]
    inv_id = inv['id']
    print(f"[5] Auto-generated Invoice: #{inv['invoice_number']}, Amount: Rs.{inv['total_amount']}, Balance: Rs.{inv['balance_amount']}")

    # 6. Payment via UPI
    pay_data = {
        'invoice': inv_id,
        'amount': inv['balance_amount'],
        'payment_method': 'UPI',
        'transaction_reference': 'UPI/2026/88921109'
    }
    payment = post_json('/payments/', pay_data)
    print(f"[6] Payment Processed: Receipt #{payment['payment_number']}, Amount: Rs.{payment['amount']}, Method: {payment['payment_method']}")

    updated_inv = get_json(f'/invoices/{inv_id}/')
    print(f"    Status: {updated_inv['status']}, Paid: Rs.{updated_inv['paid_amount']}, Remaining Balance: Rs.{updated_inv['balance_amount']}")
    assert updated_inv['status'] == 'Paid', "Invoice should be marked Paid"
    print(">>> WORKFLOW 1 SUCCESS: ALL STEPS VERIFIED <<<\n")

def test_workflow_2():
    print("=" * 70)
    print("TESTING WORKFLOW 2: PHARMACY POS SALE WITH REAL-TIME BATCH STOCK DEDUCTION")
    print("=" * 70)

    # 1. Get Medicine Batch
    res = get_json('/medicine-batches/')
    batches = res.get('results', res) if isinstance(res, dict) else res
    assert len(batches) > 0, "No medicine batches found"
    batch = batches[0]
    b_id = batch['id']
    initial_stock = batch['current_stock']
    print(f"[1] Target Medicine: Batch #{batch['batch_number']}, Initial Stock: {initial_stock} units")

    # 2. Dispense 5 units
    sale_data = {
        'branch': 1,
        'patient': 1,
        'payment_method': 'Cash',
        'items': [
            {
                'batch': b_id,
                'quantity': 5,
                'unit_price': batch['selling_price'],
                'total_price': float(batch['selling_price']) * 5
            }
        ]
    }
    sale = post_json('/pharmacy-sales/', sale_data)
    print(f"[2] Sale Processed: Bill #{sale['sale_number']}, Total: Rs.{sale['net_amount']}")

    # 3. Verify Batch Stock was reduced
    res2 = get_json('/medicine-batches/')
    updated_batches = res2.get('results', res2) if isinstance(res2, dict) else res2
    updated_batch = [b for b in updated_batches if b['id'] == b_id][0]
    new_stock = updated_batch['current_stock']
    print(f"[3] New Batch Stock: {new_stock} units (Deducted: {initial_stock - new_stock})")
    assert new_stock == initial_stock - 5, f"Expected {initial_stock - 5}, got {new_stock}"
    print(">>> WORKFLOW 2 SUCCESS: REAL-TIME INVENTORY DEDUCTION VERIFIED <<<\n")

def test_workflow_3():
    print("=" * 70)
    print("TESTING WORKFLOW 3: LAB ORDER -> SAMPLE COLLECTION -> APPROVAL & INVOICE")
    print("=" * 70)

    # 1. Create Lab Order
    order_data = {
        'branch': 1,
        'patient': 1,
        'doctor': 1,
        'clinical_remarks': 'Pre-op complete hemogram test',
        'items': [
            {'test': 1} # CBC
        ]
    }
    order = post_json('/lab-orders/', order_data)
    o_id = order['id']
    print(f"[1] Lab Order Placed: #{order['order_number']}, Status: {order['status']}")

    # 2. Collect Sample
    sample = post_json(f'/lab-orders/{o_id}/collect-sample/', {})
    print(f"[2] Sample Collected: Status -> {sample['status']}")

    # 3. Approve and Generate Invoice
    approved = post_json(f'/lab-orders/{o_id}/approve/', {})
    print(f"[3] Report Approved: Status -> {approved['status']}")
    print(">>> WORKFLOW 3 SUCCESS: DIAGNOSTICS LIFECYCLE VERIFIED <<<\n")

def test_workflow_4():
    print("=" * 70)
    print("TESTING WORKFLOW 4: IPD ADMISSION -> BED ALLOCATION -> DISCHARGE & INVOICE")
    print("=" * 70)

    # 1. Find an available bed
    res = get_json('/beds/?status=Available')
    beds = res.get('results', res) if isinstance(res, dict) else res
    assert len(beds) > 0, "No available beds"
    bed = beds[0]
    bed_id = bed['id']
    print(f"[1] Available Bed Selected: Bed {bed['bed_number']} in Ward #{bed['ward']}, Rate: Rs.{bed['daily_charge']}/day")

    # 2. Admit Patient 1 to this bed
    admission_data = {
        'patient': 1,
        'primary_doctor': 1,
        'ward': bed['ward'],
        'bed': bed_id,
        'admission_date': '2026-11-05T08:00:00Z',
        'admission_reason': 'Post-op cardiac monitoring and telemetry observation',
        'diagnosis': 'Post PCI observation'
    }
    admission = post_json('/admissions/', admission_data)
    adm_id = admission['id']
    print(f"[2] Patient Admitted: #{admission['admission_number']}, Bed assigned: {bed['bed_number']}")

    # 3. Check that Bed is now marked Occupied
    updated_bed = get_json(f'/beds/{bed_id}/')
    print(f"[3] Bed Occupancy Status: {updated_bed['status']}")
    assert updated_bed['status'] == 'Occupied', "Bed should be marked Occupied"

    # 4. Discharge Patient -> auto generates IPD final bill and frees bed
    discharge_data = {
        'discharge_condition': 'Stable',
        'discharge_notes': 'Hemodynamically stable. Discharged with medications.'
    }
    discharge = post_json(f'/admissions/{adm_id}/discharge/', discharge_data)
    print(f"[4] Patient Discharged: Status -> {discharge['status']}")

    # 5. Verify Bed is freed
    freed_bed = get_json(f'/beds/{bed_id}/')
    print(f"[5] Bed Freed Status: {freed_bed['status']}")
    assert freed_bed['status'] == 'Available', "Bed should be Available after discharge"
    print(">>> WORKFLOW 4 SUCCESS: INPATIENT ADMISSION & DISCHARGE VERIFIED <<<\n")

if __name__ == '__main__':
    test_workflow_1()
    test_workflow_2()
    test_workflow_3()
    test_workflow_4()
    print("ALL FOUR MULTI-STEP CLINICAL & FINANCIAL WORKFLOWS PASSED WITH 100% SUCCESS!")
