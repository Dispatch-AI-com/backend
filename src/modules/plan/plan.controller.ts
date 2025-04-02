import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/plan.dto';
import { Plan } from './schema/plan.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('plan')
@Controller('plan')
export class PlanController{
  constructor(private readonly planService: PlanService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Body() createPlan: CreatePlanDto): Promise<Plan> {
    return await this.planService.createPlan(createPlan);
  }

  @ApiOperation({ summary: 'Plans retrieval', description: 'Get all plans' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully retrieved all plans',
    type: [Plan]  
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @Get()
  async getAllPlans() {
    return await this.planService.getAll();
  }
  
}

