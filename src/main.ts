//src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import morgan from 'morgan';

import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { setupSwagger } from '@/config/swagger.config';
import { winstonLogger } from '@/logger/winston.logger';
import { AppModule } from '@/modules/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useLogger(winstonLogger);

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
  setupSwagger(app);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  const adelaideTime = adelaideTimestamp;
  winstonLogger.info(`App running at ${adelaideTime}`);
}

void bootstrap();
