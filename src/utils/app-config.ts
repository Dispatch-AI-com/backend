/**
 * Get the frontend application URL from environment variables
 * Supports multiple variable names for flexibility
 */
export function getAppUrl(): string {
  // Try multiple possible variable names
  const appUrl =
    process.env.APP_URL ??
    process.env.FRONTEND_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    return appUrl;
  }

  // Only allow localhost fallback in development
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️  Frontend URL not set. Using localhost fallback for development.',
    );
    return 'http://localhost:3000';
  }

  // In production, throw error if frontend URL is not configured
  throw new Error(
    'Frontend URL is not configured. Please set APP_URL, FRONTEND_URL, or NEXT_PUBLIC_APP_URL environment variable.',
  );
}

/**
 * Get the CORS origin from environment variables
 * Supports multiple variable names for flexibility
 */
export function getCorsOrigin(): string | undefined {
  // Try multiple possible variable names
  const corsOrigin =
    process.env.CORS_ORIGIN ??
    process.env.FRONTEND_URL ??
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  return corsOrigin;
}
