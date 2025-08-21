import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import {
  type UpdateVerificationDto,
  VerificationService,
} from '@/modules/setting/verification.service';

import { Verification } from './schema/verification.schema';

@ApiTags('verification')
@Controller('api/settings/user')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get(':userId/verification')
  @ApiOperation({ summary: 'Get user verification settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({
    description: 'User verification settings retrieved successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid user id' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getVerification(
    @Param('userId') userId: string,
  ): Promise<Verification | null> {
    return this.verificationService.getVerification(userId);
  }

  @Put(':userId/verification')
  @ApiOperation({ summary: 'Update user verification settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Verification settings updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateVerification(
    @Param('userId') userId: string,
    @Body() updateData: UpdateVerificationDto,
  ): Promise<Verification> {
    return this.verificationService.updateVerification(userId, updateData);
  }

  @Post(':userId/verification/mobile')
  @ApiOperation({ summary: 'Verify mobile number' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Mobile number verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid mobile number' })
  @ApiNotFoundResponse({ description: 'Verification record not found' })
  async verifyMobile(
    @Param('userId') userId: string,
    @Body() { mobile }: { mobile: string },
  ): Promise<Verification> {
    return this.verificationService.verifyMobile(userId, mobile);
  }

  @Post(':userId/verification/email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Email address verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid email address' })
  @ApiNotFoundResponse({ description: 'Verification record not found' })
  async verifyEmail(
    @Param('userId') userId: string,
    @Body() { email }: { email: string },
  ): Promise<Verification> {
    return this.verificationService.verifyEmail(userId, email);
  }
}
