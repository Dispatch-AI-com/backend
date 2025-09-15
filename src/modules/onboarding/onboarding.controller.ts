import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SkipCSRF } from '@/common/decorators/skip-csrf.decorator';

import { AnswerDto } from './dto/answer.dto';
import { CompleteDto } from './dto/complete.dto';
import { DeleteSessionDto } from './dto/delete.dto';
import { OnboardingService } from './onboarding.service';
import type {
  OnboardingAnswers,
  OnboardingSession,
} from './schema/onboarding-session.schema';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('answer')
  @SkipCSRF()
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
      dto.field,
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
          user: {
            phone: '+61412345678',
            position: 'Manager',
          },
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
    answers: OnboardingAnswers;
    status: string;
  }> {
    return this.onboardingService.getProgress(userId);
  }

  @Post('complete')
  @SkipCSRF()
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

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @SkipCSRF()
  @ApiOperation({ summary: 'Delete onboarding session' })
  @ApiBody({
    type: DeleteSessionDto,
    description: 'Pass the userId of the session to be deleted',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully deleted',
    schema: {
      example: { success: true },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User session not found',
  })
  async deleteSession(
    @Body() dto: DeleteSessionDto,
  ): Promise<{ success: boolean }> {
    return this.onboardingService.deleteSession(dto.userId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all onboarding sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Array of onboarding sessions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string', example: '64e9b4f2c1234567890abcde' },
          currentStep: { type: 'number', example: 2 },
          answers: {
            type: 'object',
            example: {
              user: {
                phone: '+61412345678',
                position: 'Manager',
                address: {
                  streetAddress: '123 Collins St',
                  suburb: 'Melbourne',
                  state: 'VIC',
                  postcode: '3000',
                },
              },
            },
          },
          status: {
            type: 'string',
            enum: ['in_progress', 'completed'],
            example: 'in_progress',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-01T04:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-01T05:00:00.000Z',
          },
        },
      },
    },
  })
  async getAllSessions(): Promise<OnboardingSession[]> {
    return this.onboardingService.getAllSessions();
  }
}
