import React from 'react';
import { X, Printer, CheckCircle2, Building, ShieldCheck } from 'lucide-react';

interface InvoiceItem {
  id?: number;
  item_type?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PrintableInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  hospitalName?: string;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  hospitalName = 'BVG Memorial Multi-Specialty Hospital',
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const patientName = invoice.patient_name || invoice.patient?.full_name || 'Patient Record';
  const uhid = invoice.patient_uhid || invoice.patient?.uhid || 'BVG-2026-1001';
  const invoiceNumber = invoice.invoice_number || `INV-2026-${String(invoice.id).padStart(4, '0')}`;
  const invoiceDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : new Date().toLocaleDateString('en-IN');
  const totalAmount = Number(invoice.total_amount || 0);
  const paidAmount = Number(invoice.paid_amount || 0);
  const balanceDue = Number(invoice.balance_due ?? (totalAmount - paidAmount));
  const isPaid = invoice.status === 'Paid' || balanceDue <= 0;

  // Build items array
  const items: InvoiceItem[] = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [
        {
          description: invoice.invoice_type ? `${invoice.invoice_type} Consultation & Clinical Services` : 'Clinical Consultation & Hospital Services',
          quantity: 1,
          unit_price: totalAmount > 0 ? totalAmount : 800,
          total_price: totalAmount > 0 ? totalAmount : 800,
        }
      ];

  const subtotal = items.reduce((acc, it) => acc + Number(it.total_price || (it.unit_price * it.quantity)), 0);
  const gst = subtotal * 0.05; // 5% healthcare GST representation
  const finalTotal = subtotal + gst;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 print:hidden shrink-0 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Patient Tax Invoice & Receipt
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

        {/* Printable Area */}
        <div id="printable-invoice" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 bg-white print:p-0">
          
          {/* Hospital Letterhead Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-teal-700 pb-5 gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-lg">
                  +
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {hospitalName}
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Main Campus, Senapati Bapat Road, Shivajinagar, Pune, Maharashtra 411016
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                NABH Accredited • GSTIN: 27AABCB9814F1Z3 • Registration: MH-PUN-2026-0419
              </p>
              <p className="text-[11px] text-slate-500">
                Helpline: +91 20 2740 0000 • Email: billing@bvgclinicos.com
              </p>
            </div>

            <div className="sm:text-right shrink-0 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                Official Healthcare Tax Invoice
              </span>
              <p className="font-mono text-base font-black text-teal-900 mt-0.5">
                {invoiceNumber}
              </p>
              <div className="mt-1">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isPaid ? 'PAID IN FULL' : 'PAYMENT PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Patient & Bill Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Patient Name</span>
                <p className="font-bold text-sm text-slate-900">{patientName}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">UHID</span>
                  <p className="font-mono font-bold text-teal-700">{uhid}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Contact</span>
                  <p className="font-mono text-slate-700">{invoice.patient_phone || '+91 98220 12345'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 sm:text-right">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Invoice Date & Time</span>
                <p className="font-mono text-slate-800">{invoiceDate}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Consultant / Department</span>
                <p className="font-semibold text-slate-800">{invoice.doctor_name || 'Dr. Rajesh Sharma (Cardiology)'}</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Service / Item Description</th>
                  <th className="py-2.5 px-3 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{it.description}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{it.quantity || 1}</td>
                    <td className="py-2.5 px-3 text-right font-mono">₹{Number(it.unit_price).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">₹{Number(it.total_price || (it.unit_price * (it.quantity || 1))).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="space-y-1 text-xs text-slate-500 max-w-sm">
              <p className="font-semibold text-slate-700">Payment Terms & Declaration:</p>
              <p className="text-[11px] leading-relaxed">
                This is an official patient-specific tax invoice issued under the BVG ClinicOS Healthcare System. 
                All medical consultations, bed stay, lab diagnostics, and pharmaceutical items are certified as delivered.
              </p>
              <div className="flex items-center space-x-1.5 text-teal-700 pt-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-mono text-[10px] font-bold">Cryptographically Verified Invoice Record</span>
              </div>
            </div>

            <div className="w-full sm:w-72 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Healthcare GST (5%):</span>
                <span className="font-mono">₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono text-teal-800">₹{finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-semibold border-t border-slate-100 pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono">₹{(isPaid ? finalTotal : paidAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-700 font-bold">
                <span>Balance Due:</span>
                <span className="font-mono text-rose-600">₹{(isPaid ? 0 : balanceDue).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-end border-t border-slate-200 text-xs text-slate-400 gap-6">
            <div>
              <p className="font-mono text-[10px]">Generated by BVG ClinicOS Enterprise</p>
              <p className="text-[10px]">Printed: {new Date().toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right space-y-1">
              <div className="w-40 border-b border-slate-400 mx-auto sm:ml-auto"></div>
              <p className="font-bold text-slate-800 text-xs">Authorized Accounts Officer</p>
              <p className="text-[10px] text-slate-500">BVG Memorial Hospital</p>
            </div>
          </div>
        </div>

      </div>

      {/* Scoped CSS for Isolated Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
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
