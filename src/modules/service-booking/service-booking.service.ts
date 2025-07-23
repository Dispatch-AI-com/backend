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

  async findAll(userId?: string): Promise<ServiceBooking[]> {
    const filter =
      userId !== undefined && userId !== null && userId.trim() !== ''
        ? { userId: { $eq: userId } }
        : {};
    return this.bookingModel.find(filter).exec();
  }

  async findById(id: string): Promise<ServiceBooking | null> {
    return this.bookingModel.findById(id).exec();
  }

  async deleteById(id: string): Promise<ServiceBooking | null> {
    return this.bookingModel.findByIdAndDelete(id).exec();
  }

  async updateById(
    id: string,
    dto: Partial<CreateServiceBookingDto>,
  ): Promise<ServiceBooking | null> {
    if ('_id' in dto) delete (dto as Record<string, unknown>)._id;
    const sanitizedDto = this.sanitizeDto(dto);
    return this.bookingModel
      .findByIdAndUpdate(id, { $set: sanitizedDto }, { new: true })
      .exec();
  }

  private sanitizeDto(
    dto: Partial<CreateServiceBookingDto>,
  ): Partial<CreateServiceBookingDto> {
    const allowedFields = [
      'client',
      'serviceFormValues',
      'status',
      'note',
      'serviceId',
      'bookingTime',
      'userId',
    ];
    const sanitizedDto: Partial<CreateServiceBookingDto> = {};
    for (const key of allowedFields) {
      if (key in dto) {
        (sanitizedDto as Record<string, unknown>)[key] = (
          dto as Record<string, unknown>
        )[key];
      }
    }
    return sanitizedDto;
  }
}
