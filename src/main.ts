//src/main.ts
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';

import { AppModule } from '@/app.module';
import { setupSwagger } from '@/config/swagger.config';
import { winstonLogger } from '@/logger/winston.logger';
async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);
  app.useLogger(winstonLogger);

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
