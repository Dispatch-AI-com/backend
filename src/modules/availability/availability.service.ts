import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import {
  Availability,
  AvailabilityDocument,
} from "./schema/availability.schema";
import { createAvailDto } from "./dto/create-availability.dto";

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Availability.name)
    private readonly availModel: Model<AvailabilityDocument>,
  ) {}

  async createWorkingHours(
    timeDto: createAvailDto,
  ): Promise<AvailabilityDocument> {
    if (timeDto.startTime > timeDto.endTime)
      throw new BadRequestException("startTime must be earlier than endTime");
    const workingHours = new this.availModel(timeDto);
    return workingHours.save();
  }
}
