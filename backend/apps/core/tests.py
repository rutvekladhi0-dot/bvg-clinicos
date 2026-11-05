from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import User, Hospital, Branch
from apps.patients.models import Patient
from apps.appointments.models import Appointment
from apps.doctors.models import Doctor

class BVGClinicOSTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(name='Test Hospital', code='TEST-HOSP')
        self.branch = Branch.objects.create(hospital=self.hospital, name='Test Branch', code='TB-01')
        self.user = User.objects.create_user(
            username='tester',
            password='TestPassword123',
            role='SUPER_ADMIN',
            branch=self.branch
        )

    def test_dashboard_stats_endpoint(self):
        response = self.client.get('/api/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_patients', response.data)
        self.assertIn('today_revenue', response.data)
        self.assertIn('bed_occupancy_rate', response.data)

    def test_patient_registration_and_uhid_generation(self):
        payload = {
            'first_name': 'Aakash',
            'last_name': 'Vaidya',
            'gender': 'Male',
            'phone': '+91 99887 76655',
            'blood_group': 'B+',
            'branch': self.branch.id
        }
        response = self.client.post('/api/patients/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['uhid'].startswith('BVG-'))
        self.assertEqual(response.data['full_name'], 'Aakash Vaidya')

    def test_ai_insights_endpoint(self):
        response = self.client.get('/api/ai/analysis/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('insights', response.data)
        self.assertTrue(len(response.data['insights']) > 0)

    def test_ai_natural_language_query(self):
        response = self.client.post('/api/ai/query/', {'query': 'What is the current bed occupancy?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('answer', response.data)
        self.assertIn('bed', response.data['answer'].lower())

    def test_global_search(self):
        response = self.client.get('/api/global-search/?q=Rajesh')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_excel_export(self):
        response = self.client.get('/api/analytics/export/excel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    def test_pdf_export(self):
        response = self.client.get('/api/analytics/export/pdf/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
