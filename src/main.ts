//src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';

import { setupSwagger } from '@/config/swagger.config';
import { winstonLogger } from '@/logger/winston.logger';
import { AppModule } from '@/modules/app.module';
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useLogger(winstonLogger);
  Logger.error('🚨 This is a test error log from Dispatch AI');
  Logger.warn('🚨 This is a test warn log from Dispatch AI');
  Logger.log('🚨 This is a test log from Dispatch AI');
  Logger.debug('🚨 This is a test debug log from Dispatch AI');
  Logger.verbose('🚨 This is a test verbose log from Dispatch AI');

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  Logger.log('Hello from Dispatch AI logger!');
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  app.use(morgan('combined'));
  setupSwagger(app);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
}
void bootstrap();
