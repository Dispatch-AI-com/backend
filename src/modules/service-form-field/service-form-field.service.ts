import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ServiceFormField,
  ServiceFormFieldDocument,
} from './schema/service-form-field.schema';

// Define interfaces for better type safety
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
    // Validate and sanitize input data
    if (typeof createServiceFormFieldDto !== 'object') {
      throw new Error('Invalid input data provided');
    }

    if (Array.isArray(createServiceFormFieldDto)) {
      throw new Error('Invalid input data provided');
    }

    const { serviceId, fieldName, fieldType, isRequired, options } =
      createServiceFormFieldDto;

    // Validate required fields
    if (
      !serviceId ||
      typeof serviceId !== 'string' ||
      serviceId.trim().length === 0
    ) {
      throw new Error('Invalid serviceId provided');
    }

    if (
      !fieldName ||
      typeof fieldName !== 'string' ||
      fieldName.trim().length === 0
    ) {
      throw new Error('Invalid fieldName provided');
    }

    if (
      !fieldType ||
      typeof fieldType !== 'string' ||
      fieldType.trim().length === 0
    ) {
      throw new Error('Invalid fieldType provided');
    }

    if (typeof isRequired !== 'boolean') {
      throw new Error('Invalid isRequired provided');
    }

    if (!Array.isArray(options)) {
      throw new Error('Invalid options provided');
    }

    // Create sanitized data object
    const sanitizedData = {
      serviceId: serviceId.trim(),
      fieldName: fieldName.trim(),
      fieldType: fieldType.trim(),
      isRequired,
      options: options.filter(
        item => typeof item === 'string' && item.trim().length > 0,
      ),
    };

    const createdField = new this.formFieldModel(sanitizedData);
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

    // Only allow whitelisted fields to be updated with strict validation
    const allowedFields = [
      'fieldName',
      'fieldType',
      'isRequired',
      'options',
    ] as const;
    const sanitizedUpdate: Record<string, unknown> = {};

    for (const key of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(updateServiceFormFieldDto, key)
      ) {
        const value =
          updateServiceFormFieldDto[key as keyof UpdateFormFieldDto];

        // Strict type validation for each field
        if (key === 'fieldName' || key === 'fieldType') {
          if (typeof value === 'string' && value.trim().length > 0) {
            sanitizedUpdate[key] = value.trim();
          }
        } else if (key === 'isRequired') {
          if (typeof value === 'boolean') {
            sanitizedUpdate[key] = value;
          }
        } else {
          // key must be 'options' at this point
          if (
            Array.isArray(value) &&
            value.every(item => typeof item === 'string')
          ) {
            sanitizedUpdate[key] = value.filter(item => item.trim().length > 0);
          }
        }
      }
    }

    // Additional security check: ensure sanitizedUpdate only contains validated data
    if (Object.keys(sanitizedUpdate).length === 0) {
      return null; // No valid fields to update
    }

    // Validate that all values in sanitizedUpdate are of expected types
    const keysToRemove: string[] = [];

    for (const [key, value] of Object.entries(sanitizedUpdate)) {
      if (!allowedFields.includes(key as (typeof allowedFields)[number])) {
        keysToRemove.push(key);
        continue;
      }

      if (key === 'fieldName' || key === 'fieldType') {
        if (typeof value !== 'string' || value.trim().length === 0) {
          keysToRemove.push(key);
        }
      } else if (key === 'isRequired') {
        if (typeof value !== 'boolean') {
          keysToRemove.push(key);
        }
      } else {
        if (
          !Array.isArray(value) ||
          !value.every(item => typeof item === 'string')
        ) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove invalid keys
    for (const key of keysToRemove) {
      sanitizedUpdate[key] = undefined;
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
  // Batch save form fields (delete old ones first, then insert new ones)
  async saveBatch(
    serviceId: string,
    fields: FormFieldInput[],
  ): Promise<ServiceFormField[]> {
    // Validate serviceId
    if (
      !serviceId ||
      typeof serviceId !== 'string' ||
      serviceId.trim().length === 0
    ) {
      throw new Error('Invalid serviceId provided');
    }

    // Validate fields array
    if (!Array.isArray(fields)) {
      throw new Error('Fields must be an array');
    }

    // First delete all existing fields for this service
    await this.removeByServiceId(serviceId);

    // If there are new fields, insert them with strict validation
    if (fields.length > 0) {
      const validatedFields = fields
        .filter(
          field =>
            typeof field === 'object' &&
            !Array.isArray(field) &&
            typeof field.fieldName === 'string' &&
            field.fieldName.trim().length > 0 &&
            typeof field.fieldType === 'string' &&
            field.fieldType.trim().length > 0 &&
            typeof field.isRequired === 'boolean' &&
            Array.isArray(field.options),
        )
        .map(field => {
          // Use type guards to ensure properties exist, instead of using non-null assertions
          const { fieldName, fieldType, isRequired, options } = field;

          // These checks are already validated in the filter, but TypeScript still needs explicit checking
          if (
            typeof fieldName !== 'string' ||
            typeof fieldType !== 'string' ||
            typeof isRequired !== 'boolean' ||
            !Array.isArray(options)
          ) {
            throw new Error('Invalid field data after validation');
          }

          return {
            serviceId: serviceId.trim(),
            fieldName: fieldName.trim(),
            fieldType: fieldType.trim(),
            isRequired: isRequired,
            options: options.filter(
              item => typeof item === 'string' && item.trim().length > 0,
            ),
          };
        });

      if (validatedFields.length === 0) {
        return [];
      }

      const createdFields =
        await this.formFieldModel.insertMany(validatedFields);
      return createdFields.map(field => field.toObject());
    }

    return [];
  }
}
