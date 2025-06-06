import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateServiceLocationMappingDto } from './dto/create-service-location-mapping.dto';
import { UpdateServiceLocationMappingDto } from './dto/update-service-location-mapping.dto';
import {
  ServiceLocationMapping,
  ServiceLocationMappingDocument,
} from './schema/service-location-mapping.schema';

@Injectable()
export class ServiceLocationMappingService {
  constructor(
    @InjectModel(ServiceLocationMapping.name)
    private readonly serviceLocationMappingModel: Model<ServiceLocationMappingDocument>,
  ) {}

  async create(
    createDto: CreateServiceLocationMappingDto,
  ): Promise<ServiceLocationMapping> {
    const { serviceId, locationId } = createDto;

    if (
      !Types.ObjectId.isValid(serviceId) ||
      !Types.ObjectId.isValid(locationId)
    ) {
      throw new BadRequestException('Invalid service or location ID format');
    }

    const existing = await this.serviceLocationMappingModel.findOne({
      serviceId: new Types.ObjectId(serviceId),
      locationId: new Types.ObjectId(locationId),
    });

    if (existing) {
      throw new BadRequestException(
        'This service-location mapping already exists',
      );
    }

    const created = new this.serviceLocationMappingModel({
      serviceId: new Types.ObjectId(serviceId),
      locationId: new Types.ObjectId(locationId),
    });

    return created.save();
  }

  async findAll(): Promise<ServiceLocationMapping[]> {
    return this.serviceLocationMappingModel
      .find()
      .populate('serviceId')
      .populate('locationId')
      .exec();
  }

  async findOne(id: string): Promise<ServiceLocationMapping> {
    const mapping = await this.serviceLocationMappingModel
      .findById(id)
      .populate('serviceId')
      .populate('locationId')
      .exec();

    if (!mapping) {
      throw new NotFoundException('Service-location mapping not found');
    }
    return mapping;
  }

  async update(
    id: string,
    dto: UpdateServiceLocationMappingDto,
  ): Promise<ServiceLocationMapping> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid mapping ID format');
    }

    const updated = await this.serviceLocationMappingModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: dto },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .populate('serviceId')
      .populate('locationId')
      .exec();

    if (!updated) {
      throw new NotFoundException('Service-location mapping not found');
    }
    return updated;
  }
  async remove(id: string): Promise<void> {
    const result = await this.serviceLocationMappingModel
      .findByIdAndDelete(id)
      .exec();
    if (!result) {
      throw new NotFoundException('Service-location mapping not found');
    }
  }

  async findByLocationId(
    locationId: string,
  ): Promise<ServiceLocationMapping[]> {
    if (!Types.ObjectId.isValid(locationId)) {
      throw new BadRequestException('Invalid location ID format');
    }

    return this.serviceLocationMappingModel
      .find({
        locationId: new Types.ObjectId(locationId),
      })
      .populate('serviceId')
      .exec();
  }

  async findByServiceId(serviceId: string): Promise<ServiceLocationMapping[]> {
    if (!Types.ObjectId.isValid(serviceId)) {
      throw new BadRequestException('Invalid service ID format');
    }

    return this.serviceLocationMappingModel
      .find({
        serviceId: new Types.ObjectId(serviceId),
      })
      .populate('locationId')
      .exec();
  }
}
