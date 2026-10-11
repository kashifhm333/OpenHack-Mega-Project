import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Toast Component
 * Compact notification toast for immediate action feedback
 */
export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-in">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${
          isSuccess
            ? 'bg-slate-900/95 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-900/95 border-rose-500/30 text-rose-300'
        }`}
      >
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white">{toast.title || (isSuccess ? 'Success' : 'Notice')}</p>
          <p className="text-xs text-slate-300 mt-0.5 break-words">{toast.message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
