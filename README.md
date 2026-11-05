# BVG ClinicOS
### Enterprise Hospital & Clinic Management System
> **"Complete Healthcare Management. One Intelligent Platform."**

---

## 🌟 Overview

**BVG ClinicOS** is a comprehensive, production-ready, full-stack Hospital Management System designed for multi-branch hospitals, specialized clinics, and tertiary care medical centers. Built with enterprise software engineering standards, BVG ClinicOS unifies clinical workflows, diagnostics, surgical suites, pharmacy inventory, revenue cycle management, multi-tenant branch operations, and artificial intelligence into a cohesive digital health ecosystem.

The system is architected for strict regulatory compliance with **DPDP Act (India 2023)** and **HIPAA (USA)** standards, including immutable audit trails, role-based access control across 13 healthcare personas, and live tri-lingual localization in **English**, **मराठी (Marathi)**, and **हिंदी (Hindi)**.

---

## 🚀 Live Servers & Local Access

| Service | Address | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | [http://127.0.0.1:5173/](http://127.0.0.1:5173/) | **ACTIVE** | React 19 + TypeScript + Vite + Tailwind CSS |
| **Backend API** | [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/) | **ACTIVE** | Django REST Framework + SimpleJWT |
| **Admin Portal** | [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/) | **ACTIVE** | Django Superuser Administration |

---

## 🔑 Demo Access & Role Accounts

All demo accounts share the standard password: `Clinicos@2026`

| Persona | Username | Default Password | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin` | `Clinicos@2026` | Enterprise multi-hospital oversight, RBAC matrix, audit compliance |
| **Hospital Administrator** | `hospadmin` | `Clinicos@2026` | Campus-level operations, master rosters, bed governance |
| **Branch Administrator** | `branchadmin` | `Clinicos@2026` | Branch-specific department scheduling & inventory transfers |
| **Doctor / Physician** | `dr.sharma` | `Clinicos@2026` | OPD consultations, clinical notes, digital Rx, lab orders |
| **Receptionist / Front Desk** | `reception` | `Clinicos@2026` | Walk-in registration, appointment booking, queue token dispatch |
| **Nursing Staff** | `nurse.anita` | `Clinicos@2026` | IPD ward vitals, medication administration records (MAR), rounds |
| **Pharmacist** | `pharmacist` | `Clinicos@2026` | POS counter, batch expiry tracking, real-time inventory deduction |
| **Lab Technician** | `labtech` | `Clinicos@2026` | Specimen collection, barcode scan, pathology analyzer results |
| **Radiologist** | `radiologist` | `Clinicos@2026` | X-Ray/CT/MRI/Ultrasound imaging reports and diagnostic impressions |
| **Financial Accountant** | `accountant` | `Clinicos@2026` | Invoicing, multi-method payments (UPI/Cash/Card), P&L ledgers |
| **HR Manager** | `hrmanager` | `Clinicos@2026` | Staff profiles, attendance logs, leave approvals, payroll slips |
| **OT Surgical Staff** | `otstaff` | `Clinicos@2026` | Surgery scheduling, WHO Surgical Safety checklist, OT equipment |
| **Patient Portal** | `patient` | `Clinicos@2026` | Appointments, prescription history, lab reports download, bill payment |

> **1-Click Role Switcher**: Use the **"Demo Roles"** tab on the Login page or the persona badge in the Top Header to switch between any of the 13 roles instantly.

---

## 🏗️ Technical Architecture & Technology Stack

### Frontend
- **Framework**: React 19, TypeScript
- **Tooling**: Vite 8.3
- **Styling**: Tailwind CSS (Deep Teal Palette: Primary `#0F766E`, Secondary `#14B8A6`, Neutral `#F8FAFC`), PostCSS, Autoprefixer
- **UI Components & Icons**: Lucide React, Shadcn/UI styled modals, badges, cards, data tables
- **Charts & Visualizations**: Recharts (Interactive Area, Bar, and Donut charts)
- **Routing**: React Router v7 (`BrowserRouter`, lazy fallbacks, deep linking)
- **State & Context**: React Context API (`AuthContext` with role switching, branch switching, dark mode, toast alerts, language persistence)
- **Localization**: Live i18n dictionary for English, Marathi (`mr`), Hindi (`hi`)

### Backend
- **Framework**: Python 3.14, Django 6.1.3, Django REST Framework 3.18.3
- **Authentication**: JWT (`rest_framework_simplejwt`) with 2FA-ready architecture
- **Database**: SQLite (local development zero-config) with native PostgreSQL support via `dj_database_url`
- **Reports & Exporting**: 
  - `reportlab` for dynamic PDF executive and clinical report generation
  - `openpyxl` for Excel workbook report generation (`.xlsx`)
- **Real-Time & AI**:
  - WebRTC Video Telemedicine suite
  - Heuristic clinical AI NLP query engine (`/api/ai/query/`)
  - Deterministic drug-interaction guardrails and hospital bed demand forecasting

---

## 📦 Implemented Modules (29 Enterprise Modules)

1. **Comprehensive Dashboard**: Real-time KPI counters (patients, doctors, OPD, IPD, occupied beds, emergency cases, revenue, pending labs, low stock alerts), 6-month revenue Recharts area chart, department productivity bar chart, recent activities log.
2. **Patient Master (EMR)**: Auto UHID generator (`BVG-YYYY-XXXX`), personal details, medical history, allergies, chronic conditions, emergency contacts, status badges, complete EMR drawer.
3. **Appointment Scheduling**: Doctor-wise & department-wise scheduling, time slot picker, calendar view, walk-in check-in with auto queue token generation, rescheduling, cancellation.
4. **Queue Management**: Doctor-wise waiting queues, triage priority order (Emergency > Senior Citizen > Pediatric > Normal), live wait-time estimation, "Now Serving" LCD display board with 5s auto-refresh, "Call Next" and "Complete Token" actions.
5. **Doctor Management**: Specialty, qualifications, department, live availability toggle switch, consultation fees, commission percentage, duty scheduling.
6. **OPD Clinical Consultations**: Physiological vitals recording (BP, pulse, temp, SpO2, weight, BMI), ICD-10 diagnosis, clinical notes, treatment plans, follow-up scheduler, digital prescription builder, auto-invoicing.
7. **Inpatient (IPD) & Bed Management**: Interactive ward & bed grid (General, Semi-Private, Private, Deluxe, ICU, CCU, NICU, Emergency), admission intake modal, nursing progress notes, Medication Administration Records (MAR), discharge workflow with automated room-rate bill calculation.
8. **ICU & Emergency Management**: Emergency intake triage (Red: Immediate, Orange: Very Urgent, Yellow: Urgent, Green: Standard), physiological vital monitoring records, critical alert indicators.
9. **Operation Theatre (OT) Management**: Surgical suite scheduling, surgeon assignment, WHO Surgical Safety Checklist (Sign In, Time Out, Sign Out), equipment status tracking.
10. **Electronic Medical Records (EMR)**: Patient health history browser, chronological clinical timeline, diagnostic report attachments.
11. **Prescription Management**: Digital Rx repository, printable hospital letterhead prescription modal with dosage, frequency, duration, and food instructions.
12. **Pharmacy Management & POS**: Medicine inventory, batch number tracking, expiry date tracking, low-stock threshold alerts, Point-of-Sale (POS) counter with automated batch inventory stock deduction.
13. **Laboratory Management**: Pathology test catalog (CBC, Lipid, LFT, KFT, HbA1c, etc.), test booking, specimen collection with barcode generation, result entry with normal ranges, approval and auto-billing.
14. **Radiology & Imaging**: Modalities (X-Ray, CT Scan, MRI, Ultrasound), investigation catalog, scan orders, report findings & diagnostic impression verification.
15. **Billing & Invoicing**: Comprehensive invoice list (OPD, IPD, Pharmacy, Laboratory, Surgery), GST tax calculations, multiple payment methods (UPI/QR, Cash, Card, NetBanking, Insurance), partial payment support, printable payment receipts.
16. **Insurance & Claims**: TPA insurance provider directory, patient policy verification, cashless pre-authorization claim submission and status tracker.
17. **Blood Bank Management**: ABO & Rh inventory gauges (A+, A-, B+, B-, AB+, AB-, O+, O-), donor registry, transfusion cross-matching and blood unit issue tracking.
18. **HR & Staff Management**: Staff directory across 13 roles, attendance logs, leave request approval workflow, monthly payroll breakdown and salary slips.
19. **Financial Accounting**: Income and expense vouchers, double-entry financial ledger, Profit & Loss (P&L) summary, accounts receivable and payable, doctor commission ledger.
20. **Multi-Branch & Multi-Hospital Management**: Multi-tenant parent entity support, branch selector, inter-branch medicine inventory transfer modal, branch comparison analytics.
21. **Patient Portal**: Patient self-service interface to book appointments, view active prescriptions, download lab reports, and pay outstanding invoices online.
22. **Telemedicine Suite**: WebRTC-style online video consultation room with camera/microphone toggles, consultation timer, and live doctor clinical notes pane.
23. **Advanced Analytics & BI**: Revenue breakdown donut chart, weekly inflow trends, doctor productivity rankings, Excel workbook export (`/api/analytics/export/excel/`), PDF executive report export (`/api/analytics/export/pdf/`).
24. **AI Predictive Insights**: Natural Language Query engine (`/api/ai/query/`), bed demand forecasts, pharmacy stockout warnings, clinical safety & drug interaction checks.
25. **Administration & RBAC**: 13-role deterministic permission matrix, user provisioning modal, staff account directory.
26. **Settings & Localization**: Hospital profile editor, GSTIN/Tax configuration, regional settings (English, Marathi, Hindi live switcher), automated database backup snapshots, immutable HIPAA audit log browser.
27. **Notifications & Alerts**: SMS/Email/WhatsApp gateway dispatch history, broadcast hospital announcement modal.
28. **Global Search**: System-wide interactive modal (`Ctrl+K`) searching across patients, doctors, medicines, and invoices.
29. **Disaster Recovery & Data Portability**: Point-in-time database snapshots and DPDP-compliant portable registry exports.

---

## 🧪 Automated Testing & Verification

A comprehensive end-to-end test suite is included in `test_workflows.py` validating the core clinical and financial workflows:

```bash
# Run the 4 End-to-End Interconnected Workflows
python test_workflows.py
```

### Verified Test Results:
- **Workflow 1**: Patient Registration (UHID generated) -> Appointment Booking -> Check-in (Token generated with wait estimation) -> OPD Consultation (Vitals, ICD-10 diagnosis) -> Consultation Invoice auto-created -> Payment collected via UPI -> Invoice marked `Paid` with `Rs. 0.00` balance.
- **Workflow 2**: Pharmacy POS Sale -> Batch inventory real-time stock deduction verified.
- **Workflow 3**: Laboratory Order Placed -> Specimen Collected -> Report Approved -> Invoice auto-generated.
- **Workflow 4**: Inpatient Admission -> Bed marked `Occupied` -> Patient status set to `Inpatient` -> Discharge summary logged -> Bed automatically returned to `Available` -> IPD Final hospitalization bill computed.

```bash
# Run Django Unit Tests
cd backend
python manage.py test apps.core
```
Output: `Ran 7 tests in 0.521s - OK`

```bash
# Verify Frontend Production Build
cd frontend
npm run build
```
Output: `Built in 1.28s - 0 errors`

---

## 🚀 How to Run BVG ClinicOS

### 1. Backend Server
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# Install requirements
pip install -r requirements.txt
# Run database migrations
python manage.py migrate
# Seed realistic demonstration data (if starting with fresh database)
python seed_data.py
# Start development server
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://127.0.0.1:5173/`.

---

## 🔒 Security & Compliance Standards

- **DPDP Act (India 2023)**: User consent tracking, comprehensive audit trail logging (`AuditLog` model), right to erasure and portability routines.
- **HIPAA (USA)**: Deterministic RBAC access matrix across 13 roles, cryptographic JWT session management, patient EMR confidentiality boundaries.
- **Data Isolation**: Multi-branch tenant data isolation with branch headers (`X-Branch-ID`) and scoped querysets.

---

*BVG ClinicOS — Enterprise Healthcare Management. One Intelligent Platform.*
