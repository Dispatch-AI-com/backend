import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/modules/app.module';
import { SwaggerModule } from '@nestjs/swagger';
const { logger } = require('./utils/logger');
import { getSwaggerConfig } from './utils/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
  });

  const config = getSwaggerConfig();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.info(`Server started on port ${port}`);
  logger.info(`Swagger documentation available at http://localhost:${port}/api-docs`);
}
bootstrap();
