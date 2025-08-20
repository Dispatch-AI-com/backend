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

  // 创建单个表单字段
  async create(createServiceFormFieldDto: any): Promise<ServiceFormField> {
    const createdField = new this.formFieldModel(createServiceFormFieldDto);
    return createdField.save();
  }

  // 查询所有表单字段
  async findAll(): Promise<ServiceFormField[]> {
    return this.formFieldModel.find().exec();
  }

  // 根据 serviceId 查询表单字段
  async findByServiceId(serviceId: string): Promise<ServiceFormField[]> {
    return this.formFieldModel.find({ serviceId }).exec();
  }

  // 根据 ID 查询单个表单字段
  async findOne(id: string): Promise<ServiceFormField | null> {
    return this.formFieldModel.findById(id).exec();
  }

  // 更新表单字段
  async update(id: string, updateServiceFormFieldDto: any): Promise<ServiceFormField | null> {
    return this.formFieldModel
      .findByIdAndUpdate(id, updateServiceFormFieldDto, { new: true })
      .exec();
  }

  // 删除单个表单字段
  async remove(id: string): Promise<void> {
    await this.formFieldModel.findByIdAndDelete(id).exec();
  }

  // 根据 serviceId 删除所有相关表单字段
  async removeByServiceId(serviceId: string): Promise<void> {
    await this.formFieldModel.deleteMany({ serviceId }).exec();
  }

  // 批量保存表单字段（先删除旧的，再插入新的）
  async saveBatch(serviceId: string, fields: any[]): Promise<ServiceFormField[]> {
    // 先删除该服务的所有现有字段
    await this.removeByServiceId(serviceId);
    
    // 如果有新字段，则插入
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
