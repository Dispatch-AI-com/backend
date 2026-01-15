/**
 * Interface for email verification services.
 * This interface allows for easy replacement of email providers (AWS SES, SendGrid, etc.)
 */
export interface IEmailVerificationService {
  /**
   * Send a verification code via email
   * @param email - Recipient email address
   * @param verificationCode - The verification code to send
   * @param firstName - Optional recipient first name for personalization
   * @returns Promise that resolves when email is sent
   * @throws Error if email sending fails
   */
  sendVerificationCode(
    email: string,
    verificationCode: string,
    firstName?: string,
  ): Promise<void>;
}
