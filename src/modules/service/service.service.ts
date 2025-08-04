import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, ServiceDocument } from './schema/service.schema';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const createdService = new this.serviceModel(createServiceDto);
    return createdService.save();
  }

  async findAll(userId?: string): Promise<Service[]> {
    if (userId != null && userId !== '') {
      return this.serviceModel.find({ 
        userId: { $eq: userId },
        isDeleted: { $ne: true } // Exclude deleted services
      }).exec();
    }
    return this.serviceModel.find({ 
      isDeleted: { $ne: true } // Exclude deleted services
    }).exec();
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceModel.findOne({ 
      _id: id,
      isDeleted: { $ne: true } // Exclude deleted services
    }).exec();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service ID format');
    }

    const updated = await this.serviceModel
      .findOneAndUpdate(
        { 
          _id: new Types.ObjectId(id),
          isDeleted: { $ne: true } // Exclude deleted services
        },
        { $set: dto },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Service not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    // Soft delete: Only mark isDeleted as true, don't actually delete data
    const result = await this.serviceModel.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    ).exec();
    
    if (!result) {
      throw new NotFoundException('Service not found');
    }
  }
  
  async findAllByUserId(userId: string): Promise<Service[]> {
    return this.serviceModel.find({ 
      userId,
      isDeleted: { $ne: true } // Exclude deleted services
    }).exec();
  }

  async findAllActiveByUserId(userId: string): Promise<Service[]> {
    return this.serviceModel.find({ 
      userId, 
      isAvailable: true,
      isDeleted: { $ne: true } // Exclude deleted services
    }).exec();
  }

  // Get all services (including deleted ones) for booking page display
  async findAllIncludingDeleted(userId?: string): Promise<Service[]> {
    if (userId != null && userId !== '') {
      return this.serviceModel.find({ userId: { $eq: userId } }).exec();
    }
    return this.serviceModel.find().exec();
  }
}
