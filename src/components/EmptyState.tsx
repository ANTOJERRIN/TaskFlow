import { CheckCircle2, ClipboardList, Plus } from 'lucide-react';
import type { SidebarView, TaskFilter, TaskPriority } from '../types/task';

interface EmptyStateProps {
  view: SidebarView;
  selectedProject: string | null;
  filter: TaskFilter;
  priorityFilter: TaskPriority | 'all';
  totalTasks: number;
  onAddFirstTask: () => void;
  onResetFilters: () => void;
}

export function EmptyState({
  view,
  selectedProject,
  filter,
  priorityFilter,
  totalTasks,
  onAddFirstTask,
  onResetFilters,
}: EmptyStateProps) {
  if (totalTasks === 0) {
    return (
      <div
        data-testid="empty-state"
        className="py-14 px-6 text-center flex flex-col items-center justify-center"
      >
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-xl bg-[var(--tf-accent-soft)] text-[var(--tf-accent-ink)] flex items-center justify-center mb-4"
        >
          <ClipboardList className="w-6 h-6 stroke-[1.75]" />
        </div>
        <h2 className="text-[16px] leading-6 font-semibold tracking-[-0.005em] text-[var(--tf-ink)]">
          No tasks yet
        </h2>
        <p className="mt-1.5 text-[14px] leading-5 text-[var(--tf-ink-secondary)] max-w-[320px]">
          Capture your next priority above or create a task with a due date and notes.
        </p>
        <button
          type="button"
          onClick={onAddFirstTask}
          className="mt-5 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--tf-accent)] hover:bg-[var(--tf-accent-hover)] active:scale-[0.98] text-[rgba(255,255,255,0.98)] text-[14px] font-medium transition-all duration-150 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
          <span>Add your first task</span>
        </button>
      </div>
    );
  }

  const hasSecondaryFilter = priorityFilter !== 'all' || filter !== 'all';

  if (view === 'overdue' && !selectedProject && !hasSecondaryFilter) {
    return (
      <div
        data-testid="empty-state"
        className="py-14 px-6 text-center flex flex-col items-center justify-center"
      >
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-xl bg-[var(--tf-success-bg)] text-[var(--tf-success-ink)] flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-6 h-6 stroke-[1.75]" />
        </div>
        <h2 className="text-[16px] leading-6 font-semibold tracking-[-0.005em] text-[var(--tf-ink)]">
          Nothing overdue
        </h2>
        <p className="mt-1.5 text-[14px] leading-5 text-[var(--tf-ink-secondary)] max-w-[320px]">
          Every scheduled task is right on track.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[var(--tf-surface-subtle)] hover:bg-[var(--tf-surface-hover)] border border-[var(--tf-border)] text-[var(--tf-ink)] text-[14px] font-medium transition-colors duration-150 whitespace-nowrap"
        >
          View all tasks
        </button>
      </div>
    );
  }

  if (filter === 'active' || (view === 'today' && !selectedProject)) {
    return (
      <div
        data-testid="empty-state"
        className="py-14 px-6 text-center flex flex-col items-center justify-center"
      >
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-xl bg-[var(--tf-success-bg)] text-[var(--tf-success-ink)] flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-6 h-6 stroke-[1.75]" />
        </div>
        <h2 className="text-[16px] leading-6 font-semibold tracking-[-0.005em] text-[var(--tf-ink)]">
          All caught up
        </h2>
        <p className="mt-1.5 text-[14px] leading-5 text-[var(--tf-ink-secondary)] max-w-[320px]">
          No active tasks match this view. Add something new or switch back to all tasks.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[var(--tf-surface-subtle)] hover:bg-[var(--tf-surface-hover)] border border-[var(--tf-border)] text-[var(--tf-ink)] text-[14px] font-medium transition-colors duration-150 whitespace-nowrap"
        >
          View all tasks
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="empty-state"
      className="py-14 px-6 text-center flex flex-col items-center justify-center"
    >
      <div
        aria-hidden="true"
        className="w-12 h-12 rounded-xl bg-[var(--tf-surface-subtle)] text-[var(--tf-ink-secondary)] flex items-center justify-center mb-4"
      >
        <ClipboardList className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h2 className="text-[16px] leading-6 font-semibold tracking-[-0.005em] text-[var(--tf-ink)]">
        No matching tasks
      </h2>
      <p className="mt-1.5 text-[14px] leading-5 text-[var(--tf-ink-secondary)] max-w-[320px]">
        Try clearing your active filters or add a task directly to this view.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-[var(--tf-surface-subtle)] hover:bg-[var(--tf-surface-hover)] border border-[var(--tf-border)] text-[var(--tf-ink)] text-[14px] font-medium transition-colors duration-150 whitespace-nowrap"
        >
          Reset filters
        </button>
        <button
          type="button"
          onClick={onAddFirstTask}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--tf-accent)] hover:bg-[var(--tf-accent-hover)] text-[rgba(255,255,255,0.98)] text-[14px] font-medium transition-colors duration-150 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
}
