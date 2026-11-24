import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { CommandPalette } from './components/CommandPalette';
import { EmptyState } from './components/EmptyState';
import { FilterTabs } from './components/FilterTabs';
import { Header } from './components/Header';
import { QuickAddBar } from './components/QuickAddBar';
import { Sidebar } from './components/Sidebar';
import { TaskListSkeleton } from './components/TaskListSkeleton';
import { TaskModal, type TaskModalSubmitPayload } from './components/TaskModal';
import { TaskRow } from './components/TaskRow';
import { Toast, type ToastMessage } from './components/Toast';
import { TaskApiError, taskService } from './services/taskService';
import type {
  ListDensity,
  SidebarView,
  Task,
  TaskFilter,
  TaskPriority,
  ThemeMode,
} from './types/task';
import {
  filterTasksByView,
  formatHeaderDate,
  formatIsoDateLocal,
  getCompletionPercentage,
  getSidebarCounts,
  getTaskCounts,
  nextPriority,
  reorderTaskList,
  resolveInitialTheme,
} from './utils/taskLogic';

const VIEW_TITLES: Record<SidebarView, string> = {
  all: 'All Tasks',
  today: 'Today',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  completed: 'Completed',
};

const DENSITY_STORAGE_KEY = 'taskflow_density_pref';
const THEME_STORAGE_KEY = 'taskflow_theme_pref';

function readInitialDensity(): ListDensity {
  try {
    const saved = window.localStorage.getItem(DENSITY_STORAGE_KEY);
    return saved === 'compact' ? 'compact' : 'relaxed';
  } catch {
    return 'relaxed';
  }
}

function readInitialTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    return resolveInitialTheme(saved, prefersDark);
  } catch {
    return 'light';
  }
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [isClearingDone, setIsClearingDone] = useState(false);

  const [activeView, setActiveView] = useState<SidebarView>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [density, setDensity] = useState<ListDensity>(readInitialDensity);
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage restrictions
    }
  }, [theme]);

  const showToast = useCallback((text: string, tone: 'error' | 'success' = 'error') => {
    setToast({ id: `${Date.now()}`, tone, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await taskService.getTasks('all');
      setTasks(data);
    } catch (error) {
      const msg =
        error instanceof TaskApiError
          ? error.message
          : 'Could not load tasks from the server.';
      setLoadError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  function handleToggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function handleToggleDensity() {
    setDensity((prev) => {
      const next: ListDensity = prev === 'relaxed' ? 'compact' : 'relaxed';
      try {
        window.localStorage.setItem(DENSITY_STORAGE_KEY, next);
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  }

  function handleSelectView(view: SidebarView) {
    setSelectedProject(null);
    setActiveView(view);
    if (view === 'completed') {
      setStatusFilter('done');
    } else if (statusFilter === 'done') {
      setStatusFilter('all');
    }
  }

  function handleSelectProject(project: string) {
    setSelectedProject(project);
    setStatusFilter('all');
  }

  function handleResetFilters() {
    setSelectedProject(null);
    setActiveView('all');
    setStatusFilter('all');
    setPriorityFilter('all');
  }

  const sidebarCounts = useMemo(() => getSidebarCounts(tasks), [tasks]);

  const scopedTasksForStatusCounts = useMemo(
    () =>
      filterTasksByView(tasks, activeView, selectedProject, priorityFilter, 'all'),
    [tasks, activeView, selectedProject, priorityFilter]
  );

  const statusCounts = useMemo(
    () => getTaskCounts(scopedTasksForStatusCounts),
    [scopedTasksForStatusCounts]
  );

  const visibleTasks = useMemo(
    () =>
      filterTasksByView(
        tasks,
        activeView,
        selectedProject,
        priorityFilter,
        statusFilter
      ),
    [tasks, activeView, selectedProject, priorityFilter, statusFilter]
  );

  const overallCounts = useMemo(() => getTaskCounts(tasks), [tasks]);
  const completionPct = useMemo(() => getCompletionPercentage(tasks), [tasks]);
  const headerDate = useMemo(() => formatHeaderDate(), []);

  async function handleQuickAdd(
    title: string,
    priority: TaskPriority,
    quickDueDate: string | null
  ): Promise<boolean> {
    setIsQuickAdding(true);
    try {
      const defaultDueDate =
        quickDueDate ??
        (!selectedProject && activeView === 'today'
          ? formatIsoDateLocal(new Date())
          : null);
      const created = await taskService.createTask({
        title,
        priority,
        project: selectedProject ?? 'Product',
        dueDate: defaultDueDate,
      });
      setTasks((prev) =>
        [created, ...prev].map((item, idx) => ({ ...item, order: idx }))
      );
      if (statusFilter === 'done' || (!selectedProject && activeView === 'completed')) {
        setActiveView('all');
        setStatusFilter('all');
      }
      return true;
    } catch (error) {
      const msg =
        error instanceof TaskApiError ? error.message : 'Failed to create task.';
      showToast(msg, 'error');
      return false;
    } finally {
      setIsQuickAdding(false);
    }
  }

  async function handleToggleTask(id: string) {
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    try {
      const updated = await taskService.toggleTask(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (error) {
      setTasks(previous);
      const msg =
        error instanceof TaskApiError ? error.message : 'Failed to update task status.';
      showToast(msg, 'error');
    }
  }

  async function handleCyclePriority(task: Task) {
    const next = nextPriority(task.priority);
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, priority: next } : t))
    );
    try {
      const updated = await taskService.updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        completed: task.completed,
        priority: next,
        project: task.project,
        tags: task.tags,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (error) {
      setTasks(previous);
      const msg =
        error instanceof TaskApiError ? error.message : 'Failed to update priority.';
      showToast(msg, 'error');
    }
  }

  async function handleDeleteTask(id: string) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await taskService.deleteTask(id);
    } catch (error) {
      setTasks(previous);
      const msg =
        error instanceof TaskApiError ? error.message : 'Failed to delete task.';
      showToast(msg, 'error');
    }
  }

  async function handleClearCompleted() {
    const completedIds = tasks.filter((t) => t.completed).map((t) => t.id);
    if (completedIds.length === 0 || isClearingDone) return;

    setIsClearingDone(true);
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => !t.completed));
    try {
      await Promise.all(completedIds.map((id) => taskService.deleteTask(id)));
      showToast(
        `Cleared ${completedIds.length} completed ${
          completedIds.length === 1 ? 'task' : 'tasks'
        }.`,
        'success'
      );
    } catch (error) {
      setTasks(previous);
      const msg =
        error instanceof TaskApiError ? error.message : 'Failed to clear completed tasks.';
      showToast(msg, 'error');
    } finally {
      setIsClearingDone(false);
    }
  }

  function handleOpenNewModal() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(task: Task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingTask(null);
  }

  async function handleModalSubmit(payload: TaskModalSubmitPayload) {
    setIsModalSaving(true);
    try {
      if (editingTask) {
        const updated = await taskService.updateTask(editingTask.id, {
          title: payload.title,
          description: payload.description,
          dueDate: payload.dueDate,
          priority: payload.priority,
          project: payload.project,
          tags: payload.tags,
        });
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? updated : t))
        );
      } else {
        const created = await taskService.createTask({
          title: payload.title,
          description: payload.description,
          dueDate: payload.dueDate,
          priority: payload.priority,
          project: payload.project,
          tags: payload.tags,
        });
        setTasks((prev) =>
          [created, ...prev].map((item, idx) => ({ ...item, order: idx }))
        );
        if (statusFilter === 'done' || (!selectedProject && activeView === 'completed')) {
          setActiveView('all');
          setStatusFilter('all');
        }
      }
      handleCloseModal();
    } catch (error) {
      const msg =
        error instanceof TaskApiError ? error.message : 'Failed to save task.';
      showToast(msg, 'error');
    } finally {
      setIsModalSaving(false);
    }
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(event: DragEvent<HTMLLIElement>, targetId: string) {
    event.preventDefault();
    if (draggingId && draggingId !== targetId) {
      setDragOverId(targetId);
    }
  }

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const previous = tasks;
    const reordered = reorderTaskList(tasks, draggingId, targetId);
    setTasks(reordered);
    setDraggingId(null);
    setDragOverId(null);

    try {
      const saved = await taskService.reorderTasks(reordered.map((t) => t.id));
      setTasks(saved);
    } catch (error) {
      setTasks(previous);
      const msg =
        error instanceof TaskApiError ? error.message : 'Failed to save task order.';
      showToast(msg, 'error');
    }
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  const sectionLabel = selectedProject ? 'Projects' : 'Workspace';
  const viewTitle = selectedProject ?? VIEW_TITLES[activeView];
  const showStatusTabs = Boolean(selectedProject) || activeView === 'all';
  const remainingCount = showStatusTabs
    ? statusCounts.active
    : visibleTasks.filter((t) => !t.completed).length;
  const remainingLabel =
    remainingCount === 1 ? '1 task left' : `${remainingCount} tasks left`;

  return (
    <div id="top" className="min-h-screen text-[var(--tf-ink)] flex">
      <Sidebar
        activeView={activeView}
        selectedProject={selectedProject}
        counts={sidebarCounts}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onSelectView={handleSelectView}
        onSelectProject={handleSelectProject}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenCommandPalette={() => setIsCommandOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          sectionLabel={sectionLabel}
          viewTitle={viewTitle}
          density={density}
          theme={theme}
          onToggleDensity={handleToggleDensity}
          onToggleTheme={handleToggleTheme}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCommandPalette={() => setIsCommandOpen(true)}
          onOpenNewTask={handleOpenNewModal}
        />

        <main className="flex-1 w-full max-w-[848px] mx-auto px-4 sm:px-8 pt-7 pb-16">
          <div className="max-w-[768px] mx-auto">
            {/* Page Heading + Subtle MVP Completion Progress */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-[26px] sm:text-[32px] leading-[34px] sm:leading-[40px] font-semibold tracking-[-0.02em] text-[var(--tf-ink)] [text-wrap:balance]">
                  {viewTitle}
                </h1>
                <p className="mt-1 text-[14px] leading-5 text-[var(--tf-ink-secondary)]">
                  {headerDate}
                </p>
              </div>

              {overallCounts.all > 0 && (
                <div
                  aria-label={`Overall progress: ${completionPct}% completed`}
                  className="sm:w-[196px] shrink-0"
                >
                  <div className="flex items-center justify-between text-[12px] leading-4 mb-1.5 tabular-nums">
                    <span className="font-medium text-[var(--tf-ink-secondary)]">
                      Progress
                    </span>
                    <span className="font-semibold text-[var(--tf-ink)]">
                      {completionPct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--tf-surface-subtle)] border border-[var(--tf-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--tf-accent)] transition-[width] duration-300"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <QuickAddBar
              isSubmitting={isQuickAdding}
              onAddTask={handleQuickAdd}
            />

            <FilterTabs
              activeFilter={statusFilter}
              priorityFilter={priorityFilter}
              counts={statusCounts}
              showStatusTabs={showStatusTabs}
              onChangeStatus={setStatusFilter}
              onChangePriority={setPriorityFilter}
            />

            <section
              aria-label="Task list"
              className="bg-[var(--tf-surface)] backdrop-blur-md border border-[var(--tf-border)] rounded-xl overflow-hidden shadow-[var(--tf-shadow-1)] transition-colors duration-150"
            >
              {isLoading ? (
                <TaskListSkeleton density={density} rows={4} />
              ) : loadError ? (
                <div className="py-12 px-6 text-center flex flex-col items-center">
                  <p className="text-[14px] font-medium text-[var(--tf-ink)]">
                    Could not load your tasks
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--tf-ink-secondary)] max-w-[340px]">
                    {loadError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void fetchTasks()}
                    className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--tf-accent)] hover:bg-[var(--tf-accent-hover)] text-[rgba(255,255,255,0.98)] text-[14px] font-medium transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : visibleTasks.length > 0 ? (
                <ul className="divide-y divide-[var(--tf-divider)]">
                  {visibleTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      density={density}
                      isDragging={draggingId === task.id}
                      isDragOver={dragOverId === task.id}
                      canReorder={visibleTasks.length > 1}
                      onToggle={handleToggleTask}
                      onCyclePriority={handleCyclePriority}
                      onEdit={handleOpenEditModal}
                      onDelete={handleDeleteTask}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  view={activeView}
                  selectedProject={selectedProject}
                  filter={statusFilter}
                  priorityFilter={priorityFilter}
                  totalTasks={overallCounts.all}
                  onAddFirstTask={handleOpenNewModal}
                  onResetFilters={handleResetFilters}
                />
              )}

              <footer
                data-testid="task-footer"
                className="bg-[var(--tf-surface-subtle)] border-t border-[var(--tf-border)] px-4 py-3 flex items-center justify-between gap-4 text-[13px] leading-[18px] text-[var(--tf-ink-secondary)]"
              >
                <span className="font-medium text-[var(--tf-ink)] tabular-nums">
                  {remainingLabel}
                </span>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums">
                    {overallCounts.all === 0
                      ? 'Ready when you are'
                      : `${overallCounts.done} of ${overallCounts.all} completed`}
                  </span>
                  {overallCounts.done > 0 && (
                    <button
                      type="button"
                      disabled={isClearingDone}
                      onClick={() => void handleClearCompleted()}
                      className="text-[12px] font-medium text-[var(--tf-ink-muted)] hover:text-[var(--tf-danger-ink)] transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {isClearingDone ? 'Clearing...' : 'Clear completed'}
                    </button>
                  )}
                </div>
              </footer>
            </section>
          </div>
        </main>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        editingTask={editingTask}
        defaultProject={selectedProject ?? 'Product'}
        isSaving={isModalSaving}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        tasks={tasks}
        density={density}
        theme={theme}
        onClose={() => setIsCommandOpen(false)}
        onCreateNewTask={handleOpenNewModal}
        onSelectTask={handleOpenEditModal}
        onSelectView={handleSelectView}
        onToggleDensity={handleToggleDensity}
        onToggleTheme={handleToggleTheme}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
