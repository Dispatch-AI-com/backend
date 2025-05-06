//src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { setupSwagger } from '@/config/swagger.config';
import { AppModule } from '@/modules/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  setupSwagger(app);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
}
void bootstrap();
