import { Module } from '@nestjs/common';
import { HealthController } from '@/modules/health/health.controller';
import { HealthService } from '@/modules/health/health.service';
import { DatabaseModule } from '@/modules/database/database.module';
@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
