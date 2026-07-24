import express, { ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { ZodError } from 'zod';
import { config } from './config';
import { HttpError } from './lib';
import { authRequired } from './auth';
import { authRouter } from './routes/auth';
import { stateRouter } from './routes/state';
import { mealsRouter } from './routes/meals';
import { logRouter } from './routes/log';
import { settingsRouter } from './routes/settings';
import { timelineRouter } from './routes/timeline';
import './types';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind nginx
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  const v1 = express.Router();

  // public
  v1.use('/auth', authRouter);

  // everything below requires a valid session
  v1.use(authRequired);
  v1.use('/state', stateRouter);
  v1.use('/meals', mealsRouter);
  v1.use('/settings', settingsRouter);
  v1.use('/timeline', timelineRouter);
  v1.use('/', logRouter); // /weight, /water, /walks, /workouts

  app.use('/fg/v1', v1);

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // central error handler
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: err.flatten() });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  };
  app.use(onError);

  return app;
}
