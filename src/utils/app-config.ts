/**
 * Get the frontend application URL from environment variables
 */
export function getAppUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000';
}

/**
 * Get the CORS origin from environment variables
 */
export function getCorsOrigin(): string | undefined {
  const corsOrigin = process.env.CORS_ORIGIN;

  return corsOrigin;
}
