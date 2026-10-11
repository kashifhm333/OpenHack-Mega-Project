import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import TaskCard from './components/TaskCard';
import LoadingSkeleton from './components/LoadingSkeleton';
import ErrorAlert from './components/ErrorAlert';
import Toast from './components/Toast';
import { getTasks, createTask, deleteTask, updateTask, API_BASE_URL } from './api';
import { 
  Search, 
  Filter, 
  ListTodo, 
  Inbox, 
  CheckCheck, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export default function App() {
  // Primary state
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // UI filter & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('all'); // 'all', 'pending', 'completed'
  const [toast, setToast] = useState(null);

  /**
   * Display temporary toast alert
   */
  const showToast = useCallback((message, type = 'success', title = '') => {
    setToast({ message, type, title });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  }, []);

  /**
   * Fetch all tasks from Express Backend API
   */
  const fetchTasks = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getTasks();
      // Ensure data is an array (handle both { tasks: [...] } and directly [...])
      const taskList = Array.isArray(data) ? data : data?.tasks || [];
      setTasks(taskList);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setErrorMessage(err.message || 'Failed to connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  /**
   * Handle task creation (POST /api/tasks)
   */
  const handleAddTask = async (newTaskData) => {
    setIsSubmitting(true);
    try {
      const createdItem = await createTask(newTaskData);
      
      // Update state with newly returned item or fallback to local representation
      const itemWithId = createdItem?.task || createdItem || {
        ...newTaskData,
        id: Date.now().toString(),
      };

      setTasks((prev) => [itemWithId, ...prev]);
      showToast('Task has been saved to your backend.', 'success', 'Task Created');
      return true;
    } catch (err) {
      console.error('Failed to create task:', err);
      showToast(err.message || 'Failed to save task to backend.', 'error', 'Save Failed');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle task deletion (DELETE /api/tasks/:id)
   */
  const handleDeleteTask = async (id) => {
    setDeletingId(id);
    try {
      await deleteTask(id);
      // Remove item from state optimistically / after response
      setTasks((prev) => prev.filter((item) => (item.id || item._id) !== id));
      showToast('Item deleted successfully.', 'success', 'Removed');
    } catch (err) {
      console.error('Failed to delete task:', err);
      showToast(err.message || 'Failed to delete item from backend.', 'error', 'Delete Failed');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Handle toggle completion status (PATCH /api/tasks/:id)
   */
  const handleToggleComplete = async (id, completed) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((item) => ((item.id || item._id) === id ? { ...item, completed } : item))
    );

    try {
      await updateTask(id, { completed });
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert optimistic update on failure
      setTasks((prev) =>
        prev.map((item) => ((item.id || item._id) === id ? { ...item, completed: !completed } : item))
      );
      showToast('Failed to update status on server.', 'error', 'Update Failed');
    }
  };

  // Filtered and searched tasks list
  const filteredTasks = tasks.filter((task) => {
    // Search query match
    const matchesSearch =
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter match
    const matchesCategory =
      activeCategory === 'All' || task.category?.toLowerCase() === activeCategory.toLowerCase();

    // Status filter match
    const matchesStatus =
      activeStatus === 'all' ||
      (activeStatus === 'completed' && task.completed) ||
      (activeStatus === 'pending' && !task.completed);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. Responsive Navigation Header */}
      <Header
        totalTasks={tasks.length}
        completedTasks={completedCount}
        onRefresh={() => fetchTasks(false)}
        isLoading={isLoading}
        isError={Boolean(errorMessage)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error notification banner if backend is unreachable */}
        {errorMessage && (
          <ErrorAlert
            message={errorMessage}
            onRetry={() => fetchTasks(true)}
            isRetrying={isLoading}
          />
        )}

        {/* Dashboard Grid: Sidebar Form (Left on large screens) & Task Feed (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Create Form & Quick Summary (4 columns on lg) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <TaskForm onAddTask={handleAddTask} isSubmitting={isSubmitting} />

            {/* Overview Quick Stats Card */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-sm">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Workspace Progress
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xl font-bold text-white">{tasks.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Total</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xl font-bold text-amber-400">{pendingCount}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Pending</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xl font-bold text-emerald-400">{completedCount}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Completed</div>
                </div>
              </div>

              {tasks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Completion Rate</span>
                    <span className="font-semibold text-slate-200">
                      {Math.round((completedCount / tasks.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                      style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Filters & Tasks List (7 columns on lg) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Search and Filters Bar */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks, notes, or tags..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Status Toggle (All / Pending / Done) */}
                <div className="flex p-1 bg-slate-950/80 border border-slate-800 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setActiveStatus('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      activeStatus === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveStatus('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      activeStatus === 'pending'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setActiveStatus('completed')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      activeStatus === 'completed'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['All', 'Development', 'DevOps', 'Bugfix', 'Notes', 'General'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition border ${
                      activeCategory === cat
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List / Feed Header */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-indigo-400" />
                Active Items & Notes
                <span className="text-xs font-normal text-slate-400">
                  ({filteredTasks.length} {filteredTasks.length === 1 ? 'item' : 'items'})
                </span>
              </h2>

              {(searchQuery || activeCategory !== 'All' || activeStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                    setActiveStatus('all');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Content States: Loading, Empty, or Task Grid */}
            {isLoading ? (
              <LoadingSkeleton count={4} />
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">
                  {tasks.length === 0 ? 'No tasks or notes yet' : 'No matching items found'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
                  {tasks.length === 0
                    ? 'Start by creating your first item using the form on the left. It will be immediately persisted to your Express API.'
                    : 'Try clearing your search query or selecting a different category filter above.'}
                </p>
                {tasks.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                      setActiveStatus('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                  >
                    Clear Search & Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map((task) => {
                  const taskId = task.id || task._id;
                  return (
                    <TaskCard
                      key={taskId}
                      task={task}
                      onDelete={handleDeleteTask}
                      onToggleComplete={handleToggleComplete}
                      isDeleting={deletingId === taskId}
                    />
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Floating Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
