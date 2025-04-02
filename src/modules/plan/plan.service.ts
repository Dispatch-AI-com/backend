import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from './schema/plan.schema';
import { IPlan } from '@/common/interfaces/plan';

@Injectable()
export class PlanService{
  constructor(
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
  ){}

  async createPlan(createPlan: IPlan): Promise<Plan> {
    try {
      const newPlan = new this.planModel({ ...createPlan });
      return await newPlan.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException({ error: 'Plan name already exists' });
      }
      throw new InternalServerErrorException({ error: 'Database failure' });
    }
  }

  async getAll(): Promise<Plan[]> {
    try {
      return await this.planModel.find();  
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve plans');
    }
  }
}