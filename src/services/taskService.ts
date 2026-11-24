import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  UpdateTaskInput,
} from '../types/task';

export class TaskApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'TaskApiError';
    this.status = status;
  }
}

function getTasksEndpoint(): string {
  const envUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    typeof import.meta.env.VITE_API_URL === 'string'
      ? import.meta.env.VITE_API_URL.trim()
      : '';

  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/tasks') ? clean : `${clean}/tasks`;
  }
  return '/api/tasks';
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; detail?: string };
    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error;
    }
    if (typeof body.detail === 'string' && body.detail.trim()) {
      return body.detail;
    }
  } catch {
    // Fall through to status text
  }
  return `Request failed (${response.status}). Please try again.`;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new TaskApiError(
      'Unable to reach the TaskFlow server. Check your connection and try again.',
      0
    );
  }

  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('taskflow-session-expired'));
    const message = await parseErrorMessage(response);
    throw new TaskApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * Single data-access service for TaskFlow.
 * Connects to the Express REST API (/api/tasks) or an external VITE_API_URL backend.
 */
export function createTaskService(endpoint: string = getTasksEndpoint()) {
  async function getTasks(status: TaskFilter = 'all'): Promise<Task[]> {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return requestJson<Task[]>(`${endpoint}${query}`, { method: 'GET' });
  }

  async function createTask(input: CreateTaskInput): Promise<Task> {
    return requestJson<Task>(endpoint, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    return requestJson<Task>(`${endpoint}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async function toggleTask(id: string): Promise<Task> {
    return requestJson<Task>(`${endpoint}/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
    });
  }

  async function reorderTasks(orderedIds: string[]): Promise<Task[]> {
    return requestJson<Task[]>(`${endpoint}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds }),
    });
  }

  async function deleteTask(id: string): Promise<void> {
    await requestJson<void>(`${endpoint}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  return {
    getTasks,
    createTask,
    updateTask,
    toggleTask,
    reorderTasks,
    deleteTask,
  };
}

export const taskService = createTaskService();
