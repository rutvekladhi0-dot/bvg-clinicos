import React from 'react';
import { X, Printer, ShieldCheck, Heart, Pill } from 'lucide-react';

interface PrintablePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: any;
  patient: any;
  hospitalName?: string;
}

export const PrintablePrescriptionModal: React.FC<PrintablePrescriptionModalProps> = ({
  isOpen,
  onClose,
  prescription,
  patient,
  hospitalName = 'BVG Memorial Multi-Specialty Hospital',
}) => {
  if (!isOpen || !prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  const patientName = patient?.full_name || prescription.patient_name || 'Patient';
  const uhid = patient?.uhid || prescription.patient_uhid || 'BVG-2026-1001';
  const rxNumber = prescription.prescription_number || `RX-2026-${String(prescription.id || 1).padStart(4, '0')}`;
  const rxDate = prescription.created_at ? new Date(prescription.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');
  const doctorName = prescription.doctor_name || 'Dr. Rajesh Sharma, MD (Cardiology)';

  const items = Array.isArray(prescription.items) && prescription.items.length > 0
    ? prescription.items
    : [
        { medicine_name: 'Tab. Augmentin 625 Duo', dosage: '625mg', frequency: '1-0-1 (After Food)', duration_days: 5, instructions: 'Take with warm water' },
        { medicine_name: 'Tab. Dolo 650', dosage: '650mg', frequency: '1-0-1 (SOS)', duration_days: 3, instructions: 'Take if fever > 99.5F' },
        { medicine_name: 'Syp. Ascoril-D', dosage: '10ml', frequency: '0-0-1 (Night)', duration_days: 5, instructions: 'Before sleep' },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none">
        
        {/* Modal Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 print:hidden shrink-0 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2">
            <Pill className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Official Medical Prescription
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-3.5 py-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Prescription Document */}
        <div id="printable-rx" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 bg-white print:p-0">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-teal-700 pb-4 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{hospitalName}</h1>
              <p className="text-xs text-slate-500 font-medium">Outpatient Department & Clinical Care Master</p>
              <p className="text-[11px] text-slate-400 font-mono">Pune Medical Campus • Helpline: +91 20 2740 0000</p>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-teal-800 font-bold text-xs uppercase block">Consultant Doctor</span>
              <p className="font-bold text-sm text-slate-900">{doctorName}</p>
              <p className="text-[11px] text-slate-500 font-mono">Reg. No: MMC-2015-081294</p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
              <p className="font-bold text-slate-900">{patientName}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">UHID</span>
              <p className="font-mono font-bold text-teal-700">{uhid}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Gender / Blood</span>
              <p className="font-semibold text-slate-800">{patient?.gender || 'Male'} • {patient?.blood_group || 'B+'}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Date</span>
              <p className="font-mono text-slate-800">{rxDate}</p>
            </div>
          </div>

          {/* Diagnosis & Clinical Findings */}
          <div className="space-y-1 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Clinical Diagnosis / Chief Complaint</span>
            <p className="p-3 rounded-lg bg-teal-50/60 border border-teal-100 font-semibold text-slate-800">
              {prescription.diagnosis || 'Acute Upper Respiratory Tract Infection with reactive fever. Vitals stable.'}
            </p>
          </div>

          {/* Rx Symbol & Medication Table */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-teal-800">
              <span className="font-serif italic font-bold text-2xl">℞</span>
              <span className="text-xs font-bold uppercase tracking-wider">Prescribed Pharmacotherapy</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">Medicine & Formulation</th>
                    <th className="py-2.5 px-3">Dosage</th>
                    <th className="py-2.5 px-3">Frequency</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{it.medicine_name}</td>
                      <td className="py-2.5 px-3 font-mono">{it.dosage}</td>
                      <td className="py-2.5 px-3 font-semibold text-teal-700">{it.frequency}</td>
                      <td className="py-2.5 px-3 font-mono">{it.duration_days ? `${it.duration_days} days` : '5 days'}</td>
                      <td className="py-2.5 px-3 text-slate-600 italic text-[11px]">{it.instructions || 'As advised'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advice / Special Instructions */}
          <div className="space-y-1 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">General Advice & Dietary Precautions</span>
            <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
              <li>Drink plenty of warm fluids and maintain hydration.</li>
              <li>Avoid cold beverages and dusty environments.</li>
              <li>Report immediately to emergency if breathlessness or high fever persists.</li>
              <li>Follow-up after 5 days if symptoms do not resolve.</li>
            </ul>
          </div>

          {/* Footer Signature */}
          <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-xs">
            <div className="flex items-center space-x-1.5 text-teal-700">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-mono text-[10px] text-slate-400">Digital Prescription • BVG ClinicOS Healthcare</span>
            </div>
            <div className="text-right space-y-1">
              <div className="w-36 border-b border-slate-400 ml-auto"></div>
              <p className="font-bold text-slate-800 text-xs">{doctorName}</p>
              <p className="text-[10px] text-slate-400">Consultant Signature & Stamp</p>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-rx, #printable-rx * {
            visibility: visible !important;
          }
          #printable-rx {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};
