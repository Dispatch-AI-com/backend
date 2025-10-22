import { Module } from '@nestjs/common';

import { AiHttpModule } from '@/lib/ai/ai-http.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { HealthController } from '@/modules/health/health.controller';
import { HealthService } from '@/modules/health/health.service';

@Module({
  imports: [DatabaseModule, AiHttpModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
