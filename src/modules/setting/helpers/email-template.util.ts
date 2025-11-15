/**
 * Email template generation utilities for verification emails
 * These templates can be easily customized or replaced
 */

export interface EmailTemplateOptions {
  appName: string;
  verificationCode: string;
  firstName?: string;
  expirationMinutes?: number;
}

/**
 * Generate HTML email template for verification code
 * @param options - Template options
 * @returns HTML email body
 */
export function generateVerificationEmailHtml(
  options: EmailTemplateOptions,
): string {
  const {
    appName,
    verificationCode,
    firstName,
    expirationMinutes = 10,
  } = options;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

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
          <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">${appName} Email Verification</h1>
          
          <p>${greeting}</p>
          
          <p>Thank you for signing up with ${appName}! To complete your registration and access all features, please verify your email address.</p>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-bottom: 15px;">Your Verification Code</h2>
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; color: #2c3e50; letter-spacing: 3px;">
              ${verificationCode}
            </div>
          </div>
          
          <p>Please enter this code in the verification form on our website to complete your email verification.</p>
          <p>This code will expire in ${String(expirationMinutes)} minutes.</p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            If you didn't create an account with ${appName}, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="text-align: center; font-size: 12px; color: #999;">
            © ${String(new Date().getFullYear())} ${appName}. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text email template for verification code
 * @param options - Template options
 * @returns Plain text email body
 */
export function generateVerificationEmailText(
  options: EmailTemplateOptions,
): string {
  const {
    appName,
    verificationCode,
    firstName,
    expirationMinutes = 10,
  } = options;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';

  return `
${appName} Email Verification

${greeting}

Thank you for signing up with ${appName}! To complete your registration and access all features, please verify your email address.

Your Verification Code: ${verificationCode}

Please enter this code in the verification form on our website to complete your email verification.
This code will expire in ${String(expirationMinutes)} minutes.

If you didn't create an account with ${appName}, please ignore this email.

© ${String(new Date().getFullYear())} ${appName}. All rights reserved.
  `.trim();
}
