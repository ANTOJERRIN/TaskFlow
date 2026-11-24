import type { DragEvent } from 'react';
import { Calendar, Check, Flag, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { ListDensity, Task, TaskPriority } from '../types/task';
import { getDueDateDisplay } from '../utils/taskLogic';

interface TaskRowProps {
  task: Task;
  density: ListDensity;
  isDragging?: boolean;
  isDragOver?: boolean;
  canReorder?: boolean;
  onToggle: (id: string) => void;
  onCyclePriority: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (event: DragEvent<HTMLLIElement>, id: string) => void;
  onDrop?: (id: string) => void;
  onDragEnd?: () => void;
}

const PRIORITY_STYLES: Record<TaskPriority, { label: string; iconClass: string; textClass: string }> = {
  high: {
    label: 'High',
    iconClass: 'text-[rgba(220,38,38,0.92)] dark:text-[rgba(248,113,113,0.95)]',
    textClass: 'text-[rgba(220,38,38,0.92)] dark:text-[rgba(252,165,165,0.95)]',
  },
  medium: {
    label: 'Medium',
    iconClass: 'text-[rgba(217,119,6,0.92)] dark:text-[rgba(251,191,36,0.95)]',
    textClass: 'text-[rgba(180,83,9,0.92)] dark:text-[rgba(252,211,77,0.95)]',
  },
  low: {
    label: 'Low',
    iconClass: 'text-[rgba(100,116,139,0.75)] dark:text-[rgba(148,163,184,0.75)]',
    textClass: 'text-[var(--tf-ink-muted)]',
  },
};

export function TaskRow({
  task,
  density,
  isDragging = false,
  isDragOver = false,
  canReorder = true,
  onToggle,
  onCyclePriority,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TaskRowProps) {
  const dueDisplay = getDueDateDisplay(task.dueDate, task.completed);
  const isCompact = density === 'compact';
  const priorityStyle = PRIORITY_STYLES[task.priority];

  const dueClasses: Record<string, string> = {
    overdue: 'bg-[var(--tf-danger-bg)] text-[var(--tf-danger-ink)] px-2 py-0.5 rounded-md',
    today: 'bg-[var(--tf-accent-soft)] text-[var(--tf-accent-ink)] px-2 py-0.5 rounded-md',
    upcoming: 'bg-[var(--tf-surface-subtle)] text-[var(--tf-ink-secondary)] px-2 py-0.5 rounded-md',
    completed: 'text-[var(--tf-ink-muted)]',
  };

  return (
    <li
      data-testid="task-item"
      data-completed={task.completed ? 'true' : 'false'}
      data-priority={task.priority}
      draggable={canReorder}
      onDragStart={(e) => {
        if (!canReorder) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        onDragStart?.(task.id);
      }}
      onDragOver={(e) => {
        if (!canReorder) return;
        onDragOver?.(e, task.id);
      }}
      onDrop={(e) => {
        if (!canReorder) return;
        e.preventDefault();
        onDrop?.(task.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`group transition-all duration-150 border-b border-[var(--tf-divider)] last:border-b-0 ${
        isDragging
          ? 'bg-[var(--tf-surface-solid)] shadow-[var(--tf-shadow-2)] ring-1 ring-[var(--tf-accent)] relative z-10 opacity-95'
          : isDragOver
          ? 'bg-[var(--tf-accent-soft)] border-t-2 border-t-[var(--tf-accent)]'
          : 'bg-transparent hover:bg-[var(--tf-surface-hover)]'
      }`}
    >
      <div
        className={`flex items-start gap-2 sm:gap-2.5 px-3.5 sm:px-4 ${
          isCompact ? 'py-2' : 'py-3.5'
        }`}
      >
        {canReorder && (
          <span
            aria-hidden="true"
            title="Drag to reorder"
            className="hidden sm:inline-flex items-center justify-center w-5 h-6 -ml-1 text-[var(--tf-border-strong)] group-hover:text-[var(--tf-ink-muted)] cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </span>
        )}

        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={
            task.completed
              ? `Mark "${task.title}" as active`
              : `Mark "${task.title}" as complete`
          }
          onClick={() => onToggle(task.id)}
          className="w-9 h-9 -ml-2 -mt-[7px] inline-flex items-center justify-center rounded-lg shrink-0 focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className={`w-[18px] h-[18px] rounded-[5px] inline-flex items-center justify-center transition-all duration-150 ${
              task.completed
                ? 'bg-[var(--tf-accent)] border-[1.5px] border-[var(--tf-accent)] text-[rgba(255,255,255,0.98)]'
                : 'bg-transparent border-[1.5px] border-[var(--tf-border-strong)] group-hover:border-[var(--tf-accent)]'
            }`}
          >
            {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
        </button>

        <div className="min-w-0 flex-1 sm:flex sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <span
              className={`block text-[14px] leading-5 font-medium break-words transition-all duration-150 ${
                task.completed
                  ? 'line-through text-[var(--tf-ink-muted)]'
                  : 'text-[var(--tf-ink)]'
              }`}
            >
              {task.title}
            </span>

            {!isCompact && task.description && (
              <p
                className={`mt-1 text-[13px] leading-[18px] line-clamp-2 break-words transition-colors duration-150 ${
                  task.completed ? 'text-[var(--tf-ink-muted)] opacity-80' : 'text-[var(--tf-ink-secondary)]'
                }`}
              >
                {task.description}
              </p>
            )}

            {!isCompact && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] leading-4 text-[var(--tf-ink-muted)]">
                <span>{task.project}</span>
                <span aria-hidden="true" className="text-[var(--tf-border-strong)]">
                  ·
                </span>
                <span className={task.completed ? 'text-[var(--tf-ink-muted)]' : priorityStyle.textClass}>
                  {priorityStyle.label}
                </span>
                {task.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-2 text-[var(--tf-ink-muted)]">
                    <span aria-hidden="true" className="text-[var(--tf-border-strong)]">
                      ·
                    </span>
                    <span>#{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {dueDisplay && (
            <span
              className={`mt-2 sm:mt-0 inline-flex items-center gap-1 text-[12px] leading-4 font-medium tracking-[0.01em] tabular-nums whitespace-nowrap shrink-0 ${
                dueClasses[dueDisplay.tone]
              }`}
            >
              <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{dueDisplay.label}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0 -mr-1.5 -mt-[7px]">
          <button
            type="button"
            onClick={() => onCyclePriority(task)}
            aria-label={`Change priority of "${task.title}" (currently ${priorityStyle.label})`}
            title={`Priority: ${priorityStyle.label} (click to cycle)`}
            className="w-8 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-muted)] hover:bg-[var(--tf-surface-hover)] transition-colors duration-150"
          >
            <Flag
              className={`w-3.5 h-3.5 ${
                task.completed ? 'text-[var(--tf-border-strong)]' : priorityStyle.iconClass
              }`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit "${task.title}"`}
            title="Edit task"
            className="w-8 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-muted)] hover:text-[var(--tf-accent-ink)] hover:bg-[var(--tf-accent-soft)] transition-colors duration-150"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete "${task.title}"`}
            title="Delete task"
            className="w-8 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-muted)] hover:text-[var(--tf-danger-ink)] hover:bg-[var(--tf-danger-bg)] transition-colors duration-150"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}
