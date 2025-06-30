import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/modules/app.module';
import { seedCallLogs } from './calllog.seed';
import { seedTranscripts } from './transcript.seed';
import { seedUsers } from './user.seed';
import { seedTranscriptChunks } from './transcript-chunk.seed';
import { Model } from 'mongoose';
import { UserDocument } from '../../src/modules/user/schema/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🌱 Starting seeding...');
    
    // Check if John Admin exists
    const userModel = app.get<Model<UserDocument>>('UserModel');
    const johnAdmin = await userModel.findOne({ email: 'john.admin@example.com' }).exec();
    
    if (!johnAdmin) {
      console.log('👤 John Admin not found, creating users...');
      await seedUsers(app);
    } else {
      console.log('👤 John Admin already exists, skipping user creation');
    }
    
    // Run other seeds in order
    await seedCallLogs(app);
    await seedTranscripts(app);
    await seedTranscriptChunks(app);
    
    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap(); 