import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IEmailVerificationService } from './interfaces/email-verification.interface.js';
import {
  generateVerificationEmailHtml,
  generateVerificationEmailText,
} from './helpers/email-template.util.js';

@Injectable()
export class AwsSesEmailVerificationService implements IEmailVerificationService {
  private readonly logger = new Logger(AwsSesEmailVerificationService.name);
  private readonly sesClient: SESv2Client;
  private readonly region: string;
  private readonly emailFrom: string;
  private readonly appName: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') ?? 'ap-southeast-2';
    this.emailFrom =
      this.configService.get<string>('SES_FROM') ?? 'noreply@dispatchai.com';
    this.appName = this.configService.get<string>('APP_NAME') ?? 'DispatchAI';

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (accessKeyId === undefined || secretAccessKey === undefined) {
      this.logger.warn(
        'AWS credentials not found in environment variables - using mock mode',
      );
    }

    this.sesClient = new SESv2Client({
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
    email: string,
    verificationCode: string,
    firstName?: string,
  ): Promise<void> {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    // If no API key, use mock mode for testing
    if (accessKeyId === undefined || secretAccessKey === undefined) {
      this.logger.log(
        `[MOCK MODE] Verification email would be sent to ${email} with code: ${verificationCode}`,
      );
      return;
    }

    try {
      const command = new SendEmailCommand({
        FromEmailAddress: this.emailFrom,
        Destination: {
          ToAddresses: [email],
        },
        Content: {
          Simple: {
            Subject: {
              Data: 'DispatchAI Email Verification Code',
            },
            Body: {
              Text: {
                Data: generateVerificationEmailText({
                  appName: this.appName,
                  verificationCode,
                  firstName,
                  expirationMinutes: 10,
                }),
              },
              Html: {
                Data: generateVerificationEmailHtml({
                  appName: this.appName,
                  verificationCode,
                  firstName,
                  expirationMinutes: 10,
                }),
              },
            },
          },
        },
      });

      const result = await this.sesClient.send(command);

      this.logger.log(
        `Verification email sent to ${email}: ${String(result.MessageId ?? 'unknown')}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}:`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

}




