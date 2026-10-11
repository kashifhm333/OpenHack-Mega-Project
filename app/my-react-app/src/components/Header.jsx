import React from 'react';
import { 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  Server, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../api';

/**
 * Responsive Navigation Header
 * Displays branding, environment connection status, stats counter, and refresh action
 */
export default function Header({ 
  totalTasks = 0, 
  completedTasks = 0, 
  onRefresh, 
  isLoading = false,
  isError = false 
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  DevPulse
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Task Management & Notes Workspace
              </p>
            </div>
          </div>

          {/* Right Section: API Status, Metrics & Refresh */}
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* Environment API Connection Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-mono">API:</span>
              <span className="font-mono text-slate-200 max-w-[160px] truncate" title={API_BASE_URL}>
                {API_BASE_URL}
              </span>
              <span className="flex h-2 w-2 relative ml-1">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isError ? 'bg-rose-400' : 'bg-emerald-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isError ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />
              </span>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-2 text-xs">
              <div className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Total:</span>
                <span className="font-semibold text-white">{totalTasks}</span>
              </div>

              <div className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Done:</span>
                <span className="font-semibold text-emerald-400">{completedTasks}</span>
              </div>
            </div>

            {/* Manual Refresh Trigger */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh tasks from server"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : 'group-hover:rotate-45 transition-transform'}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
