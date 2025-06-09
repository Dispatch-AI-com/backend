import { Controller, Get, UnauthorizedException } from '@nestjs/common';
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
    summary: 'Hello Endpoint',
    description: 'Returns a greeting message',
  })
  @ApiResponse({ status: 200, description: 'Returns Hello message' })
  @Get('hello')
  hello(): { message: string } {
    return {
      message: 'Hello, DispatchAI!the new one！This is a fucking crazy test！',
    };
  }

  @ApiOperation({
    summary: 'Unauthorized Endpoint',
    description: 'Simulates an unauthorized access attempt',
  })
  @ApiResponse({ status: 401, description: 'JWT token is invalid or expired' })
  @Get('unauthorized')
  unauthorized(): never {
    throw new UnauthorizedException('JWT token is invalid or expired');
  }
}
