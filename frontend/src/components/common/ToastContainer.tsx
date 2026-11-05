import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-slide-in ${
              isSuccess
                ? 'bg-teal-50/95 border-teal-200 text-teal-900 dark:bg-teal-950/90 dark:border-teal-800 dark:text-teal-100'
                : isError
                ? 'bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100'
                : isWarning
                ? 'bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-100'
                : 'bg-slate-50/95 border-slate-200 text-slate-900 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-3"
            >
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
