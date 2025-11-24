/**
 * Interface for SMS verification services.
 * This interface allows for easy replacement of SMS providers (AWS SNS, Twilio, etc.)
 */
export interface ISmsVerificationService {
  /**
   * Send a verification code via SMS
   * @param phoneNumber - Recipient phone number (in any format, will be normalized)
   * @param verificationCode - The verification code to send
   * @returns Promise that resolves when SMS is sent
   * @throws Error if SMS sending fails
   */
  sendVerificationCode(
    phoneNumber: string,
    verificationCode: string,
  ): Promise<void>;
}
