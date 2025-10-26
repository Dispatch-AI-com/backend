import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSesEmailVerificationService {
  private readonly logger = new Logger(AwsSesEmailVerificationService.name);
  private readonly sesClient: SESv2Client;
  private readonly region: string;
  private readonly emailFrom: string;
  private readonly appName: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1';
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

  async sendVerificationEmail(
    email: string,
    verificationCode: string,
    firstName?: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>(
        'AWS_SECRET_ACCESS_KEY',
      );

      // If no API key, use mock mode for testing
      if (accessKeyId === undefined || secretAccessKey === undefined) {
        this.logger.log(
          `[MOCK MODE] Verification email would be sent to ${email} with code: ${verificationCode}`,
        );
        return { success: true, message: 'Mock email sent successfully' };
      }

      const command = new SendEmailCommand({
        FromEmailAddress: this.emailFrom,
        Destination: {
          ToAddresses: [email],
        },
        Content: {
          Simple: {
            Subject: {
              Data: 'Verify your email address',
            },
            Body: {
              Text: {
                Data: this.generateVerificationEmailText(
                  verificationCode,
                  firstName,
                ),
              },
              Html: {
                Data: this.generateVerificationEmailHtml(
                  verificationCode,
                  firstName,
                ),
              },
            },
          },
        },
      });

      const result = await this.sesClient.send(command);

      this.logger.log(
        `Verification email sent to ${email}: ${result.MessageId ?? 'unknown'}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}:`,
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

  private generateVerificationEmailHtml(
    verificationCode: string,
    firstName?: string,
  ): string {
    const greeting = firstName !== undefined ? `Hi ${firstName},` : 'Hi there,';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">${this.appName} Email Verification</h1>
            
            <p>${greeting}</p>
            
            <p>Thank you for signing up with ${this.appName}! To complete your registration and access all features, please verify your email address.</p>
            
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="color: #2c3e50; margin-bottom: 15px;">Your Verification Code</h2>
              <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; color: #2c3e50; letter-spacing: 3px;">
                ${verificationCode}
              </div>
            </div>
            
            <p>Please enter this code in the verification form on our website to complete your email verification.</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you didn't create an account with ${this.appName}, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="text-align: center; font-size: 12px; color: #999;">
              © 2024 ${this.appName}. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private generateVerificationEmailText(
    verificationCode: string,
    firstName?: string,
  ): string {
    const greeting = firstName !== undefined ? `Hi ${firstName},` : 'Hi there,';

    return `
${this.appName} Email Verification

${greeting}

Thank you for signing up with ${this.appName}! To complete your registration and access all features, please verify your email address.

Your Verification Code: ${verificationCode}

Please enter this code in the verification form on our website to complete your email verification.

If you didn't create an account with ${this.appName}, please ignore this email.

© 2024 ${this.appName}. All rights reserved.
    `.trim();
  }
}

