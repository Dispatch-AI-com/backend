//src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';
import * as express from 'express';

import { setupSwagger } from '@/config/swagger.config';
import { winstonLogger } from '@/logger/winston.logger';
import { AppModule } from '@/modules/app.module';
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useLogger(winstonLogger);
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  app.use(morgan('combined'));
  setupSwagger(app);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
}
void bootstrap();
