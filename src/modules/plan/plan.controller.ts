import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './schema/plan.schema';

@ApiTags('plan')
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  
  /**
   * Create a new plan
   * POST /plan
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiBody({ type: CreatePlanDto })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid format or missing fields' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreatePlanDto): Promise<Plan> {
    return this.planService.createPlan(dto);
  }

  /**
   * Get all plans
   * GET /plan
   */
  @Get()
  @ApiOperation({ summary: 'Get all active plans' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved all active plans', type: [CreatePlanDto] })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(): Promise<Plan[]> {
    return this.planService.getAllActivePlans();
  }

  /**
   * Get plan by ID
   * GET /plan/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by ID' })
  @ApiResponse({ status: 200, description: 'Plan found', type: CreatePlanDto })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findById(@Param('id') id: string): Promise<Plan> {
    return this.planService.getPlanById(id);
  }

  /**
   * Fully update a plan (PUT)
   * PUT /plan/:id
   */
  @Put(':id')
  @ApiOperation({ summary: 'Fully update a plan' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully', type: UpdatePlanDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid structure' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<Plan> {
    return this.planService.updatePlan(id, dto);
  }

  /**
   * Partially update a plan (PATCH)
   * PATCH /plan/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a plan' })
  @ApiBody({
    type: UpdatePlanDto,
    examples: {
      toggleActive: {
        summary: 'Disable a plan',
        value: {
          isActive: false
        }
      },
      updateSupport: {
        summary: 'Change support level',
        value: {
          features: {
            support: 'Enterprise support'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Plan partially updated', type: UpdatePlanDto })
  @ApiResponse({ status: 400, description: 'Invalid patch data' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async patch(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<Plan> {
    return this.planService.patchPlan(id, dto);
  }
}
