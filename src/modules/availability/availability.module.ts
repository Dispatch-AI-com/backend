import { Module } from "@nestjs/common";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityService } from "./availability.service";
import { Availability, AvailabilitySchema } from "./schema/availability.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Availability.name,
        schema: AvailabilitySchema,
      },
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailModule {}
