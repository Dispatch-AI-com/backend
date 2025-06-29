import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AnswerDto } from './dto/answer.dto';
import { CompleteDto } from './dto/complete.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('answer')
  @ApiOperation({ summary: 'Save user answer for current onboarding step' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Answer saved successfully and next step returned',
    schema: {
      example: {
        success: true,
        currentStep: 3,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or missing fields',
  })
  async saveAnswer(@Body() dto: AnswerDto): Promise<{
    success: boolean;
    currentStep: number;
  }> {
    return this.onboardingService.saveAnswer(
      dto.userId,
      dto.stepId,
      dto.answer,
    );
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get current onboarding progress for a user' })
  @ApiQuery({
    name: 'userId',
    required: true,
    description: 'User ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns current step and saved answers',
    schema: {
      example: {
        currentStep: 3,
        answers: {
          '1': 'Kenves',
          '2': 'Xie',
        },
        status: 'in_progress',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing or invalid query parameters',
  })
  async getProgress(@Query('userId') userId: string): Promise<{
    currentStep: number;
    answers: Record<string, string>;
    status: string;
  }> {
    return this.onboardingService.getProgress(userId);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Mark onboarding session as completed' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully marked as completed',
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User session not found',
  })
  async complete(@Body() dto: CompleteDto): Promise<{ success: boolean }> {
    return this.onboardingService.completeSession(dto.userId);
  }
}
