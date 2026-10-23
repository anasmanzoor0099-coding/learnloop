import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import instructorRoutes from './routes/instructor.js';
import statsRoutes from './routes/stats.js';
import { optionalAuth } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '..', '..', 'frontend');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'learnloop-api',
    time: new Date().toISOString()
  });
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api', optionalAuth);

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/stats', statsRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// Locally, Express serves the frontend so everything runs on one origin.
// On Vercel, the frontend is deployed as its own static project.
app.use(
  express.static(frontendDir, {
    extensions: ['html'],
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
  })
);

app.use((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(404).json({ error: 'Not found.' });
  }

  const notFoundPage = path.join(frontendDir, '404.html');
  if (fs.existsSync(notFoundPage)) {
    return res.status(404).sendFile(notFoundPage);
  }

  res.status(404).json({ error: 'Not found.' });
});

app.use((error, req, res, _next) => {
  let status = error.status || 500;
  let message = error.message || 'Something went wrong.';
  let details = error.details;

  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Please check the information you submitted.';
    details = Object.fromEntries(
      Object.entries(error.errors || {}).map(([field, issue]) => [
        field,
        [issue.message]
      ])
    );
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'That ID is not valid.';
  } else if (error.code === 11000) {
    status = 409;
    message = 'That record already exists.';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  } else if (
    error.name === 'MongoServerSelectionError' ||
    error.name === 'MongooseServerSelectionError' ||
    error.name === 'MongoNetworkError'
  ) {
    status = 503;
    message = 'The database is temporarily unavailable. Please try again.';
  }

  const canShowMessage = status < 500 || error.name === 'ApiError';

  if (status >= 500) {
    console.error(`[learnloop] ${req.method} ${req.originalUrl}`, error);
  }

  res.status(status).json({
    error: canShowMessage ? message : 'Something went wrong.',
    ...(details ? { details } : {})
  });
});

export default app;
