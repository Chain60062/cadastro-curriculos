import express from 'express';
import { candidatesRouter } from './routes/candidates.routes.js';
import { resumesRouter } from './routes/resumes.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/candidates', candidatesRouter);
app.use('/api/resumes', resumesRouter);

app.use(notFoundHandler);
app.use(errorHandler);
