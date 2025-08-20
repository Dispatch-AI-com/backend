import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ServiceFormField,
  ServiceFormFieldDocument,
} from './schema/service-form-field.schema';

@Injectable()
export class ServiceFormFieldService {
  constructor(
    @InjectModel(ServiceFormField.name)
    private readonly formFieldModel: Model<ServiceFormFieldDocument>,
  ) {}

  // Create a single form field
  async create(createServiceFormFieldDto: any): Promise<ServiceFormField> {
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
    return this.formFieldModel.findById(id).exec();
  }

  // Update form field
  async update(id: string, updateServiceFormFieldDto: any): Promise<ServiceFormField | null> {
    // Only allow whitelisted fields to be updated
    const allowedFields = ['fieldName', 'fieldType', 'isRequired', 'options'];
    const sanitizedUpdate: any = {};
    
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updateServiceFormFieldDto, key)) {
        sanitizedUpdate[key] = updateServiceFormFieldDto[key];
      }
    }
    
    return this.formFieldModel
      .findByIdAndUpdate(id, sanitizedUpdate, { new: true })
      .exec();
  }

  // Delete a single form field
  async remove(id: string): Promise<void> {
    await this.formFieldModel.findByIdAndDelete(id).exec();
  }

  // Delete all form fields by serviceId
  async removeByServiceId(serviceId: string): Promise<void> {
    await this.formFieldModel.deleteMany({ serviceId: { $eq: serviceId } }).exec();
  }

  // Batch save form fields (delete old ones first, then insert new ones)
  async saveBatch(serviceId: string, fields: any[]): Promise<ServiceFormField[]> {
    // First delete all existing fields for this service
    await this.removeByServiceId(serviceId);
    
    // If there are new fields, insert them
    if (fields && fields.length > 0) {
      const fieldsWithServiceId = fields.map(field => ({
        serviceId,
        fieldName: field.fieldName || '',
        fieldType: field.fieldType || '',
        isRequired: field.isRequired || false,
        options: field.options || [],
      }));
      
      const createdFields = await this.formFieldModel.insertMany(fieldsWithServiceId);
      return createdFields.map(field => field.toObject());
    }
    
    return [];
  }
}
