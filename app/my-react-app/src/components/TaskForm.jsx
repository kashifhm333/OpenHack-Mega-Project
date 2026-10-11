import React, { useState } from 'react';
import { PlusCircle, Loader2, Tag, AlertCircle, FileText, Flame } from 'lucide-react';

const CATEGORIES = [
  { label: 'Development', value: 'Development', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { label: 'DevOps & Cloud', value: 'DevOps', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { label: 'Bugfix', value: 'Bugfix', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { label: 'Notes', value: 'Notes', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { label: 'General', value: 'General', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

const PRIORITIES = [
  { label: 'Low', value: 'low', color: 'hover:border-emerald-500/50 peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-300' },
  { label: 'Medium', value: 'medium', color: 'hover:border-amber-500/50 peer-checked:border-amber-500 peer-checked:bg-amber-500/10 peer-checked:text-amber-300' },
  { label: 'High', value: 'high', color: 'hover:border-rose-500/50 peer-checked:border-rose-500 peer-checked:bg-rose-500/10 peer-checked:text-rose-300' },
];

/**
 * TaskForm Component
 * Handles creating new tasks/notes with validation and async submission state
 */
export default function TaskForm({ onAddTask, isSubmitting = false }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Development');
  const [priority, setPriority] = useState('medium');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setValidationError('Please enter a task or note title.');
      return;
    }

    setValidationError('');

    const newTask = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const success = await onAddTask(newTask);
    if (success) {
      // Reset form upon successful creation
      setTitle('');
      setDescription('');
      setCategory('Development');
      setPriority('medium');
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden group">
      {/* Decorative accent gradient line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-80" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            Add New Item
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create a tracked task or quick note to push to the API
          </p>
        </div>
      </div>

      {validationError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="task-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Title / Summary <span className="text-rose-400">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="e.g., Configure Docker container for Express API..."
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50"
          />
        </div>

        {/* Category & Priority Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Category Dropdown */}
          <div>
            <label htmlFor="task-category" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Category
            </label>
            <select
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-slate-900 text-slate-200">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-slate-400" />
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <label key={p.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={priority === p.value}
                    onChange={() => setPriority(p.value)}
                    disabled={isSubmitting}
                    className="sr-only peer"
                  />
                  <div className={`px-2 py-2 text-center rounded-xl border border-slate-800 text-xs font-medium text-slate-400 bg-slate-950/60 transition ${p.color}`}>
                    {p.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Note / Description */}
        <div>
          <label htmlFor="task-desc" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Notes & Details <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <textarea
            id="task-desc"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add relevant notes, checklist items, commands, or details..."
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 resize-none"
          />
        </div>

        {/* Form Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setDescription('');
              setValidationError('');
            }}
            disabled={isSubmitting || (!title && !description)}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to API...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Add Item</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
