"""
BVG ClinicOS - Production Database Backup & Restore Utility
Safely exports data from development/local SQLite and loads it into production Neon/Render PostgreSQL.
"""
import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKUP_FILE = BASE_DIR / "production_seed_backup.json"

def dump_data():
    print(f"Exporting BVG ClinicOS database records to {BACKUP_FILE}...")
    cmd = [
        sys.executable, "manage.py", "dumpdata",
        "--natural-foreign", "--natural-primary",
        "--exclude", "contenttypes",
        "--exclude", "auth.permission",
        "--indent", "2",
        "--output", str(BACKUP_FILE)
    ]
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    res = subprocess.run(cmd, cwd=str(BASE_DIR), env=env)
    if res.returncode == 0:
        print(f"-> SUCCESS: Database backup created successfully at {BACKUP_FILE.name}")
        return True
    else:
        print("-> ERROR: Failed to dump database.")
        return False

def load_data():
    if not BACKUP_FILE.exists():
        print(f"-> ERROR: Backup file {BACKUP_FILE} does not exist!")
        return False
    print(f"Importing database records from {BACKUP_FILE} into active database...")
    cmd = [
        sys.executable, "manage.py", "loaddata", str(BACKUP_FILE)
    ]
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    res = subprocess.run(cmd, cwd=str(BASE_DIR), env=env)
    if res.returncode == 0:
        print("-> SUCCESS: Database records loaded into active database successfully!")
        return True
    else:
        print("-> ERROR: Failed to load database.")
        return False

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'load':
        load_data()
    else:
        dump_data()
