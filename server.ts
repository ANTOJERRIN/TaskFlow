import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { TaskFilter } from './src/types/task.ts';
import { createFileTaskStore, StoreValidationError } from './server/taskStore.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = new Set<string>([
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.APP_URL ? [process.env.APP_URL] : []),
]);

function parseStatusParam(raw: unknown): TaskFilter {
  if (raw === 'active' || raw === 'done' || raw === 'all') {
    return raw;
  }
  return 'all';
}

export function createApp(dataDir: string = path.resolve(process.cwd(), 'data')) {
  const app = express();
  const store = createFileTaskStore(dataDir);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/tasks', (req, res, next) => {
    try {
      const status = parseStatusParam(req.query.status);
      const tasks = store.list(status);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/tasks', (req, res, next) => {
    try {
      const created = store.create(req.body ?? {});
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/tasks/reorder', (req, res, next) => {
    try {
      const reordered = store.reorder(req.body?.orderedIds);
      res.json(reordered);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/tasks/:id', (req, res, next) => {
    try {
      const updated = store.update(req.params.id, req.body ?? {});
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/tasks/:id/toggle', (req, res, next) => {
    try {
      const updated = store.toggle(req.params.id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/tasks/:id', (req, res, next) => {
    try {
      store.remove(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (err instanceof StoreValidationError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      if (err instanceof SyntaxError && 'status' in err) {
        res.status(400).json({ error: 'Invalid JSON request body.' });
        return;
      }
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
  );

  return app;
}

async function startServer() {
  const app = createApp();

  if (IS_PRODUCTION) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Production build not found.');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow server listening on http://0.0.0.0:${PORT}`);
  });
}

const isEntryPoint =
  typeof process.argv[1] === 'string' &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isEntryPoint) {
  startServer();
}
