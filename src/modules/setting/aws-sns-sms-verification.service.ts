import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { formatPhoneNumberToE164 } from './helpers/phone-number.util.js';
import { ISmsVerificationService } from './interfaces/sms-verification.interface.js';

@Injectable()
export class AwsSnsSmsVerificationService implements ISmsVerificationService {
  private readonly logger = new Logger(AwsSnsSmsVerificationService.name);
  private readonly snsClient: SNSClient;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region =
      this.configService.get<string>('AWS_REGION') ?? 'ap-southeast-2';

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (accessKeyId === undefined || secretAccessKey === undefined) {
      this.logger.warn(
        'AWS credentials not found in environment variables - using mock mode',
      );
    }

    this.snsClient = new SNSClient({
      region: this.region,
      credentials:
        accessKeyId !== undefined && secretAccessKey !== undefined
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
  }

  async sendVerificationCode(
    phoneNumber: string,
    verificationCode: string,
  ): Promise<void> {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    // If no API key, use mock mode for testing
    if (accessKeyId === undefined || secretAccessKey === undefined) {
      this.logger.log(
        `[MOCK MODE] SMS verification would be sent to ${phoneNumber} with code: ${verificationCode}`,
      );
      return;
    }

    try {
      // Format phone number to E.164 format if needed
      const formattedPhone = formatPhoneNumberToE164(phoneNumber);

      const message = `Your DispatchAI verification code is: ${verificationCode}. This code will expire in 10 minutes.`;

      const command = new PublishCommand({
        Message: message,
        PhoneNumber: formattedPhone,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });

      const result = await this.snsClient.send(command);

      this.logger.log(
        `SMS verification sent to ${formattedPhone}: ${result.MessageId ?? 'unknown'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send SMS verification to ${phoneNumber}:`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
