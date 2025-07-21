import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateServiceBookingDto } from '@/modules/service-booking/dto/create-service-booking.dto';
import {
  ServiceBooking,
  ServiceBookingDocument,
} from '@/modules/service-booking/schema/service-booking.schema';

@Injectable()
export class ServiceBookingService {
  constructor(
    @InjectModel(ServiceBooking.name)
    private readonly bookingModel: Model<ServiceBookingDocument>,
  ) {}

  async create(dto: CreateServiceBookingDto): Promise<ServiceBooking> {
    const newBooking = new this.bookingModel(dto);
    return newBooking.save();
  }

  async findAll(): Promise<ServiceBooking[]> {
    return this.bookingModel.find().exec();
  }

  async findById(id: string): Promise<ServiceBooking | null> {
    return this.bookingModel.findById(id).exec();
  }

  async findByFilter({
    companyId,
  }: {
    companyId: string;
  }): Promise<ServiceBooking[]> {
    const filter: Partial<ServiceBooking> = {};
    if (companyId) {
      filter.companyId = companyId as any;
    }
    return this.bookingModel
      .find(filter)
      .populate('serviceId', 'name description price notifications isAvailable')
      .exec();
  }
}
