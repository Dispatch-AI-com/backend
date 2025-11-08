import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionDocument } from './schema/subscription.schema';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
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

  @Get('admin/cron/reset-now')
  @ApiOperation({ summary: '[Admin] Manually run reset job once' })
  @ApiResponse({ status: 200, description: 'Reset successful' })
  @HttpCode(HttpStatus.OK)
  async resetNow(): Promise<{ ok: true }> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await this.subscriptionService.resetIfMonthlyDue();
    return { ok: true };
  }

  @Get(':userId/remaining')
  @ApiOperation({ summary: 'Get remaining call time for current cycle' })
  @HttpCode(HttpStatus.OK)
  async getRemaining(
    @Param('userId') userId: string,
  ): Promise<{ seconds: number; minutes: number }> {
    const sub = await this.subscriptionService.getActiveByuser(userId);
    const seconds = Math.max(sub.secondsLeft || 0, 0);
    return { seconds, minutes: Math.floor(seconds / 60) };
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
  @ApiOperation({ summary: 'Schedule subscription cancellation at period end' })
  @ApiResponse({
    status: 200,
    description: 'Subscription set to cancel at period end',
  })
  @ApiResponse({ status: 404, description: 'Active subscription not found' })
  @ApiResponse({ status: 400, description: 'Invalid subscription data' })
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

  /**
   * DELETE /subscriptions/:subscriptionId
   */
  @Delete('id/:id')
  @ApiOperation({ summary: 'Delete subscription by MongoDB _id' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async deleteById(@Param('id') id: string): Promise<{ message: string }> {
    await this.subscriptionService.deleteById(id);
    return { message: 'Subscription deleted successfully' };
  }

  @Get(':userId/invoices')
  @ApiOperation({ summary: 'Get invoice history by user ID' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiResponse({
    status: 404,
    description: 'User or stripeCustomerId not found',
  })
  async getInvoices(@Param('userId') userId: string): Promise<unknown> {
    const invoices = await this.subscriptionService.getInvoicesByUser(userId);
    return invoices;
  }

  @Get(':userId/refunds')
  @ApiOperation({ summary: 'Get refund history by user ID' })
  @ApiResponse({ status: 200, description: 'Refunds retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User or chargeId not found' })
  async getRefunds(@Param('userId') userId: string): Promise<unknown> {
    const refunds = await this.subscriptionService.getRefundsByUserId(userId);
    return refunds;
  }
}
