import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { VerifyUserIdParam } from '@/common/decorators/verify-user-access.decorator';

import {
  UpdateVerificationDto,
  SendEmailVerificationDto,
  VerifyEmailDto,
  SendSmsVerificationDto,
  VerifySmsDto,
} from '../dto/verification.dto';
import { VerificationService } from '../services/verification.service';
import { Verification } from '../schemas/verification.schema';

@ApiTags('verification')
@Controller('verification')
@UseGuards(AuthGuard('jwt'))
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user verification settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({
    description: 'User verification settings retrieved successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid user id' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getVerification(
    @Param('userId') userId: string,
    @VerifyUserIdParam('userId') _verified?: unknown,
  ): Promise<Verification | null> {
    return this.verificationService.getVerification(userId);
  }

  @Put('user/:userId')
  @ApiOperation({ summary: 'Update user verification settings' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Verification settings updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateVerification(
    @Param('userId') userId: string,
    @Body() updateData: UpdateVerificationDto,
    @VerifyUserIdParam('userId') _verified?: unknown,
  ): Promise<Verification> {
    return this.verificationService.updateVerification(userId, updateData);
  }

  @Post('user/:userId/mobile')
  @ApiOperation({ summary: 'Verify mobile number' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Mobile number verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid mobile number' })
  @ApiNotFoundResponse({ description: 'Verification record not found' })
  async verifyMobile(
    @Param('userId') userId: string,
    @Body() { mobile }: { mobile: string },
    @VerifyUserIdParam('userId') _verified?: unknown,
  ): Promise<Verification> {
    return this.verificationService.verifyMobile(userId, mobile);
  }

  @Post('user/:userId/email/send')
  @ApiOperation({ summary: 'Send email verification code' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Verification email sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid email address' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async sendEmailVerification(
    @Param('userId') userId: string,
    @Body() { email }: SendEmailVerificationDto,
    @VerifyUserIdParam('userId') _verified?: unknown,
  ): Promise<{ success: boolean; message?: string }> {
    return this.verificationService.sendEmailVerification(userId, email);
  }

  @Post('user/:userId/email/verify')
  @ApiOperation({ summary: 'Verify email address with code' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Email address verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid verification code' })
  @ApiNotFoundResponse({ description: 'Verification record not found' })
  async verifyEmail(
    @Param('userId') userId: string,
    @Body() { email, code }: VerifyEmailDto,
    @VerifyUserIdParam('userId') _verified?: unknown,
  ): Promise<Verification> {
    return this.verificationService.verifyEmail(userId, email, code);
  }

  @Post('user/:userId/mobile/send')
  @ApiOperation({ summary: 'Send SMS verification code' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'SMS verification sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid phone number' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async sendSmsVerification(
    @Param('userId') userId: string,
    @Body() { mobile }: SendSmsVerificationDto,
    @VerifyUserIdParam('userId') _verified?: unknown,
  ): Promise<{ success: boolean; message?: string }> {
    return this.verificationService.sendSmsVerification(userId, mobile);
  }

  @Post('user/:userId/mobile/verify')
  @ApiOperation({ summary: 'Verify mobile number with SMS code' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Mobile number verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid verification code' })
  @ApiNotFoundResponse({ description: 'Verification record not found' })
  async verifySms(
    @Param('userId') userId: string,
    @Body() { mobile, code }: VerifySmsDto,
    @VerifyUserIdParam('userId') _verified?: unknown,
  ): Promise<Verification> {
    return this.verificationService.verifySms(userId, mobile, code);
  }
}
