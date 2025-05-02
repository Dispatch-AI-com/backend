import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@/modules/database/database.module";
import { HealthModule } from "@/modules/health/health.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { PlanModule } from "./plan/plan.modules";
import { AvailModule } from "./availability/availability.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    PlanModule,
    AvailModule,
  ],
})
export class AppModule {}
