import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ServiceFormField,
  ServiceFormFieldDocument,
} from './schema/service-form-field.schema';

// Define proper types for better type safety
interface CreateFormFieldDto {
  serviceId: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  options: string[];
}

interface UpdateFormFieldDto {
  fieldName?: string;
  fieldType?: string;
  isRequired?: boolean;
  options?: string[];
}

interface FormFieldInput {
  fieldName?: string;
  fieldType?: string;
  isRequired?: boolean;
  options?: string[];
}

@Injectable()
export class ServiceFormFieldService {
  constructor(
    @InjectModel(ServiceFormField.name)
    private readonly formFieldModel: Model<ServiceFormFieldDocument>,
  ) {}

  // Create a single form field
  async create(
    createServiceFormFieldDto: CreateFormFieldDto,
  ): Promise<ServiceFormField> {
    const createdField = new this.formFieldModel(createServiceFormFieldDto);
    return createdField.save();
  }

  // Query all form fields
  async findAll(): Promise<ServiceFormField[]> {
    return this.formFieldModel.find().exec();
  }

  // Query form fields by serviceId
  async findByServiceId(serviceId: string): Promise<ServiceFormField[]> {
    return this.formFieldModel.find({ serviceId: { $eq: serviceId } }).exec();
  }

  // Query a single form field by ID
  async findOne(id: string): Promise<ServiceFormField | null> {
    // Validate that id is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.formFieldModel.findById(id).exec();
  }

  // Update form field
  async update(
    id: string,
    updateServiceFormFieldDto: UpdateFormFieldDto,
  ): Promise<ServiceFormField | null> {
    // Validate that id is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    // Only allow whitelisted fields to be updated
    const allowedFields = ['fieldName', 'fieldType', 'isRequired', 'options'];
    const sanitizedUpdate: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(updateServiceFormFieldDto, key)
      ) {
        const value =
          updateServiceFormFieldDto[key as keyof UpdateFormFieldDto];
        if (key === 'fieldName' || key === 'fieldType') {
          if (typeof value === 'string') {
            sanitizedUpdate[key] = value;
          }
        } else if (key === 'isRequired') {
          if (typeof value === 'boolean') {
            sanitizedUpdate[key] = value;
          }
        } else if (key === 'options') {
          if (Array.isArray(value)) {
            sanitizedUpdate[key] = value;
          }
        }
      }
    }

    return this.formFieldModel
      .findByIdAndUpdate(id, sanitizedUpdate, { new: true })
      .exec();
  }

  // Delete a single form field
  async remove(id: string): Promise<void> {
    // Validate that id is a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return;
    }
    await this.formFieldModel.findByIdAndDelete(id).exec();
  }

  // Delete all form fields by serviceId
  async removeByServiceId(serviceId: string): Promise<void> {
    await this.formFieldModel
      .deleteMany({ serviceId: { $eq: serviceId } })
      .exec();
  }

  // Batch save form fields (delete old ones first, then insert new ones)
  async saveBatch(
    serviceId: string,
    fields: FormFieldInput[],
  ): Promise<ServiceFormField[]> {
    // First delete all existing fields for this service
    await this.removeByServiceId(serviceId);

    // If there are new fields, insert them
    if (fields.length > 0) {
      const fieldsWithServiceId = fields.map(field => ({
        serviceId,
        fieldName: field.fieldName ?? '',
        fieldType: field.fieldType ?? '',
        isRequired: field.isRequired ?? false,
        options: field.options ?? [],
      }));

      const createdFields =
        await this.formFieldModel.insertMany(fieldsWithServiceId);
      return createdFields.map(field => field.toObject());
    }

    return [];
  }
}
