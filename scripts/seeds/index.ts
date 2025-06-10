import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/modules/app.module';
import { seedCallLogs } from './calllog.seed';
import { seedTranscripts } from './transcript.seed';
import { seedUsers } from './user.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🌱 Starting seeding...');
    
    // Run seeds in order
    await seedUsers(app);
    await seedCallLogs(app);
    await seedTranscripts(app);
    
    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap(); 