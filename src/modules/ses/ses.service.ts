import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import process from 'process';

@Injectable()
export class SesService {
  private readonly sesClient: SESClient;
  private readonly logger = new Logger(SesService.name);

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  async sendEmail({
    to,
    subject,
    html,
    from,
  }: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<void> {
    const sender =
      from ?? process.env.SES_FROM_EMAIL ?? 'no-reply@dispatchai.com';
    const params = {
      Destination: { ToAddresses: [to] },
      Message: {
        Body: { Html: { Charset: 'UTF-8', Data: html } },
        Subject: { Charset: 'UTF-8', Data: subject },
      },
      Source: sender,
    };

    try {
      await this.sesClient.send(new SendEmailCommand(params));
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
