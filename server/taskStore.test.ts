import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createFileTaskStore,
  resolveSafeStorePath,
  StoreValidationError,
} from './taskStore.ts';

function withTempDir(fn: (dir: string) => void) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskflow-store-'));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('resolveSafeStorePath rejects directory traversal outside data dir', () => {
  assert.throws(
    () => resolveSafeStorePath('/tmp/taskflow-data', '../etc/passwd'),
    StoreValidationError
  );
});

test('createFileTaskStore preserves invalid data when a write is attempted', () => {
  withTempDir((dir) => {
    const file = path.join(dir, 'tasks.json');
    const store = createFileTaskStore(dir);

    for (const invalidData of ['{', '{}', '[null]']) {
      fs.writeFileSync(file, invalidData, 'utf8');
      assert.throws(() => store.list());
      assert.throws(() => store.create({ title: 'New task' }));
      assert.equal(fs.readFileSync(file, 'utf8'), invalidData);
    }
  });
});

test('createFileTaskStore supports full CRUD, validation, reorder, and empty persistence', () => {
  withTempDir((dir) => {
    const store = createFileTaskStore(dir);

    const seeded = store.list('all');
    assert.equal(seeded.length, 5);

    assert.throws(() => store.create({ title: '   ' }), StoreValidationError);

    const created = store.create({
      title: 'Deploy TaskFlow API',
      description: 'Verify health route and CORS origins.',
      dueDate: '2026-12-05',
      priority: 'high',
      project: 'Engineering',
      tags: ['deploy', 'api'],
    });

    assert.equal(created.title, 'Deploy TaskFlow API');
    assert.equal(created.priority, 'high');
    assert.equal(created.project, 'Engineering');
    assert.deepEqual(created.tags, ['deploy', 'api']);

    const toggled = store.toggle(created.id);
    assert.equal(toggled.completed, true);
    assert.equal(store.list('done').some((t) => t.id === created.id), true);

    const updated = store.update(created.id, {
      title: 'Deploy TaskFlow Production API',
      priority: 'low',
      project: 'Product',
      tags: ['release'],
    });
    assert.equal(updated.title, 'Deploy TaskFlow Production API');
    assert.equal(updated.priority, 'low');
    assert.equal(updated.project, 'Product');

    // Reorder puts last task first
    const beforeReorder = store.list('all');
    const lastId = beforeReorder[beforeReorder.length - 1].id;
    const reordered = store.reorder([lastId, ...beforeReorder.slice(0, -1).map((t) => t.id)]);
    assert.equal(reordered[0].id, lastId);

    // Delete all tasks and confirm fresh store instance keeps []
    for (const task of store.list('all')) {
      store.remove(task.id);
    }
    const freshStore = createFileTaskStore(dir);
    assert.equal(freshStore.list('all').length, 0);

    // Deleting missing id throws 404
    assert.throws(() => freshStore.remove('non-existent'), (err: unknown) => {
      return err instanceof StoreValidationError && err.statusCode === 404;
    });
  });
});
