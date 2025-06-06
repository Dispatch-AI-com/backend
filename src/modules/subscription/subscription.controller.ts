import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid plan or pricing' })
  @ApiResponse({ status: 404, description: 'Plan or Company not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(dto);
  }


  @Post('change')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Subscription or Plan not found' })
  async changePlan(
    @Body() dto: { companyId: string; planId: string }
  ) {
    return await this.subscriptionService.changePlan(dto.companyId, dto.planId);
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate subscription after checkout' })
  @ApiResponse({ status: 200, description: 'Subscription activated successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        companyId: { type: 'string' },
        planId: { type: 'string' },
        subscriptionId: { type: 'string' }
      },
      required: ['companyId', 'planId', 'subscriptionId']
    }
  })
  async activate(@Body() dto: { companyId: string; planId: string; subscriptionId: string }) {
    return await this.subscriptionService.activateSubscription(
      dto.companyId,
      dto.planId,
      dto.subscriptionId
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all subscriptions (admin use)' })
  @ApiResponse({ status: 200, description: 'Subscriptions list retrieved successfully' })
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return await this.subscriptionService.getAll(page, limit);
  }

  @Get(':companyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscription by company ID' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found for company' })
  async getByCompany(@Param('companyId') companyId: string) {
    return await this.subscriptionService.getByCompany(companyId);
  }
}
