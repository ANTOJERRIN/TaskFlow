import { useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Calendar, Flag, Plus } from 'lucide-react';
import type { TaskPriority } from '../types/task';
import {
  formatIsoDateLocal,
  nextPriority,
  offsetIsoDate,
  validateTaskTitle,
} from '../utils/taskLogic';

interface QuickAddBarProps {
  isSubmitting?: boolean;
  onAddTask: (
    title: string,
    priority: TaskPriority,
    dueDate: string | null
  ) => Promise<boolean> | boolean;
}

type QuickDuePreset = 'none' | 'today' | 'tomorrow';

const PRIORITY_META: Record<TaskPriority, { label: string; colorClass: string }> = {
  low: {
    label: 'Low',
    colorClass: 'text-[rgba(100,116,139,0.85)] dark:text-[rgba(148,163,184,0.85)]',
  },
  medium: {
    label: 'Medium',
    colorClass: 'text-[rgba(217,119,6,0.95)] dark:text-[rgba(251,191,36,0.95)]',
  },
  high: {
    label: 'High',
    colorClass: 'text-[rgba(220,38,38,0.95)] dark:text-[rgba(248,113,113,0.95)]',
  },
};

function nextDuePreset(current: QuickDuePreset): QuickDuePreset {
  if (current === 'none') return 'today';
  if (current === 'today') return 'tomorrow';
  return 'none';
}

function resolveDuePreset(preset: QuickDuePreset): string | null {
  const todayIso = formatIsoDateLocal(new Date());
  if (preset === 'today') return todayIso;
  if (preset === 'tomorrow') return offsetIsoDate(todayIso, 1);
  return null;
}

export function QuickAddBar({ isSubmitting = false, onAddTask }: QuickAddBarProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [duePreset, setDuePreset] = useState<QuickDuePreset>('none');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const validation = validateTaskTitle(title);
    if (!validation.valid) {
      setError(validation.error);
      inputRef.current?.focus();
      return;
    }

    const ok = await onAddTask(
      validation.trimmed,
      priority,
      resolveDuePreset(duePreset)
    );
    if (ok) {
      setTitle('');
      setPriority('medium');
      setDuePreset('none');
      setError(null);
    }
  }

  const priorityInfo = PRIORITY_META[priority];
  const dueLabel =
    duePreset === 'today' ? 'Today' : duePreset === 'tomorrow' ? 'Tomorrow' : 'Due';

  return (
    <section aria-label="Quick add task" className="mb-6">
      <form
        onSubmit={handleSubmit}
        noValidate
        className={`flex items-center gap-1.5 sm:gap-2 bg-[var(--tf-surface)] backdrop-blur-md rounded-xl border p-2 pl-3.5 transition-all duration-150 shadow-[var(--tf-shadow-1)] ${
          error
            ? 'border-[var(--tf-danger-ink)] ring-[3px] ring-[var(--tf-danger-ring)]'
            : 'border-[var(--tf-border)] focus-within:border-[var(--tf-accent)] focus-within:ring-[3px] focus-within:ring-[var(--tf-accent-ring)]'
        }`}
      >
        <Plus
          className="w-[18px] h-[18px] text-[var(--tf-ink-muted)] shrink-0"
          aria-hidden="true"
        />
        <label htmlFor="quick-add-task-input" className="sr-only">
          Add a new task
        </label>
        <input
          ref={inputRef}
          id="quick-add-task-input"
          type="text"
          value={title}
          disabled={isSubmitting}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Add a new task..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'quick-add-error' : undefined}
          className="flex-1 min-w-0 bg-transparent border-0 text-[15px] leading-6 text-[var(--tf-ink)] placeholder:text-[var(--tf-ink-muted)] focus:outline-none focus-visible:shadow-none py-1.5 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => setDuePreset((prev) => nextDuePreset(prev))}
          aria-label={`Quick due date: ${dueLabel}. Click to cycle between no date, today, and tomorrow`}
          title={`Due date: ${dueLabel} (click to cycle)`}
          className={`h-8 px-2 rounded-lg inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors shrink-0 ${
            duePreset !== 'none'
              ? 'bg-[var(--tf-accent-soft)] text-[var(--tf-accent-ink)]'
              : 'text-[var(--tf-ink-secondary)] hover:bg-[var(--tf-surface-hover)]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{dueLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => setPriority((prev) => nextPriority(prev))}
          aria-label={`Priority: ${priorityInfo.label}. Click to cycle priority`}
          title={`Priority: ${priorityInfo.label}`}
          className="h-8 px-2 rounded-lg hover:bg-[var(--tf-surface-hover)] inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--tf-ink-secondary)] transition-colors shrink-0"
        >
          <Flag className={`w-3.5 h-3.5 ${priorityInfo.colorClass}`} aria-hidden="true" />
          <span className="hidden sm:inline">{priorityInfo.label}</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-9 sm:h-10 px-4 rounded-lg bg-[var(--tf-accent)] hover:bg-[var(--tf-accent-hover)] active:scale-[0.98] disabled:opacity-60 text-[rgba(255,255,255,0.98)] text-[14px] font-medium transition-all duration-150 whitespace-nowrap shrink-0 shadow-[0_2px_8px_rgba(79,70,229,0.28)]"
        >
          {isSubmitting ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {error && (
        <p
          id="quick-add-error"
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[var(--tf-danger-ink)] pl-1"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </section>
  );
}
