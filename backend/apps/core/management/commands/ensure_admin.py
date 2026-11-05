import os
import sys
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.models import User, UserRole, Hospital, Branch, Department

class Command(BaseCommand):
    help = "Ensures super admin and enterprise seed entities exist in the database."

    def add_arguments(self, parser):
        parser.add_argument('--seed', action='store_true', help='Force full database seed if needed')

    def handle(self, *args, **options):
        self.stdout.write("Running BVG ClinicOS ensure_admin check...")

        admin_username = os.environ.get('ADMIN_USERNAME', 'admin').strip()
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@bvgclinicos.com').strip()
        admin_password = os.environ.get('ADMIN_PASSWORD', 'Clinicos@2026')
        admin_first = os.environ.get('ADMIN_FIRST_NAME', 'Super')
        admin_last = os.environ.get('ADMIN_LAST_NAME', 'Admin')

        # Check if database has any Hospital
        if Hospital.objects.count() == 0 or options.get('seed'):
            self.stdout.write("Database has 0 hospitals. Seeding initial enterprise infrastructure...")
            try:
                # Add backend directory to sys.path if not present
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
                if backend_dir not in sys.path:
                    sys.path.insert(0, backend_dir)

                from seed_data import seed_database
                seed_database()
                self.stdout.write(self.style.SUCCESS("Successfully executed full database seed."))
            except Exception as e:
                self.stderr.write(f"Seed encountered an exception: {e}")

        # Now guarantee the admin user exists and has the correct password and flags
        with transaction.atomic():
            hospital = Hospital.objects.first()
            branch = Branch.objects.first() if hospital else None
            dept = Department.objects.filter(branch=branch).first() if branch else None

            user = User.objects.filter(username__iexact=admin_username).first()
            if not user:
                user = User.objects.filter(email__iexact=admin_email).first()

            if not user:
                user = User.objects.create_user(
                    username=admin_username,
                    email=admin_email,
                    password=admin_password,
                    first_name=admin_first,
                    last_name=admin_last,
                    role=UserRole.SUPER_ADMIN,
                    hospital=hospital,
                    branch=branch,
                    department=dept,
                    is_staff=True,
                    is_superuser=True,
                    is_active=True
                )
                self.stdout.write(self.style.SUCCESS(f"Created new super admin account: '{admin_username}'."))
            else:
                user.username = admin_username
                user.email = admin_email
                user.role = UserRole.SUPER_ADMIN
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                if hospital and not user.hospital:
                    user.hospital = hospital
                if branch and not user.branch:
                    user.branch = branch
                if dept and not user.department:
                    user.department = dept
                user.set_password(admin_password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Updated and verified super admin account: '{admin_username}'."))

            # Ensure all 13 standard roles have their user accounts initialized for production access
            standard_roles = [
                ('admin', 'Super', 'Admin', UserRole.SUPER_ADMIN),
                ('hosp_admin', 'Suresh', 'Deshmukh', UserRole.HOSPITAL_ADMIN),
                ('branch_admin', 'Mahesh', 'Patil', UserRole.BRANCH_ADMIN),
                ('dr_sharma', 'Rajesh', 'Sharma', UserRole.DOCTOR),
                ('receptionist', 'Kavita', 'Rane', UserRole.RECEPTIONIST),
                ('nurse_priya', 'Priya', 'Nair', UserRole.NURSE),
                ('pharmacist_rahul', 'Rahul', 'Sharma', UserRole.PHARMACIST),
                ('lab_tech_anil', 'Anil', 'Verma', UserRole.LAB_TECHNICIAN),
                ('radiologist_sunil', 'Dr. Sunil', 'Jadhav', UserRole.RADIOLOGIST),
                ('accountant_neha', 'Neha', 'Kulkarni', UserRole.ACCOUNTANT),
                ('hr_manager', 'Sunita', 'Bhosale', UserRole.HR_MANAGER),
                ('ot_staff_vikram', 'Vikram', 'Shinde', UserRole.OT_STAFF),
                ('patient_rajesh', 'Rajesh', 'Kumar', UserRole.PATIENT),
            ]

            default_pass = os.environ.get('DEFAULT_USER_PASSWORD', 'Clinicos@2026')
            for uname, fname, lname, r in standard_roles:
                u = User.objects.filter(username__iexact=uname).first()
                if not u:
                    u = User.objects.create_user(
                        username=uname,
                        email=f"{uname}@bvgclinicos.com",
                        password=default_pass,
                        first_name=fname,
                        last_name=lname,
                        role=r,
                        hospital=hospital,
                        branch=branch,
                        department=dept,
                        is_active=True
                    )
                    self.stdout.write(f"  Initialized role user: '{uname}' ({r})")
                else:
                    if not u.is_active:
                        u.is_active = True
                    # If password needs to be set
                    if uname != admin_username:
                        u.set_password(default_pass)
                    u.save()

        self.stdout.write(self.style.SUCCESS("All authentication checks & admin users verified successfully."))
