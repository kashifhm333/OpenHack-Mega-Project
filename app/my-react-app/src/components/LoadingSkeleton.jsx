import React from 'react';

/**
 * LoadingSkeleton Component
 * Smooth animated shimmer cards for loading states
 */
export default function LoadingSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="h-4 w-16 bg-slate-800 rounded-full" />
              <div className="h-4 w-20 bg-slate-800 rounded-full" />
            </div>
            <div className="h-4 w-6 bg-slate-800 rounded" />
          </div>

          <div className="flex gap-3">
            <div className="h-5 w-5 bg-slate-800 rounded-full shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800/60 rounded w-full" />
              <div className="h-3 bg-slate-800/60 rounded w-2/3" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex justify-between">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
