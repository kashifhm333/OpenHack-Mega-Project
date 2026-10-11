import React from 'react';
import { AlertTriangle, RefreshCw, Terminal, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../api';

/**
 * ErrorAlert Component
 * Clear and informative error notification when the backend API is unreachable or returns an error
 */
export default function ErrorAlert({ message, onRetry, isRetrying = false }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 sm:p-6 mb-8 text-rose-200 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        
        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-white">
              Backend Connection Error
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono">
              Target: {API_BASE_URL}
            </span>
          </div>

          <p className="text-sm text-rose-200 leading-relaxed">
            {message || 'Unable to establish communication with the Node.js/Express backend service.'}
          </p>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-rose-500/20 text-xs font-mono text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Troubleshooting Checklist:</span>
            </div>
            <p>1. Ensure your Express server is running: <code className="text-emerald-400">npm start</code> or <code className="text-emerald-400">node server.js</code></p>
            <p>2. Verify port matches: <code className="text-indigo-400">{API_BASE_URL}</code></p>
            <p>3. Ensure CORS middleware is enabled on Express (<code className="text-amber-400">cors()</code>)</p>
          </div>

          <div className="pt-2">
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Attempting reconnection...' : 'Retry Connection'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
