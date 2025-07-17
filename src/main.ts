import 'dotenv/config';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import morgan from 'morgan';

import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { setupSwagger } from '@/config/swagger.config';
import { winstonLogger } from '@/logger/winston.logger';
import { AppModule } from '@/modules/app.module';
async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);
  app.useLogger(winstonLogger);
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(morgan('combined'));
  app.use(bodyParser.urlencoded({ extended: false }));
  setupSwagger(app);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  const adelaideTime = new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Adelaide',
  });
  winstonLogger.log('info', `App running at ${adelaideTime}`);
}

void bootstrap();
