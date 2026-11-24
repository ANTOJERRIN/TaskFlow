import type {
  DueDateDisplay,
  SidebarCounts,
  SidebarView,
  Task,
  TaskCounts,
  TaskFilter,
  TaskPriority,
} from '../types/task';

export const MAX_TITLE_LENGTH = 160;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_PROJECT_LENGTH = 40;
export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 24;

export const DEFAULT_PROJECTS = ['Product', 'Engineering', 'Design', 'Personal'] as const;

export const VALID_PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high'] as const;

export interface TitleValidationResult {
  valid: boolean;
  trimmed: string;
  error: string | null;
}

export function validateTaskTitle(rawTitle: unknown): TitleValidationResult {
  if (typeof rawTitle !== 'string') {
    return {
      valid: false,
      trimmed: '',
      error: 'Task title cannot be empty.',
    };
  }
  const trimmed = rawTitle.trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      trimmed,
      error: 'Task title cannot be empty.',
    };
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      trimmed,
      error: `Task title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
    };
  }
  return {
    valid: true,
    trimmed,
    error: null,
  };
}

export function normalizeDueDate(rawDueDate?: unknown): string | null {
  if (typeof rawDueDate !== 'string') return null;
  const trimmed = rawDueDate.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizePriority(rawPriority?: unknown): TaskPriority {
  if (rawPriority === 'high' || rawPriority === 'medium' || rawPriority === 'low') {
    return rawPriority;
  }
  return 'medium';
}

export function normalizeProject(rawProject?: unknown): string {
  if (typeof rawProject !== 'string') return 'Product';
  const trimmed = rawProject.trim().slice(0, MAX_PROJECT_LENGTH);
  return trimmed || 'Product';
}

export function normalizeTags(rawTags?: unknown): string[] {
  if (!Array.isArray(rawTags)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of rawTags) {
    if (typeof item !== 'string') continue;
    const cleaned = item.trim().replace(/^#+/, '').slice(0, MAX_TAG_LENGTH);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(cleaned);
    if (normalized.length >= MAX_TAGS) break;
  }
  return normalized;
}

export function parseTagsInput(raw: string): string[] {
  return normalizeTags(raw.split(','));
}

export function nextPriority(current: TaskPriority): TaskPriority {
  if (current === 'low') return 'medium';
  if (current === 'medium') return 'high';
  return 'low';
}

export function formatIsoDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function offsetIsoDate(baseIso: string, deltaDays: number): string {
  const [year, month, day] = baseIso.split('-').map(Number);
  const date = new Date(year, month - 1, day + deltaDays);
  return formatIsoDateLocal(date);
}

export function diffDaysFromToday(
  dueDate: string | null,
  todayIso: string = formatIsoDateLocal(new Date())
): number | null {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  const [dueY, dueM, dueD] = dueDate.split('-').map(Number);
  const [todayY, todayM, todayD] = todayIso.split('-').map(Number);
  const dueUtc = Date.UTC(dueY, dueM - 1, dueD);
  const todayUtc = Date.UTC(todayY, todayM - 1, todayD);
  return Math.round((dueUtc - todayUtc) / 86_400_000);
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'active':
      return tasks.filter((task) => !task.completed);
    case 'done':
      return tasks.filter((task) => task.completed);
    case 'all':
    default:
      return tasks;
  }
}

export function filterTasksByView(
  tasks: Task[],
  view: SidebarView,
  selectedProject: string | null,
  priorityFilter: TaskPriority | 'all',
  statusFilter: TaskFilter,
  searchQuery: string = '',
  todayIso: string = formatIsoDateLocal(new Date())
): Task[] {
  const query = searchQuery.trim().toLowerCase();

  return tasks
    .filter((task) => {
      if (selectedProject) {
        if (task.project !== selectedProject) return false;
      } else {
        const diff = diffDaysFromToday(task.dueDate, todayIso);
        if (view === 'today' && (task.completed || diff !== 0)) return false;
        if (view === 'upcoming' && (task.completed || diff === null || diff <= 0)) return false;
        if (view === 'overdue' && (task.completed || diff === null || diff >= 0)) return false;
        if (view === 'completed' && !task.completed) return false;
      }

      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      if (!selectedProject && view === 'completed') {
        // Already filtered to completed tasks
      } else if (statusFilter === 'active' && task.completed) {
        return false;
      } else if (statusFilter === 'done' && !task.completed) {
        return false;
      }

      if (query) {
        const inTitle = task.title.toLowerCase().includes(query);
        const inDesc = task.description.toLowerCase().includes(query);
        const inProject = task.project.toLowerCase().includes(query);
        const inTags = task.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!inTitle && !inDesc && !inProject && !inTags) return false;
      }

      return true;
    })
    .sort((a, b) => a.order - b.order);
}

export function getTaskCounts(tasks: Task[]): TaskCounts {
  let active = 0;
  let done = 0;
  for (const task of tasks) {
    if (task.completed) {
      done += 1;
    } else {
      active += 1;
    }
  }
  return {
    all: tasks.length,
    active,
    done,
  };
}

export function getCompletionPercentage(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const doneCount = tasks.filter((t) => t.completed).length;
  return Math.round((doneCount / tasks.length) * 100);
}

export function resolveInitialTheme(
  savedPref: string | null | undefined,
  systemPrefersDark: boolean
): 'light' | 'dark' {
  if (savedPref === 'dark' || savedPref === 'light') {
    return savedPref;
  }
  return systemPrefersDark ? 'dark' : 'light';
}

export function getSidebarCounts(
  tasks: Task[],
  todayIso: string = formatIsoDateLocal(new Date())
): SidebarCounts {
  let today = 0;
  let upcoming = 0;
  let overdue = 0;
  let completed = 0;
  const byProject: Record<string, number> = {};

  for (const project of DEFAULT_PROJECTS) {
    byProject[project] = 0;
  }

  for (const task of tasks) {
    if (task.completed) {
      completed += 1;
    } else {
      const diff = diffDaysFromToday(task.dueDate, todayIso);
      if (diff === 0) today += 1;
      else if (diff !== null && diff > 0) upcoming += 1;
      else if (diff !== null && diff < 0) overdue += 1;
      byProject[task.project] = (byProject[task.project] ?? 0) + 1;
    }
  }

  return {
    all: tasks.filter((t) => !t.completed).length,
    today,
    upcoming,
    overdue,
    completed,
    byProject,
  };
}

export function reorderTaskList(tasks: Task[], sourceId: string, targetId: string): Task[] {
  if (sourceId === targetId) return tasks;
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  const fromIndex = sorted.findIndex((t) => t.id === sourceId);
  const toIndex = sorted.findIndex((t) => t.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return tasks;

  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);
  return sorted.map((task, idx) => ({ ...task, order: idx }));
}

export function getDueDateDisplay(
  dueDate: string | null,
  completed: boolean,
  todayIso: string = formatIsoDateLocal(new Date())
): DueDateDisplay | null {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return null;
  }

  const [dueY, dueM, dueD] = dueDate.split('-').map(Number);
  const [todayY] = todayIso.split('-').map(Number);
  const diffDays = diffDaysFromToday(dueDate, todayIso);
  if (diffDays === null) return null;

  const dateObj = new Date(dueY, dueM - 1, dueD);
  const sameYear = dueY === todayY;
  const shortDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });

  if (completed) {
    return {
      label: shortDate,
      tone: 'completed',
      isOverdue: false,
    };
  }

  if (diffDays < 0) {
    return {
      label: `Overdue · ${shortDate}`,
      tone: 'overdue',
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Today',
      tone: 'today',
      isOverdue: false,
    };
  }

  if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      tone: 'upcoming',
      isOverdue: false,
    };
  }

  return {
    label: shortDate,
    tone: 'upcoming',
    isOverdue: false,
  };
}

export function formatHeaderDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCreatedAt(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function createSeedTasks(todayIso: string = formatIsoDateLocal(new Date())): Task[] {
  const now = new Date();
  const iso = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  return [
    {
      id: 'seed-1',
      title: 'Review Q4 product roadmap and milestone targets',
      description: 'Confirm engineering estimates and finalize release dates with design.',
      completed: false,
      dueDate: todayIso,
      priority: 'high',
      project: 'Product',
      tags: ['roadmap', 'q4'],
      order: 0,
      createdAt: iso(180),
    },
    {
      id: 'seed-2',
      title: 'Submit quarterly accessibility audit checklist',
      description: 'Verify focus ring contrast and keyboard tab order across modals.',
      completed: false,
      dueDate: offsetIsoDate(todayIso, -2),
      priority: 'high',
      project: 'Design',
      tags: ['a11y', 'audit'],
      order: 1,
      createdAt: iso(1440),
    },
    {
      id: 'seed-3',
      title: 'Connect frontend taskService to live REST API endpoints',
      description: 'Verify GET, POST, PUT, PATCH toggle, reorder, and DELETE error handling.',
      completed: false,
      dueDate: offsetIsoDate(todayIso, 3),
      priority: 'medium',
      project: 'Engineering',
      tags: ['api', 'backend'],
      order: 2,
      createdAt: iso(90),
    },
    {
      id: 'seed-4',
      title: 'Schedule dentist checkup and renew gym membership',
      description: 'Book an early morning appointment before next sprint kickoff.',
      completed: false,
      dueDate: offsetIsoDate(todayIso, 5),
      priority: 'low',
      project: 'Personal',
      tags: ['errands'],
      order: 3,
      createdAt: iso(60),
    },
    {
      id: 'seed-5',
      title: 'Audit typography scale and spacing tokens',
      description: 'Ensure Inter 400/500/600 weights and 4px baseline alignment match spec.',
      completed: true,
      dueDate: offsetIsoDate(todayIso, -1),
      priority: 'medium',
      project: 'Design',
      tags: ['tokens'],
      order: 4,
      createdAt: iso(2880),
    },
  ];
}
