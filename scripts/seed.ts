import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/modules/app.module';
import seedPlans from './seeds/seed-plan';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  await seedPlans(app);

  console.log('✅ All seed data inserted.');
  await app.close();
}

bootstrap();
