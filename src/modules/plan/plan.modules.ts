import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Plan, PlanSchema } from "./schema/plan.schema";
import { PlanService } from "./plan.service";
import { PlanController } from "./plan.controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: Plan.name, schema: PlanSchema }])],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
