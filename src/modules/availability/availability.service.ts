// src/modules/availability/availability.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateAvailabilityDto } from './dto/create-availability.dto';
import {
  Availability,
  AvailabilityDocument,
} from './schema/availability.schema';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
  ) {}

  async create(dto: CreateAvailabilityDto): Promise<Availability> {
    const created = new this.availabilityModel(dto);
    return created.save();
  }

  async findByServiceId(serviceId: string): Promise<Availability[]> {
    return this.availabilityModel.find({ serviceId }).exec();
  }

  async updateTemporaryUnavailability(
    id: string,
    isAvailable: boolean,
  ): Promise<Availability | null> {
    return this.availabilityModel.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true },
    );
  }

  async getWeeklySchedule(serviceId: string): Promise<Availability[]> {
    // Example: only return availabilities with current week's startDate
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday -> Monday
    startOfWeek.setHours(0, 0, 0, 0);

    return this.availabilityModel.find({
      serviceId,
      startDate: { $gte: startOfWeek },
    });
  }
}
