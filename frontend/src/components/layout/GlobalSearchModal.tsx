import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, Stethoscope, Pill, FileText, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(query);
        setResults(res.results || []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (link: string) => {
    onClose();
    navigate(link);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Patient':
        return <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'Doctor':
        return <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Pharmacy':
        return <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Billing':
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Search className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients (UHID/Name), doctors, medicines, bills..."
            className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Searching ClinicOS database...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {!loading && !query && (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
              Type at least 2 characters to search across Patients, Doctors, Medicines & Invoices.
            </div>
          )}

          {!loading && results.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(item.link)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-teal-50/70 dark:hover:bg-teal-950/40 text-left transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.category}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
