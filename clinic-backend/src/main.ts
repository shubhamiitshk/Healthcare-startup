import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { DataSource } from 'typeorm';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import type { Request } from 'express';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  try {
    const dataSource = new DataSource({
      type: 'postgres',
      url: configService.get<string>('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
    });
    await dataSource.initialize();
    console.log('Database connection successful');
    await dataSource.destroy();
  } catch (err) {
    console.error('Database connection error:', err);
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
          privateKey: configService.get<string>('FIREBASE_PRIVATE_KEY'),
          clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        }),
      });
      console.log('Firebase initialized successfully');
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }

  const rawOrigins = configService.get<string>('CORS_ORIGINS');
  const isProd =
    (configService.get<string>('NODE_ENV') ?? 'development') === 'production';
  const allowedOrigins = rawOrigins
    ? rawOrigins
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : isProd
      ? []
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
        ];

  if (isProd && allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must be set in production');
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });
  app.setGlobalPrefix('api');

  const port = configService.get<string>('PORT') || '3001';
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
