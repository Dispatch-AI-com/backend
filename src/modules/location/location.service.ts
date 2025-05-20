import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location, LocationDocument } from './schema/location.schema';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    const createdLocation = new this.locationModel(createLocationDto);
    return createdLocation.save();
  }

  async findAll(): Promise<Location[]> {
    return this.locationModel.find().exec();
  }

  async findOne(id: string): Promise<Location> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException('Location not found');
    }
    return location;
  }

  async update(id: string, dto: UpdateLocationDto): Promise<Location> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid location ID format');
    }

    const payload: Partial<Location> = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.address1 !== undefined) payload.address1 = dto.address1;
    if (dto.address2 !== undefined) payload.address2 = dto.address2;
    if (dto.city !== undefined) payload.city = dto.city;
    if (dto.state !== undefined) payload.state = dto.state;
    if (dto.country !== undefined) payload.country = dto.country;
    if (dto.embedding !== undefined) payload.embedding = dto.embedding;

    const updated = await this.locationModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: payload },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Location not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.locationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Location not found');
    }
  }
}
