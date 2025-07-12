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

  async findAll(): Promise<Service[]> {
    return this.serviceModel.find().exec();
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  /**
   * Fetch all non-deleted services that belong to a specific company.
   * @param companyId Company identifier
   */
  async findByCompanyId(companyId: string): Promise<Service[]> {
    if (!Types.ObjectId.isValid(companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    return this.serviceModel
      .find({ companyId, isDeleted: { $ne: true } })
      .exec();
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid service ID format');
    }

    const updated = await this.serviceModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
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
    const result = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Service not found');
    }
  }
}
