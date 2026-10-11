import React from 'react';
import { 
  Trash2, 
  CheckCircle, 
  Circle, 
  Calendar, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

const PRIORITY_BADGES = {
  high: { label: 'High Priority', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  low: { label: 'Low', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

const CATEGORY_COLORS = {
  Development: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  DevOps: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Bugfix: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Notes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  General: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

/**
 * TaskCard Component
 * Displays a single task/note item with toggle & delete operations
 */
export default function TaskCard({ 
  task, 
  onDelete, 
  onToggleComplete, 
  isDeleting = false 
}) {
  const { id, _id, title, description, category, priority = 'medium', completed = false, createdAt } = task;
  const taskId = id || _id;

  const priorityMeta = PRIORITY_BADGES[priority?.toLowerCase()] || PRIORITY_BADGES.medium;
  const categoryBadgeClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between p-5 ${
        completed
          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5'
      }`}
    >
      <div>
        {/* Top Badges & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category */}
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${categoryBadgeClass}`}>
              {category || 'General'}
            </span>

            {/* Priority */}
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${priorityMeta.color}`}>
              {priorityMeta.label}
            </span>
          </div>

          {/* Delete Action Button */}
          <button
            onClick={() => onDelete(taskId)}
            disabled={isDeleting}
            title="Delete item"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50 group-hover:opacity-100 sm:opacity-75"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            ) : (
              <Trash2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
            )}
          </button>
        </div>

        {/* Task Header with Completion Toggle */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleComplete && onToggleComplete(taskId, !completed)}
            className="mt-0.5 shrink-0 text-slate-500 hover:text-indigo-400 transition"
            title={completed ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {completed ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-500 hover:text-indigo-400" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-base font-semibold leading-snug break-words transition ${
                completed ? 'text-slate-400 line-through' : 'text-white'
              }`}
            >
              {title}
            </h3>

            {description && (
              <p
                className={`text-xs mt-2 leading-relaxed whitespace-pre-wrap break-words ${
                  completed ? 'text-slate-500 line-through' : 'text-slate-300'
                }`}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Meta (Timestamp & Status) */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDate(createdAt) || 'Recent'}</span>
        </div>

        <span className={`font-medium ${completed ? 'text-emerald-400' : 'text-slate-400'}`}>
          {completed ? 'Completed' : 'In Progress'}
        </span>
      </div>
    </div>
  );
}
