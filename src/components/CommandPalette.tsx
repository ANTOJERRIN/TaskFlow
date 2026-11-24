import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  Columns2,
  Inbox,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import type { ListDensity, SidebarView, Task, ThemeMode } from '../types/task';

interface CommandPaletteProps {
  isOpen: boolean;
  tasks: Task[];
  density: ListDensity;
  theme: ThemeMode;
  onClose: () => void;
  onCreateNewTask: () => void;
  onSelectTask: (task: Task) => void;
  onSelectView: (view: SidebarView) => void;
  onToggleDensity: () => void;
  onToggleTheme: () => void;
}

interface PaletteItem {
  id: string;
  group: 'Actions' | 'Tasks';
  label: string;
  hint?: string;
  shortcut?: string;
  completed?: boolean;
  onExecute: () => void;
}

export function CommandPalette({
  isOpen,
  tasks,
  density,
  theme,
  onClose,
  onCreateNewTask,
  onSelectTask,
  onSelectView,
  onToggleDensity,
  onToggleTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIndex(0);
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();

    const quickActions: PaletteItem[] = [
      {
        id: 'action-new-task',
        group: 'Actions',
        label: 'Create new task',
        shortcut: 'N',
        onExecute: () => {
          onClose();
          onCreateNewTask();
        },
      },
      {
        id: 'action-theme',
        group: 'Actions',
        label: theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode',
        shortcut: 'T',
        onExecute: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'action-view-all',
        group: 'Actions',
        label: 'Go to All Tasks',
        shortcut: 'G A',
        onExecute: () => {
          onSelectView('all');
          onClose();
        },
      },
      {
        id: 'action-view-today',
        group: 'Actions',
        label: 'Go to Today',
        shortcut: 'G T',
        onExecute: () => {
          onSelectView('today');
          onClose();
        },
      },
      {
        id: 'action-view-overdue',
        group: 'Actions',
        label: 'Go to Overdue',
        shortcut: 'G O',
        onExecute: () => {
          onSelectView('overdue');
          onClose();
        },
      },
      {
        id: 'action-density',
        group: 'Actions',
        label:
          density === 'relaxed'
            ? 'Switch to Compact list density'
            : 'Switch to Relaxed list density',
        shortcut: 'D',
        onExecute: () => {
          onToggleDensity();
          onClose();
        },
      },
    ];

    const matchedActions = q
      ? quickActions.filter((a) => a.label.toLowerCase().includes(q))
      : quickActions;

    const matchedTasks: PaletteItem[] = tasks
      .filter((t) => {
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.project.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .slice(0, 6)
      .map((task) => ({
        id: `task-${task.id}`,
        group: 'Tasks',
        label: task.title,
        hint: task.project,
        completed: task.completed,
        onExecute: () => {
          onClose();
          onSelectTask(task);
        },
      }));

    return [...matchedActions, ...matchedTasks];
  }, [
    query,
    tasks,
    density,
    theme,
    onClose,
    onCreateNewTask,
    onSelectTask,
    onSelectView,
    onToggleDensity,
    onToggleTheme,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) =>
          items.length > 0 ? (prev - 1 + items.length) % items.length : 0
        );
      } else if (event.key === 'Enter' && items[activeIndex]) {
        event.preventDefault();
        items[activeIndex].onExecute();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, activeIndex, onClose]);

  if (!isOpen) return null;

  function renderIcon(item: PaletteItem) {
    if (item.id === 'action-new-task') return <Plus className="w-4 h-4 text-[var(--tf-accent-ink)]" />;
    if (item.id === 'action-theme') {
      return theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[rgba(251,191,36,0.95)]" />
      ) : (
        <Moon className="w-4 h-4 text-[var(--tf-ink-secondary)]" />
      );
    }
    if (item.id === 'action-view-today') return <Calendar className="w-4 h-4 text-[var(--tf-ink-secondary)]" />;
    if (item.id === 'action-view-overdue') return <AlertCircle className="w-4 h-4 text-[var(--tf-danger-ink)]" />;
    if (item.id === 'action-density') return <Columns2 className="w-4 h-4 text-[var(--tf-ink-secondary)]" />;
    if (item.group === 'Actions') return <Inbox className="w-4 h-4 text-[var(--tf-ink-secondary)]" />;
    return (
      <span
        className={`w-4 h-4 rounded-[4px] inline-flex items-center justify-center border ${
          item.completed
            ? 'bg-[var(--tf-accent)] border-[var(--tf-accent)] text-[rgba(255,255,255,0.98)]'
            : 'border-[var(--tf-border-strong)] bg-transparent'
        }`}
      >
        {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
      </span>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-[var(--tf-backdrop)] backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-[540px] bg-[var(--tf-surface-solid)] border border-[var(--tf-border)] rounded-2xl shadow-[var(--tf-shadow-2)] overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--tf-border)]">
          <Search className="w-4 h-4 text-[var(--tf-ink-muted)] shrink-0" aria-hidden="true" />
          <label htmlFor="command-palette-input" className="sr-only">
            Search tasks or commands
          </label>
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, or jump to a view..."
            className="flex-1 min-w-0 bg-transparent text-[16px] leading-6 font-medium text-[var(--tf-ink)] placeholder:text-[var(--tf-ink-muted)] placeholder:font-normal focus:outline-none focus-visible:shadow-none"
          />
          <kbd className="text-[11px] font-medium text-[var(--tf-ink-secondary)] bg-[var(--tf-surface-subtle)] border border-[var(--tf-border)] px-1.5 py-0.5 rounded-md">
            ESC
          </kbd>
        </div>

        <div className="max-h-[340px] overflow-y-auto py-2">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[14px] text-[var(--tf-ink-secondary)]">
              No matching tasks or commands for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul role="listbox" aria-label="Command results">
              {items.map((item, idx) => {
                const isFirstInGroup = idx === 0 || items[idx - 1].group !== item.group;
                const isSelected = idx === activeIndex;

                return (
                  <li key={item.id}>
                    {isFirstInGroup && (
                      <div className="px-4 pt-2 pb-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--tf-ink-muted)]">
                        {item.group}
                      </div>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={item.onExecute}
                      className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-[var(--tf-surface-active)] text-[var(--tf-ink)]'
                          : 'text-[var(--tf-ink-secondary)] hover:bg-[var(--tf-surface-hover)]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5 min-w-0">
                        <span aria-hidden="true" className="shrink-0">
                          {renderIcon(item)}
                        </span>
                        <span
                          className={`text-[14px] truncate ${
                            item.completed
                              ? 'line-through text-[var(--tf-ink-muted)]'
                              : 'font-medium text-[var(--tf-ink)]'
                          }`}
                        >
                          {item.label}
                        </span>
                      </span>

                      {item.shortcut ? (
                        <kbd className="text-[11px] font-medium text-[var(--tf-ink-secondary)] bg-[var(--tf-surface-subtle)] border border-[var(--tf-border)] px-1.5 py-0.5 rounded-md shrink-0">
                          {item.shortcut}
                        </kbd>
                      ) : item.hint ? (
                        <span className="text-[12px] text-[var(--tf-ink-muted)] shrink-0">
                          {item.hint}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-4 py-2.5 bg-[var(--tf-surface-subtle)] border-t border-[var(--tf-border)] flex items-center justify-between text-[12px] text-[var(--tf-ink-secondary)]">
          <span className="inline-flex items-center gap-2">
            <kbd className="bg-[var(--tf-surface)] border border-[var(--tf-border)] px-1.5 py-0.5 rounded text-[11px]">
              ↑↓
            </kbd>
            <span>Navigate</span>
            <kbd className="bg-[var(--tf-surface)] border border-[var(--tf-border)] px-1.5 py-0.5 rounded text-[11px] ml-1">
              ↵
            </kbd>
            <span>Open</span>
          </span>
          <span className="text-[var(--tf-ink-muted)]">TaskFlow Command</span>
        </div>
      </div>
    </div>
  );
}
