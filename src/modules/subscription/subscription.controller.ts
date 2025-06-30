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
import { SubscriptionDocument } from './schema/subscription.schema';
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
  async create(
    @Body() dto: CreateSubscriptionDto,
  ): Promise<{ message: string; checkoutUrl: string }> {
    return this.subscriptionService.createSubscription(dto);
  }

  @Post(':userId/retry-payment')
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
    description: 'No failed subscription found for this user',
  })
  async generateBillingPortalUrl(
    @Param('userId') userId: string,
  ): Promise<{ url: string }> {
    const url = await this.subscriptionService.generateBillingPortalUrl(userId);
    return { url };
  }

  @Patch('change')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Subscription or Plan not found' })
  async changePlan(
    @Body() dto: { userId: string; planId: string },
  ): Promise<{ message: string }> {
    return this.subscriptionService.changePlan(dto.userId, dto.planId);
  }

  @Patch(':userId/free')
  @ApiOperation({ summary: 'Downgrade to free plan and refund unused balance' })
  @ApiResponse({ status: 200, description: 'Downgrade and refund successful' })
  @ApiResponse({ status: 404, description: 'Active subscription not found' })
  @ApiResponse({ status: 500, description: 'Internal error during downgrade' })
  async downgradeToFree(@Param('userId') userId: string): Promise<void> {
    await this.subscriptionService.downgradeToFree(userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all subscriptions (admin use)' })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions list retrieved successfully',
  })
  async getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<SubscriptionDocument[]> {
    return this.subscriptionService.getAll(page, limit);
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get subscription by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subscription not found for user',
  })
  async getByuser(
    @Param('userId') userId: string,
  ): Promise<SubscriptionDocument> {
    return this.subscriptionService.getActiveByuser(userId);
  }
}
