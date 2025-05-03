import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from './schema/plan.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
@Injectable()
export class PlanService {
  constructor(
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
  ) {}

  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    const plan = await this.planModel.findOne({ name: dto.name }).exec();
    if (plan) {
      throw new ConflictException('Plan name already exists');
    }
    return this.planModel.create(dto);
  }

  async getAllActivePlans(): Promise<Plan[]> {
    return this.planModel.find({ isActive: true }).exec();
  }

  async getPlanById(id: string): Promise<Plan> {
    const plan = await this.planModel.findById(id).exec();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  //Full update a plan (used with PUT)
  async updatePlan(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const updated = await this.planModel
      .findByIdAndUpdate(id, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Plan not found');
    }

    return updated;
  }

  async patchPlan(
    id: string,
    partialDto: Partial<UpdatePlanDto>,
  ): Promise<Plan> {
    const updated = await this.planModel
      .findByIdAndUpdate(id, partialDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Plan not found');
    }

    return updated;
  }
}
