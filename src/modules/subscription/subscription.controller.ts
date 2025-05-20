import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Get,
  HttpCode,
  HttpStatus,
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
  @ApiResponse({ status: 400, description: 'Bad request - invalid plan or pricing rule' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Only active subscriptions can be cancelled' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancel(@Param('id') id: string) {
    return this.subscriptionService.cancelSubscription(id);
  }

}
