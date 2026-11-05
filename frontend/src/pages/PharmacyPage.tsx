import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Medicine, MedicineBatch, Patient } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  Pill, AlertTriangle, ShoppingCart, Plus, Search,
  CheckCircle2, DollarSign, Calendar, PackageCheck, Trash2
} from 'lucide-react';

export const PharmacyPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'inventory' | 'alerts' | 'sales'>('inventory');

  // POS Sale Modal
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [salePatient, setSalePatient] = useState('');
  const [saleItems, setSaleItems] = useState<Array<{ batch: string; quantity: number }>>([
    { batch: '', quantity: 1 }
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meds, bList, alertData, pList] = await Promise.all([
        api.getMedicines(),
        api.getMedicineBatches(),
        api.getStockAlerts(),
        api.getPatients(`branch=${branchId}`),
      ]);
      setMedicines(meds);
      setBatches(bList);
      setAlerts(alertData);
      setPatients(pList);
    } catch (err) {
      console.error('Error fetching pharmacy data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const handleDispenseSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = saleItems.filter((i) => i.batch && i.quantity > 0);
    if (validItems.length === 0) {
      showToast('Please select at least one medicine batch', 'warning');
      return;
    }

    try {
      let subtotal = 0;
      const formattedItems = validItems.map((item) => {
        const batchObj = batches.find((b) => b.id === Number(item.batch));
        const price = Number(batchObj?.selling_price || 0);
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
        return {
          batch: Number(item.batch),
          quantity: item.quantity,
          unit_price: price,
          total_price: itemTotal,
        };
      });

      const tax = subtotal * 0.12;
      const net = subtotal + tax;

      await api.createPharmacySale({
        patient: salePatient ? Number(salePatient) : null,
        branch: branchId,
        subtotal,
        tax_amount: tax,
        discount_amount: 0,
        net_amount: net,
        payment_status: 'Paid',
        payment_method: 'Cash',
        items: formattedItems,
      });

      showToast(`Medicine dispensed successfully! Net Bill: ₹${net.toFixed(2)} (Stock deducted)`, 'success');
      setShowSaleModal(false);
      setSaleItems([{ batch: '', quantity: 1 }]);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Dispense failed', 'error');
    }
  };

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('pharmacy')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Medicine inventory, batch & expiry management, POS dispensing & stock alerts
          </p>
        </div>
        <button
          onClick={() => setShowSaleModal(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          POS Dispense Medicine
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            tab === 'inventory'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Medicine Inventory ({medicines.length})
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            tab === 'alerts'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          Stock & Expiry Alerts ({alerts?.low_stock_count || 0})
        </button>
      </div>

      {tab === 'inventory' && (
        <>
          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by brand name (Augmentin, Dolo) or generic chemical..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <span className="text-xs text-slate-400">Total Formulations: {medicines.length}</span>
          </div>

          {/* Medicines Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Medicine Brand</th>
                    <th className="py-3 px-4">Generic Composition</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Form / Strength</th>
                    <th className="py-3 px-4">Manufacturer</th>
                    <th className="py-3 px-4">Total Stock</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredMedicines.map((m) => {
                    const isLow = (m.total_stock || 0) <= m.reorder_threshold;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {m.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic">
                          {m.generic_name}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {m.category_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {m.dosage_form} ({m.strength})
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {m.manufacturer}
                        </td>
                        <td className="py-3.5 px-4 font-bold font-mono">
                          <span className={isLow ? 'text-rose-600 font-black' : 'text-slate-800 dark:text-slate-200'}>
                            {m.total_stock || 0} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge variant={isLow ? 'rose' : 'emerald'}>
                            {isLow ? 'Low Stock' : 'Optimal'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'alerts' && alerts && (
        <div className="space-y-6">
          {/* Low Stock Warning Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Low Stock Alerts (Below Reorder Threshold 25 Units)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {alerts.low_stock?.map((b: any) => (
                <div key={b.id} className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-900 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-amber-950 dark:text-amber-200">{b.medicine_name}</span>
                    <span className="text-rose-600 font-black">{b.current_stock} left</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">Batch: {b.batch_number} • Exp: {b.expiry_date}</p>
                  <p className="text-[11px] text-teal-700 font-semibold">Distributor: {b.supplier_name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring Soon Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-blue-500" />
              Expiring Within 90 Days
            </h3>
            {alerts.expiring_soon?.length === 0 ? (
              <p className="text-xs text-slate-400">All inventory batches are within valid shelf-life.</p>
            ) : (
              <div className="space-y-2">
                {alerts.expiring_soon?.map((b: any) => (
                  <div key={b.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{b.medicine_name} ({b.strength})</span>
                      <span className="text-slate-400 font-mono ml-2">Batch: {b.batch_number}</span>
                    </div>
                    <span className="font-bold text-rose-600 font-mono">Expires: {b.expiry_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POS Dispense Modal */}
      <Modal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        title="Pharmacy POS Medicine Dispensing"
        subtitle="Dispense medicine, deduct inventory & create billing invoice"
        maxWidth="lg"
      >
        <form onSubmit={handleDispenseSale} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Patient (Optional for Counter Walk-in)
            </label>
            <select
              value={salePatient}
              onChange={(e) => setSalePatient(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Over-The-Counter Cash Sale --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.uhid})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Medicines to Dispense
            </label>
            {saleItems.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <select
                  required
                  value={item.batch}
                  onChange={(e) => {
                    const updated = [...saleItems];
                    updated[idx].batch = e.target.value;
                    setSaleItems(updated);
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">-- Select Medicine Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.medicine_name} ({b.strength}) - Stock: {b.current_stock} (₹{b.selling_price}/unit)
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => {
                    const updated = [...saleItems];
                    updated[idx].quantity = Number(e.target.value);
                    setSaleItems(updated);
                  }}
                  placeholder="Qty"
                  className="w-20 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />

                {saleItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSaleItems([...saleItems, { batch: '', quantity: 1 }])}
              className="text-xs font-bold text-teal-600 hover:text-teal-700"
            >
              + Add Another Medicine
            </button>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowSaleModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0D6861] rounded-xl shadow-sm"
            >
              Confirm Sale & Deduct Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
