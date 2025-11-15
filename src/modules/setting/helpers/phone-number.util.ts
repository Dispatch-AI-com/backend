/**
 * Utility functions for phone number formatting and validation
 */

/**
 * Format phone number to E.164 format (e.g., +61491050908)
 * Supports various input formats:
 * - 0491050908 (Australian mobile, leading 0)
 * - 491050908 (Australian mobile without leading 0)
 * - +61491050908 (E.164 format)
 * - 61491050908 (E.164 without +)
 * 
 * @param phoneNumber - Phone number in any common format
 * @param defaultCountryCode - Default country code to use if not provided (default: +61 for Australia)
 * @returns Phone number in E.164 format
 */
export function formatPhoneNumberToE164(
  phoneNumber: string,
  defaultCountryCode: string = '+61',
): string {
  // Remove all whitespace and common formatting characters except +
  const cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');

  // If already in E.164 format (starts with +), return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with 0 (Australian format), replace with country code
  if (cleaned.startsWith('0')) {
    return `${defaultCountryCode}${cleaned.substring(1)}`;
  }

  // If starts with country code digits (e.g., 61 for Australia), add +
  if (cleaned.match(/^61/)) {
    return `+${cleaned}`;
  }

  // If starts with mobile prefix (e.g., 4 for Australian mobile), add country code
  if (cleaned.match(/^4/)) {
    return `${defaultCountryCode}${cleaned}`;
  }

  // Default: add country code
  return `${defaultCountryCode}${cleaned}`;
}

/**
 * Validate if a phone number looks valid
 * @param phoneNumber - Phone number to validate
 * @returns true if phone number appears valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
  
  // Basic validation: should contain at least 8 digits
  const digitCount = cleaned.replace(/\D/g, '').length;
  return digitCount >= 8 && digitCount <= 15;
}

/**
 * Normalize phone number for storage (same as E.164 format)
 * @param phoneNumber - Phone number in any format
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  return formatPhoneNumberToE164(phoneNumber);
}

