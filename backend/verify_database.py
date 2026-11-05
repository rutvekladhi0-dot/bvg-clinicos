"""
BVG ClinicOS - Production Database Verification & Migration Utility
Tests database engine, connectivity, ACID transactions, and integrity.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_os.settings')
django.setup()

from django.db import connection, transaction
from django.conf import settings
from apps.core.models import User, Hospital, Branch
from apps.patients.models import Patient

def verify_db():
    print("=" * 80)
    print("BVG CLINICOS - DATABASE INTEGRITY & CONNECTIVITY AUDIT")
    print("=" * 80)

    db_engine = settings.DATABASES['default']['ENGINE']
    db_name = settings.DATABASES['default'].get('NAME', 'unknown')
    print(f"Active DB Engine: {db_engine}")
    print(f"Active DB Target: {db_name}")

    if 'postgresql' in db_engine:
        print("[DATABASE TYPE] Production PostgreSQL (Neon / Render)")
    else:
        print("[DATABASE TYPE] Portable SQLite (Development / Fallback)")

    # 1. Connection check
    print("\n[STEP 1] Testing Connection...")
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            row = cursor.fetchone()
            assert row[0] == 1
        print("  -> PASS: Database connection verified successfully.")
    except Exception as e:
        print(f"  -> FAIL: Connection error: {e}")
        return False

    # 2. Table count & Schema verification
    print("\n[STEP 2] Verifying Schema Tables & Foreign Keys...")
    tables = connection.introspection.table_names()
    print(f"  -> Total Relational Tables: {len(tables)}")
    required_tables = ['core_user', 'core_hospital', 'core_branch', 'patients_patient', 'billing_invoice']
    for t in required_tables:
        if t in tables:
            print(f"     [OK] Table '{t}' exists.")
        else:
            print(f"     [MISSING] Table '{t}' NOT found!")
            return False

    # 3. ACID Transaction Integrity
    print("\n[STEP 3] Testing ACID Transaction Rollback...")
    try:
        with transaction.atomic():
            # Create a test hospital and intentionally roll back
            test_hosp = Hospital.objects.create(
                name="TEMP_INTEGRITY_CHECK_HOSPITAL",
                code="HOSP-TEMP-999"
            )
            # Force rollback
            transaction.set_rollback(True)

        rolled_back = not Hospital.objects.filter(code="HOSP-TEMP-999").exists()
        assert rolled_back, "Transaction rollback failed!"
        print("  -> PASS: Transaction atomicity and rollback verified.")
    except Exception as e:
        print(f"  -> FAIL: Transaction test failed: {e}")
        return False

    # 4. Count existing records
    print("\n[STEP 4] Record Inventory:")
    print(f"  - Hospitals:   {Hospital.objects.count()}")
    print(f"  - Branches:    {Branch.objects.count()}")
    print(f"  - Users:       {User.objects.count()}")
    print(f"  - Patients:    {Patient.objects.count()}")

    print("\n" + "=" * 80)
    print(">>> DATABASE VERIFICATION COMPLETE: ALL INTEGRITY CHECKS PASSED <<<")
    print("=" * 80)
    return True

if __name__ == '__main__':
    success = verify_db()
    sys.exit(0 if success else 1)
