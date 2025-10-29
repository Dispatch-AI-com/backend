import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Read MONGODB_URI at runtime, not at module load time
        // This allows tests to set the URI before the connection is established
        const uri =
          process.env.MONGODB_URI ||
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/dispatchai';

        // In test environment, disable retries to avoid connection error logs
        const isTest = process.env.NODE_ENV === 'test';

        return {
          uri,
          retryAttempts: isTest ? 0 : 3,
          retryDelay: isTest ? 0 : 1000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
