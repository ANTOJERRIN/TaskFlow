import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  CreateTaskInput,
  Task,
  TaskFilter,
  UpdateTaskInput,
} from '../src/types/task.ts';
import {
  createSeedTasks,
  filterTasks,
  MAX_DESCRIPTION_LENGTH,
  normalizeDueDate,
  normalizePriority,
  normalizeProject,
  normalizeTags,
  validateTaskTitle,
} from '../src/utils/taskLogic.ts';

export class StoreValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'StoreValidationError';
    this.statusCode = statusCode;
  }
}

function isValidStoredTask(candidate: unknown): candidate is Task {
  if (!candidate || typeof candidate !== 'object') return false;
  const t = candidate as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.description === 'string' &&
    typeof t.completed === 'boolean' &&
    (t.dueDate === null || typeof t.dueDate === 'string') &&
    typeof t.createdAt === 'string'
  );
}

function hydrateTask(raw: Task, index: number): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? '',
    completed: Boolean(raw.completed),
    dueDate: normalizeDueDate(raw.dueDate),
    priority: normalizePriority(raw.priority),
    project: normalizeProject(raw.project),
    tags: normalizeTags(raw.tags),
    order: typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : index,
    createdAt: raw.createdAt,
  };
}

export function resolveSafeStorePath(baseDir: string, filename = 'tasks.json'): string {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, filename);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    throw new StoreValidationError('Invalid storage path.', 400);
  }
  return resolvedTarget;
}

export function createFileTaskStore(dataDir: string) {
  const safeFilePath = resolveSafeStorePath(dataDir, 'tasks.json');
  const resolvedBase = path.resolve(dataDir);

  function ensureDir() {
    if (!fs.existsSync(resolvedBase)) {
      fs.mkdirSync(resolvedBase, { recursive: true });
    }
  }

  function writeAll(tasks: Task[]): void {
    ensureDir();
    const normalized = tasks.map((task, idx) => ({ ...task, order: idx }));
    const tmpPath = `${safeFilePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(normalized, null, 2), 'utf8');
    fs.renameSync(tmpPath, safeFilePath);
  }

  function readAll(): Task[] {
    if (!fs.existsSync(safeFilePath)) {
      const seeded = createSeedTasks();
      writeAll(seeded);
      return seeded;
    }
    const content = fs.readFileSync(safeFilePath, 'utf8');
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed) || !parsed.every(isValidStoredTask)) {
      throw new Error('Invalid task storage data.');
    }
    return parsed
      .map((task, idx) => hydrateTask(task, idx))
      .sort((a, b) => a.order - b.order);
  }

  function list(status: TaskFilter = 'all'): Task[] {
    const tasks = readAll();
    return filterTasks(tasks, status);
  }

  function create(input: CreateTaskInput): Task {
    const validation = validateTaskTitle(input?.title);
    if (!validation.valid) {
      throw new StoreValidationError(validation.error ?? 'Task title cannot be empty.', 400);
    }

    const description =
      typeof input.description === 'string'
        ? input.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
        : '';

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: validation.trimmed,
      description,
      completed: false,
      dueDate: normalizeDueDate(input.dueDate),
      priority: normalizePriority(input.priority),
      project: normalizeProject(input.project),
      tags: normalizeTags(input.tags),
      order: 0,
      createdAt: new Date().toISOString(),
    };

    const existing = readAll();
    const next = [newTask, ...existing].map((t, idx) => ({ ...t, order: idx }));
    writeAll(next);
    return next[0];
  }

  function update(id: string, input: UpdateTaskInput): Task {
    if (!id || typeof id !== 'string' || id.length > 100) {
      throw new StoreValidationError('Invalid task identifier.', 400);
    }
    const validation = validateTaskTitle(input?.title);
    if (!validation.valid) {
      throw new StoreValidationError(validation.error ?? 'Task title cannot be empty.', 400);
    }

    const tasks = readAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new StoreValidationError('Task not found.', 404);
    }

    const existing = tasks[index];
    const updated: Task = {
      ...existing,
      title: validation.trimmed,
      description:
        typeof input.description === 'string'
          ? input.description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
          : existing.description,
      dueDate:
        input.dueDate !== undefined
          ? normalizeDueDate(input.dueDate)
          : existing.dueDate,
      completed:
        typeof input.completed === 'boolean' ? input.completed : existing.completed,
      priority:
        input.priority !== undefined
          ? normalizePriority(input.priority)
          : existing.priority,
      project:
        input.project !== undefined
          ? normalizeProject(input.project)
          : existing.project,
      tags: input.tags !== undefined ? normalizeTags(input.tags) : existing.tags,
    };

    const next = [...tasks];
    next[index] = updated;
    writeAll(next);
    return updated;
  }

  function toggle(id: string): Task {
    if (!id || typeof id !== 'string' || id.length > 100) {
      throw new StoreValidationError('Invalid task identifier.', 400);
    }
    const tasks = readAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new StoreValidationError('Task not found.', 404);
    }
    const updated: Task = {
      ...tasks[index],
      completed: !tasks[index].completed,
    };
    const next = [...tasks];
    next[index] = updated;
    writeAll(next);
    return updated;
  }

  function reorder(orderedIds: unknown): Task[] {
    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string')) {
      throw new StoreValidationError('orderedIds must be an array of task IDs.', 400);
    }
    const tasks = readAll();
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const next: Task[] = [];
    const seen = new Set<string>();

    for (const id of orderedIds) {
      const found = byId.get(id);
      if (found && !seen.has(id)) {
        seen.add(id);
        next.push(found);
      }
    }
    for (const task of tasks) {
      if (!seen.has(task.id)) {
        next.push(task);
      }
    }

    const reindexed = next.map((task, idx) => ({ ...task, order: idx }));
    writeAll(reindexed);
    return reindexed;
  }

  function remove(id: string): void {
    if (!id || typeof id !== 'string' || id.length > 100) {
      throw new StoreValidationError('Invalid task identifier.', 400);
    }
    const tasks = readAll();
    const exists = tasks.some((t) => t.id === id);
    if (!exists) {
      throw new StoreValidationError('Task not found.', 404);
    }
    const next = tasks.filter((t) => t.id !== id).map((t, idx) => ({ ...t, order: idx }));
    writeAll(next);
  }

  return {
    list,
    create,
    update,
    toggle,
    reorder,
    remove,
  };
}
