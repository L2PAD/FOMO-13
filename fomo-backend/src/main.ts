import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ensureUploadsDir, UPLOADS_DIR } from './config/uploads';
import { SafeValidationPipe } from './common/validation/safe-validation.pipe';
import { createSessionMiddleware } from './config/session.config';

async function bootstrap() {
  ensureUploadsDir();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  /* =======================
     BASIC CONFIG
  ======================= */
  app.setGlobalPrefix('api');
  app.disable('x-powered-by');

  app.set('trust proxy', 1);

  /* =======================
     SECURITY HEADERS
  ======================= */

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );

  /* =======================
     CORS (ВАЖНО!)
  ======================= */

  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const isAllowedOrigin = (origin: string): boolean => {
    if (allowedOrigins.includes(origin)) return true;
    // Allow Emergent preview/deploy domains and localhost for the hosted preview.
    if (/\.preview\.emergentagent\.com$/i.test(origin)) return true;
    if (/\.emergentagent\.com$/i.test(origin)) return true;
    if (/\.emergentcf\.cloud$/i.test(origin)) return true;
    if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return true;
    return false;
  };

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || origin === 'null') return cb(null, true); // mobile / curl / opaque
      if (isAllowedOrigin(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  /* =======================
     BODY PARSERS
  ======================= */

  app.use(express.json({ limit: '10mb', strict: true }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  /* =======================
     COOKIES & SESSION
  ======================= */

  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not defined');
  }

  app.use(cookieParser(process.env.SESSION_SECRET));

  const sessionConfig = createSessionMiddleware();
  app.use(sessionConfig.middleware);

  /* =======================
     STATIC FILES
  ======================= */

  app.use('/uploads', express.static(UPLOADS_DIR));
  // Also expose uploads under the global /api prefix so files are reachable
  // through the ingress/proxy (which only routes /api/* to this backend).
  app.use('/api/uploads', express.static(UPLOADS_DIR));

  /* =======================
     VALIDATION
  ======================= */

  app.useGlobalPipes(
    new SafeValidationPipe(),
  );

  /* =======================
     GRACEFUL SHUTDOWN
  ======================= */

  app.enableShutdownHooks();
  process.once('SIGTERM', () => {
    void sessionConfig.close();
  });
  process.once('SIGINT', () => {
    void sessionConfig.close();
  });

  app.getHttpAdapter().get('/__health', (_req, res) => {
    res.json({
      ok: true,
      service: 'fomo-backend',
      uptime: process.uptime(),
    });
  });

  const port = Number(process.env.PORT) || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`Uploads dir: ${UPLOADS_DIR}`);
  console.log(`Session store: ${sessionConfig.usingRedisStore ? 'redis' : 'memory-dev'}`);

  console.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
