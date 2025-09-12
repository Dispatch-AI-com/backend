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
@Controller('settings/user')
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

  @Post(':userId/verification/email/send')
  @ApiOperation({ summary: 'Send email verification code' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Verification email sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid email address' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async sendEmailVerification(
    @Param('userId') userId: string,
    @Body() { email }: { email: string },
  ): Promise<{ success: boolean; message?: string }> {
    return this.verificationService.sendEmailVerification(userId, email);
  }

  @Post(':userId/verification/email/verify')
  @ApiOperation({ summary: 'Verify email address with code' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Email address verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid verification code' })
  @ApiNotFoundResponse({ description: 'Verification record not found' })
  async verifyEmail(
    @Param('userId') userId: string,
    @Body() { email, code }: { email: string; code: string },
  ): Promise<Verification> {
    return this.verificationService.verifyEmail(userId, email, code);
  }

  @Post(':userId/verification/mobile/send')
  @ApiOperation({ summary: 'Send SMS verification code' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'SMS verification sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid phone number' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async sendSmsVerification(
    @Param('userId') userId: string,
    @Body() { mobile }: { mobile: string },
  ): Promise<{ success: boolean; message?: string }> {
    return this.verificationService.sendSmsVerification(userId, mobile);
  }

  @Post(':userId/verification/mobile/verify')
  @ApiOperation({ summary: 'Verify mobile number with SMS code' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Mobile number verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid verification code' })
  @ApiNotFoundResponse({ description: 'Verification record not found' })
  async verifySms(
    @Param('userId') userId: string,
    @Body() { mobile, code }: { mobile: string; code: string },
  ): Promise<Verification> {
    return this.verificationService.verifySms(userId, mobile, code);
  }
}
