import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HealthService } from '@/modules/health/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({
    summary: 'Health Check',
    description: 'Check if the API is running',
  })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  @Get()
  check(): {
    status: string;
    timestamp: Date;
    service: string;
    environment: string;
  } {
    return this.healthService.check();
  }

  @ApiOperation({
    summary: 'Database Health Check',
    description: 'Check if the database connection is working',
  })
  @ApiResponse({ status: 200, description: 'Database connection is healthy' })
  @ApiResponse({ status: 503, description: 'Database connection failed' })
  @Get('db')
  async checkDatabase(): Promise<{ status: string }> {
    return this.healthService.checkDatabase();
  }
  @ApiOperation({
    summary: 'niubi！',
    description: 'niubi！',
  })
  @ApiResponse({ status: 200, description: 'niubi！' })
  @Get('niubi')
  niubi(): { message: string } {
    return { message: 'niubi！' };
  }

  @ApiOperation({
    summary: 'Test AI chat Endpoint',
    description: 'Returns a test message from AI server',
  })
  @ApiResponse({ status: 200, description: 'Returns Test message' })
  @Post('test-ai-chat')
  testAIChat(@Body('message') message: string): Promise<{
    status: string;
    response?: string;
    timestamp: Date;
    duration?: number;
    error?: string;
  }> {
    return this.healthService.testAIChat(message);
  }

  @ApiOperation({
    summary: 'Test AI ping',
    description: 'Returns a test message from AI server',
  })
  @ApiResponse({ status: 200, description: 'Returns Test message' })
  @Get('pingAI')
  ping(): Promise<{
    status: string;
    message?: string;
    timestamp: Date;
    duration?: number;
    error?: string;
  }> {
    return this.healthService.pingAI();
  }
}
