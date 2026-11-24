export type TaskFilter = 'all' | 'active' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type SidebarView = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export type ListDensity = 'relaxed' | 'compact';

export type ThemeMode = 'light' | 'dark';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string | null; // ISO date string 'YYYY-MM-DD' or null
  priority: TaskPriority;
  project: string;
  tags: string[];
  order: number;
  createdAt: string; // ISO 8601 timestamp
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: TaskPriority;
  project?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  completed?: boolean;
  priority?: TaskPriority;
  project?: string;
  tags?: string[];
}

export type DueDateTone = 'overdue' | 'today' | 'upcoming' | 'completed';

export interface DueDateDisplay {
  label: string;
  tone: DueDateTone;
  isOverdue: boolean;
}

export interface TaskCounts {
  all: number;
  active: number;
  done: number;
}

export interface SidebarCounts {
  all: number;
  today: number;
  upcoming: number;
  overdue: number;
  completed: number;
  byProject: Record<string, number>;
}
