import datetime
from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import OPDConsultation, Prescription, PrescriptionItem
from .serializers import OPDConsultationSerializer, PrescriptionSerializer, PrescriptionItemSerializer
from apps.patients.models import PatientTimeline
from apps.billing.models import Invoice, InvoiceItem

class OPDConsultationViewSet(viewsets.ModelViewSet):
    queryset = OPDConsultation.objects.all()
    serializer_class = OPDConsultationSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['diagnosis', 'patient__first_name', 'patient__last_name', 'patient__uhid']
    ordering_fields = ['consultation_date']

    def get_queryset(self):
        qs = OPDConsultation.objects.all()
        patient_id = self.request.query_params.get('patient')
        doctor_id = self.request.query_params.get('doctor')
        branch_id = self.request.query_params.get('branch')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        return qs

    def perform_create(self, serializer):
        consultation = serializer.save()

        # Update appointment status if linked
        if consultation.appointment:
            consultation.appointment.status = 'Completed'
            consultation.appointment.save()

        # Log timeline
        PatientTimeline.objects.create(
            patient=consultation.patient,
            event_type='Consultation',
            title=f"OPD Consultation with {consultation.doctor.full_name}",
            description=f"Diagnosis: {consultation.diagnosis}. Notes: {consultation.chief_complaint}",
            reference_id=str(consultation.id)
        )

        # Automatically generate Consultation Bill if not already billed
        year = datetime.date.today().year
        inv_count = Invoice.objects.filter(invoice_number__startswith=f"INV-{year}-").count() + 1
        inv_number = f"INV-{year}-{inv_count:04d}"

        invoice = Invoice.objects.create(
            invoice_number=inv_number,
            patient=consultation.patient,
            branch=consultation.branch,
            invoice_type='OPD',
            subtotal=consultation.doctor.consultation_fee,
            tax_rate=0.00,
            tax_amount=0.00,
            discount=0.00,
            total_amount=consultation.doctor.consultation_fee,
            paid_amount=0.00,
            balance_amount=consultation.doctor.consultation_fee,
            status='Unpaid',
            notes=f"Consultation Fee for {consultation.doctor.full_name} ({consultation.diagnosis})"
        )

        InvoiceItem.objects.create(
            invoice=invoice,
            service_category='Consultation',
            description=f"Dr. Consultation - {consultation.doctor.full_name} ({consultation.doctor.specialization})",
            quantity=1,
            unit_price=consultation.doctor.consultation_fee,
            total_price=consultation.doctor.consultation_fee
        )

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Prescription.objects.all()
        patient_id = self.request.query_params.get('patient')
        doctor_id = self.request.query_params.get('doctor')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs

    def perform_create(self, serializer):
        year = datetime.date.today().year
        last_rx = Prescription.objects.filter(prescription_number__startswith=f"RX-{year}-").order_by('-id').first()
        if last_rx:
            try:
                last_num = int(last_rx.prescription_number.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = Prescription.objects.count() + 5001
        else:
            new_num = 5001

        rx_number = f"RX-{year}-{new_num:04d}"
        prescription = serializer.save(prescription_number=rx_number)

        # Log timeline
        PatientTimeline.objects.create(
            patient=prescription.patient,
            event_type='Prescription',
            title=f"Prescription Generated ({prescription.prescription_number})",
            description=f"Prescribed by {prescription.doctor.full_name}",
            reference_id=prescription.prescription_number
        )
