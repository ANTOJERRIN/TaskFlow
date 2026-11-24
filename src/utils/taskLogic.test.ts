import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSeedTasks,
  filterTasks,
  filterTasksByView,
  getCompletionPercentage,
  getDueDateDisplay,
  getSidebarCounts,
  getTaskCounts,
  nextPriority,
  normalizeDueDate,
  parseTagsInput,
  reorderTaskList,
  resolveInitialTheme,
  validateTaskTitle,
} from './taskLogic.ts';

test('validateTaskTitle rejects empty and whitespace-only titles', () => {
  assert.equal(validateTaskTitle('').valid, false);
  assert.equal(validateTaskTitle('   \t\n  ').valid, false);
  assert.equal(validateTaskTitle(null).valid, false);
  assert.equal(validateTaskTitle('   ').error, 'Task title cannot be empty.');
});

test('validateTaskTitle accepts and trims valid titles', () => {
  const result = validateTaskTitle('  Ship v1 release  ');
  assert.equal(result.valid, true);
  assert.equal(result.trimmed, 'Ship v1 release');
  assert.equal(result.error, null);
});

test('normalizeDueDate accepts valid ISO date and rejects blank/malformed strings', () => {
  assert.equal(normalizeDueDate('2026-11-24'), '2026-11-24');
  assert.equal(normalizeDueDate(''), null);
  assert.equal(normalizeDueDate('   '), null);
  assert.equal(normalizeDueDate('11/24/2026'), null);
  assert.equal(normalizeDueDate(null), null);
});

test('parseTagsInput trims, strips leading #, deduplicates, and caps at 5 tags', () => {
  assert.deepEqual(parseTagsInput(' #API, backend, api, , q4, design, ux, extra '), [
    'API',
    'backend',
    'q4',
    'design',
    'ux',
  ]);
});

test('nextPriority cycles low -> medium -> high -> low', () => {
  assert.equal(nextPriority('low'), 'medium');
  assert.equal(nextPriority('medium'), 'high');
  assert.equal(nextPriority('high'), 'low');
});

test('filterTasks, filterTasksByView, and getSidebarCounts return accurate slices and counts', () => {
  const tasks = createSeedTasks('2026-11-24');
  const counts = getTaskCounts(tasks);
  assert.equal(counts.all, 5);
  assert.equal(counts.active, 4);
  assert.equal(counts.done, 1);

  assert.equal(filterTasks(tasks, 'all').length, 5);
  assert.equal(filterTasks(tasks, 'active').every((t) => !t.completed), true);
  assert.equal(filterTasks(tasks, 'done').every((t) => t.completed), true);

  const sidebarCounts = getSidebarCounts(tasks, '2026-11-24');
  assert.equal(sidebarCounts.today, 1);
  assert.equal(sidebarCounts.overdue, 1);
  assert.equal(sidebarCounts.upcoming, 2);
  assert.equal(sidebarCounts.completed, 1);
  assert.equal(sidebarCounts.byProject.Engineering, 1);

  const overdueOnly = filterTasksByView(tasks, 'overdue', null, 'all', 'all', '', '2026-11-24');
  assert.equal(overdueOnly.length, 1);
  assert.equal(overdueOnly[0].id, 'seed-2');

  const highPriority = filterTasksByView(tasks, 'all', null, 'high', 'active', '', '2026-11-24');
  assert.equal(highPriority.length, 2);
  assert.equal(highPriority.every((t) => t.priority === 'high'), true);

  const engineeringProject = filterTasksByView(
    tasks,
    'all',
    'Engineering',
    'all',
    'all',
    '',
    '2026-11-24'
  );
  assert.equal(engineeringProject.length, 1);
  assert.equal(engineeringProject[0].project, 'Engineering');
});

test('reorderTaskList moves task and reindexes order deterministically', () => {
  const tasks = createSeedTasks('2026-11-24');
  const reordered = reorderTaskList(tasks, 'seed-3', 'seed-1');
  assert.equal(reordered[0].id, 'seed-3');
  assert.equal(reordered[1].id, 'seed-1');
  assert.deepEqual(
    reordered.map((t) => t.order),
    [0, 1, 2, 3, 4]
  );
});

test('getDueDateDisplay classifies overdue, today, tomorrow, upcoming, and completed dates', () => {
  const overdue = getDueDateDisplay('2026-11-22', false, '2026-11-24');
  assert.equal(overdue?.tone, 'overdue');
  assert.equal(overdue?.isOverdue, true);
  assert.ok(overdue?.label.startsWith('Overdue · '));

  const today = getDueDateDisplay('2026-11-24', false, '2026-11-24');
  assert.equal(today?.tone, 'today');
  assert.equal(today?.label, 'Today');

  const tomorrow = getDueDateDisplay('2026-11-25', false, '2026-11-24');
  assert.equal(tomorrow?.tone, 'upcoming');
  assert.equal(tomorrow?.label, 'Tomorrow');

  const completedPast = getDueDateDisplay('2026-11-20', true, '2026-11-24');
  assert.equal(completedPast?.tone, 'completed');
  assert.equal(completedPast?.isOverdue, false);
});

test('getCompletionPercentage computes rounded completion rate and handles empty lists', () => {
  assert.equal(getCompletionPercentage([]), 0);
  const seeded = createSeedTasks('2026-11-24'); // 1 of 5 completed
  assert.equal(getCompletionPercentage(seeded), 20);
});

test('resolveInitialTheme honors saved preference and falls back to system preference', () => {
  assert.equal(resolveInitialTheme('dark', false), 'dark');
  assert.equal(resolveInitialTheme('light', true), 'light');
  assert.equal(resolveInitialTheme(null, true), 'dark');
  assert.equal(resolveInitialTheme(null, false), 'light');
});
