import { createHmac, randomBytes } from 'crypto';

const CSRF_SECRET =
  process.env.CSRF_SECRET ?? 'your-csrf-secret-change-in-production';

export interface CSRFTokenData {
  token: string;
  timestamp: number;
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now();
  const randomValue = randomBytes(32).toString('hex');
  const payload = `${timestamp.toString()}.${randomValue}`;

  const signature = createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (token.length === 0) {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [timestamp, randomValue, signature] = parts;
  const payload = `${timestamp}.${randomValue}`;

  // Verify signature
  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return false;
  }

  // Check if token is not older than 1 hour
  const tokenTime = parseInt(timestamp, 10);
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  return now - tokenTime < oneHour;
}
