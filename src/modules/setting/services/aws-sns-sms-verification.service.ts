import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSnsSmsVerificationService {
  private readonly logger = new Logger(AwsSnsSmsVerificationService.name);
  private readonly snsClient: SNSClient;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1';

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

  async sendVerificationSms(
    phoneNumber: string,
    verificationCode: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>(
        'AWS_SECRET_ACCESS_KEY',
      );

      if (accessKeyId === undefined || secretAccessKey === undefined) {
        this.logger.log(
          `[MOCK MODE] SMS verification would be sent to ${phoneNumber} with code: ${verificationCode}`,
        );
        return { success: true, message: 'Mock SMS sent successfully' };
      }

      // Format phone number to E.164 format if needed
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const message = `Your verification code is: ${verificationCode}. This code will expire in 10 minutes.`;

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
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS verification to ${phoneNumber}:`,
        error,
      );
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  generateVerificationCode(): string {
    // Generate a 6-digit verification code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // If it starts with 0, replace with +61 (Australia)
    if (digits.startsWith('0')) {
      return `+61${digits.substring(1)}`;
    }

    // If it doesn't start with +, add it
    if (!digits.startsWith('+')) {
      return `+${digits}`;
    }

    return digits;
  }
}
