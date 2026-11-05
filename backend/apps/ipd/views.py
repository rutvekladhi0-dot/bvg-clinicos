import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import Ward, Bed, Admission, NursingNote, MedicationAdministration
from .serializers import (
    WardSerializer, BedSerializer, AdmissionSerializer,
    NursingNoteSerializer, MedicationAdministrationSerializer
)
from apps.patients.models import PatientTimeline
from apps.billing.models import Invoice, InvoiceItem

class WardViewSet(viewsets.ModelViewSet):
    queryset = Ward.objects.all()
    serializer_class = WardSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Ward.objects.all()
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Bed.objects.all()
        ward_id = self.request.query_params.get('ward')
        status_param = self.request.query_params.get('status')
        branch_id = self.request.query_params.get('branch')

        if ward_id:
            qs = qs.filter(ward_id=ward_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if branch_id:
            qs = qs.filter(ward__branch_id=branch_id)
        return qs

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['admission_number', 'patient__first_name', 'patient__last_name', 'patient__uhid']
    ordering_fields = ['admission_date']

    def get_queryset(self):
        qs = Admission.objects.all()
        branch_id = self.request.query_params.get('branch')
        status_param = self.request.query_params.get('status')
        patient_id = self.request.query_params.get('patient')

        if branch_id:
            qs = qs.filter(ward__branch_id=branch_id)
        if status_param:
            qs = qs.filter(status=status_param)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_adm = Admission.objects.filter(admission_number__startswith=f"IPD-{year}-").order_by('-id').first()
        if last_adm:
            try:
                last_num = int(last_adm.admission_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = Admission.objects.count() + 1001
        else:
            new_num = 1001

        adm_number = f"IPD-{year}-{new_num:04d}"
        admission = serializer.save(admission_number=adm_number)

        # Mark Bed as Occupied
        admission.bed.status = 'Occupied'
        admission.bed.save()

        # Update patient status
        admission.patient.status = 'Inpatient'
        admission.patient.save()

        # Log timeline
        PatientTimeline.objects.create(
            patient=admission.patient,
            event_type='Admission',
            title=f"Admitted to {admission.ward.name} (Bed {admission.bed.bed_number})",
            description=f"Under Dr. {admission.primary_doctor.full_name}. Reason: {admission.admission_reason}",
            reference_id=admission.admission_number
        )

    @action(detail=True, methods=['post'], url_path='discharge')
    def discharge_patient(self, request, pk=None):
        admission = self.get_object()
        if admission.status == 'Discharged':
            return Response({'error': 'Patient already discharged'}, status=status.HTTP_400_BAD_REQUEST)

        summary = request.data.get('discharge_summary', 'Discharged in stable clinical condition.')
        condition = request.data.get('discharge_condition', 'Stable')
        treatment_given = request.data.get('treatment_given', '')
        follow_up_advice = request.data.get('follow_up_advice', 'Review in OPD after 7 days.')

        now = timezone.now()
        admission.discharge_date = now
        admission.status = 'Discharged'
        admission.discharge_summary = summary
        admission.discharge_condition = condition
        admission.treatment_given = treatment_given
        admission.follow_up_advice = follow_up_advice
        admission.save()

        # Mark Bed as Available
        admission.bed.status = 'Available'
        admission.bed.save()

        # Update Patient Status
        admission.patient.status = 'Discharged'
        admission.patient.save()

        # Generate Final IPD Bill
        days_admitted = max(1, (now.date() - admission.admission_date.date()).days)
        daily_charge = admission.bed.daily_charge
        room_total = days_admitted * daily_charge
        nursing_charge = days_admitted * 500
        doctor_visit_charge = days_admitted * 800
        total_charges = room_total + nursing_charge + doctor_visit_charge

        year = datetime.date.today().year
        inv_count = Invoice.objects.filter(invoice_number__startswith=f"INV-{year}-").count() + 1
        inv_number = f"INV-{year}-{inv_count:04d}"

        invoice = Invoice.objects.create(
            invoice_number=inv_number,
            patient=admission.patient,
            branch=admission.ward.branch,
            invoice_type='IPD',
            subtotal=total_charges,
            tax_rate=0.00,
            tax_amount=0.00,
            discount=0.00,
            total_amount=total_charges,
            paid_amount=0.00,
            balance_amount=total_charges,
            status='Unpaid',
            notes=f"Final IPD Hospitalization Bill for Admission {admission.admission_number}"
        )

        InvoiceItem.objects.create(
            invoice=invoice,
            service_category='Room Charges',
            description=f"{admission.ward.name} Bed Charges ({days_admitted} days @ Rs. {daily_charge}/day)",
            quantity=days_admitted,
            unit_price=daily_charge,
            total_price=room_total
        )
        InvoiceItem.objects.create(
            invoice=invoice,
            service_category='Nursing Care',
            description=f"24x7 Inpatient Nursing & Monitoring Charges ({days_admitted} days)",
            quantity=days_admitted,
            unit_price=500.00,
            total_price=nursing_charge
        )
        InvoiceItem.objects.create(
            invoice=invoice,
            service_category='Doctor Rounds',
            description=f"Consultant Physician Inpatient Daily Rounds ({days_admitted} days)",
            quantity=days_admitted,
            unit_price=800.00,
            total_price=doctor_visit_charge
        )

        # Log timeline
        PatientTimeline.objects.create(
            patient=admission.patient,
            event_type='Discharge',
            title=f"Discharged from {admission.ward.name}",
            description=f"Discharge condition: {condition}. Summary: {summary}",
            reference_id=admission.admission_number
        )

        return Response({
            'status': 'Discharged',
            'admission_number': admission.admission_number,
            'invoice_number': invoice.invoice_number,
            'total_amount': total_charges
        })

class NursingNoteViewSet(viewsets.ModelViewSet):
    queryset = NursingNote.objects.all()
    serializer_class = NursingNoteSerializer
    permission_classes = [permissions.AllowAny]

class MedicationAdministrationViewSet(viewsets.ModelViewSet):
    queryset = MedicationAdministration.objects.all()
    serializer_class = MedicationAdministrationSerializer
    permission_classes = [permissions.AllowAny]
