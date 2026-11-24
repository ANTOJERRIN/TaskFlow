import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Task, TaskPriority } from '../types/task';
import {
  DEFAULT_PROJECTS,
  formatCreatedAt,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  parseTagsInput,
  validateTaskTitle,
} from '../utils/taskLogic';

export interface TaskModalSubmitPayload {
  title: string;
  description: string;
  dueDate: string | null;
  priority: TaskPriority;
  project: string;
  tags: string[];
}

interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  defaultProject?: string;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (payload: TaskModalSubmitPayload) => Promise<void> | void;
}

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string; dotClass: string }> = [
  { value: 'low', label: 'Low', dotClass: 'bg-[rgba(148,163,184,0.9)]' },
  { value: 'medium', label: 'Medium', dotClass: 'bg-[rgba(245,158,11,0.95)]' },
  { value: 'high', label: 'High', dotClass: 'bg-[rgba(239,68,68,0.95)]' },
];

export function TaskModal({
  isOpen,
  editingTask,
  defaultProject = 'Product',
  isSaving = false,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [project, setProject] = useState(defaultProject);
  const [tagsText, setTagsText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setDueDate(editingTask.dueDate ?? '');
      setPriority(editingTask.priority);
      setProject(editingTask.project);
      setTagsText(editingTask.tags.join(', '));
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      setProject(defaultProject);
      setTagsText('');
    }
    setError(null);

    const frame = requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, editingTask, defaultProject]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      setError(validation.error);
      titleInputRef.current?.focus();
      return;
    }

    await onSubmit({
      title: validation.trimmed,
      description: description.trim(),
      dueDate: dueDate ? dueDate : null,
      priority,
      project,
      tags: parseTagsInput(tagsText),
    });
  }

  const isEditMode = Boolean(editingTask);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--tf-backdrop)] backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-heading"
        className="w-full max-w-[500px] bg-[var(--tf-surface-solid)] border border-[var(--tf-border)] rounded-2xl shadow-[var(--tf-shadow-2)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--tf-divider)]">
          <h2
            id="task-modal-heading"
            className="text-[18px] leading-6 font-semibold tracking-[-0.01em] text-[var(--tf-ink)]"
          >
            {isEditMode ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="w-8 h-8 -mr-1 inline-flex items-center justify-center rounded-lg text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] hover:bg-[var(--tf-surface-hover)] transition-colors duration-150"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label
                htmlFor="modal-task-title"
                className="block text-[13px] font-medium text-[var(--tf-ink)] mb-1.5"
              >
                Title <span className="text-[var(--tf-danger-ink)]" aria-hidden="true">*</span>
              </label>
              <input
                ref={titleInputRef}
                id="modal-task-title"
                type="text"
                maxLength={MAX_TITLE_LENGTH}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="What needs to be done?"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'modal-title-error' : undefined}
                className={`w-full h-10 px-3 rounded-lg bg-[var(--tf-surface)] border text-[14px] text-[var(--tf-ink)] placeholder:text-[var(--tf-ink-muted)] transition-all duration-150 focus:outline-none focus-visible:shadow-none ${
                  error
                    ? 'border-[var(--tf-danger-ink)] focus:ring-[3px] focus:ring-[var(--tf-danger-ring)]'
                    : 'border-[var(--tf-border)] focus:border-[var(--tf-accent)] focus:ring-[3px] focus:ring-[var(--tf-accent-ring)]'
                }`}
              />
              {error && (
                <p
                  id="modal-title-error"
                  role="alert"
                  className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--tf-danger-ink)]"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="modal-task-description"
                className="block text-[13px] font-medium text-[var(--tf-ink)] mb-1.5"
              >
                Description
              </label>
              <textarea
                id="modal-task-description"
                rows={3}
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context, links, or notes..."
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-[14px] leading-5 text-[var(--tf-ink)] placeholder:text-[var(--tf-ink-muted)] resize-none transition-all duration-150 focus:outline-none focus-visible:shadow-none focus:border-[var(--tf-accent)] focus:ring-[3px] focus:ring-[var(--tf-accent-ring)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="modal-task-due-date"
                    className="block text-[13px] font-medium text-[var(--tf-ink)]"
                  >
                    Due Date
                  </label>
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className="text-[12px] font-medium text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)] transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  id="modal-task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-[14px] text-[var(--tf-ink)] tabular-nums transition-all duration-150 focus:outline-none focus-visible:shadow-none focus:border-[var(--tf-accent)] focus:ring-[3px] focus:ring-[var(--tf-accent-ring)]"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-task-project"
                  className="block text-[13px] font-medium text-[var(--tf-ink)] mb-1.5"
                >
                  Project
                </label>
                <select
                  id="modal-task-project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-[14px] text-[var(--tf-ink)] transition-all duration-150 focus:outline-none focus-visible:shadow-none focus:border-[var(--tf-accent)] focus:ring-[3px] focus:ring-[var(--tf-accent-ring)]"
                >
                  {DEFAULT_PROJECTS.map((proj) => (
                    <option key={proj} value={proj}>
                      {proj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-[13px] font-medium text-[var(--tf-ink)] mb-1.5">
                  Priority
                </span>
                <div
                  role="radiogroup"
                  aria-label="Task priority"
                  className="grid grid-cols-3 gap-1 p-1 bg-[var(--tf-surface-subtle)] rounded-lg border border-[var(--tf-border)]"
                >
                  {PRIORITY_OPTIONS.map((opt) => {
                    const selected = priority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setPriority(opt.value)}
                        className={`h-8 rounded-md text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-all ${
                          selected
                            ? 'bg-[var(--tf-surface-solid)] text-[var(--tf-ink)] shadow-[var(--tf-shadow-1)]'
                            : 'text-[var(--tf-ink-secondary)] hover:text-[var(--tf-ink)]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`w-1.5 h-1.5 rounded-full ${opt.dotClass}`}
                        />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="modal-task-tags"
                  className="block text-[13px] font-medium text-[var(--tf-ink)] mb-1.5"
                >
                  Tags
                </label>
                <input
                  id="modal-task-tags"
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="api, frontend, q4"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-[14px] text-[var(--tf-ink)] placeholder:text-[var(--tf-ink-muted)] transition-all duration-150 focus:outline-none focus-visible:shadow-none focus:border-[var(--tf-accent)] focus:ring-[3px] focus:ring-[var(--tf-accent-ring)]"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-[var(--tf-surface-subtle)] border-t border-[var(--tf-border)] flex items-center justify-between gap-3">
            <div className="text-[12px] text-[var(--tf-ink-muted)] tabular-nums truncate">
              {editingTask && formatCreatedAt(editingTask.createdAt)
                ? `Created ${formatCreatedAt(editingTask.createdAt)}`
                : ''}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="h-9 px-4 rounded-lg bg-[var(--tf-surface)] hover:bg-[var(--tf-surface-hover)] border border-[var(--tf-border)] text-[var(--tf-ink)] text-[14px] font-medium transition-colors duration-150 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-9 px-4 rounded-lg bg-[var(--tf-accent)] hover:bg-[var(--tf-accent-hover)] active:scale-[0.98] disabled:opacity-60 text-[rgba(255,255,255,0.98)] text-[14px] font-medium transition-all duration-150 whitespace-nowrap shadow-[0_2px_8px_rgba(79,70,229,0.28)]"
              >
                {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
