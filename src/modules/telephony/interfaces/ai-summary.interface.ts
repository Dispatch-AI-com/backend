export interface AISummaryRequest {
  callSid: string;
  conversation: unknown[];
  serviceInfo?: unknown;
}

export interface AISummaryResponse {
  summary: string;
  keyPoints: string[];
}

export interface AISummaryGenerationOptions {
  enableFallback?: boolean;
  fallbackSummary?: string;
  fallbackKeyPoints?: string[];
}
