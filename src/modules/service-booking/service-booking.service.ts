import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ServiceBooking,
  ServiceBookingDocument,
} from './schema/service-booking.schema';
import { CreateServiceBookingDto } from './dto/create-service-booking.dto';

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
}