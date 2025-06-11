import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid plan or pricing',
  })
  @ApiResponse({ status: 404, description: 'Plan or Company not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(dto);
  }

  @Post(':companyId/retry-payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate Billing Portal URL for retry payment after failure',
  })
  @ApiResponse({
    status: 200,
    description: 'Billing portal URL generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No failed subscription found for this company',
  })
  async generateBillingPortalUrl(@Param('companyId') companyId: string) {
    const url =
      await this.subscriptionService.generateBillingPortalUrl(companyId);
    return { url };
  }

  @Patch('change')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Subscription or Plan not found' })
  async changePlan(@Body() dto: { companyId: string; planId: string }) {
    return await this.subscriptionService.changePlan(dto.companyId, dto.planId);
  }

  @Patch(':companyId/free')
  @ApiOperation({ summary: 'Downgrade to free plan and refund unused balance' })
  @ApiResponse({ status: 200, description: 'Downgrade and refund successful' })
  @ApiResponse({ status: 404, description: 'Active subscription not found' })
  @ApiResponse({ status: 500, description: 'Internal error during downgrade' })
  async downgradeToFree(@Param('companyId') companyId: string) {
    await this.subscriptionService.downgradeToFree(companyId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all subscriptions (admin use)' })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions list retrieved successfully',
  })
  async getAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return await this.subscriptionService.getAll(page, limit);
  }

  @Get(':companyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscription by company ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription not found for company',
  })
  async getByCompany(@Param('companyId') companyId: string) {
    return await this.subscriptionService.getByCompany(companyId);
  }
}
