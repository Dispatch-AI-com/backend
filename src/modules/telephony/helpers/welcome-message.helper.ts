/**
 * Welcome Message Helper
 *
 * Pure utility functions for building welcome messages.
 * No dependencies, easy to test and maintain.
 */

export const WelcomeMessageHelper = {
  /**
   * Build welcome message based on company info and user preferences
   */
  buildWelcomeMessage(
    companyName?: string,
    services?: readonly { name: string }[],
    greeting?: { message: string; isCustom: boolean },
  ): string {
    // Always use the user's greeting message if it exists
    if (greeting?.message) {
      return greeting.message;
    }

    // Introduce Dispatch AI service and ask for name
    return 'Hi! This is Dispatch AI. The person you are calling has enabled AI service to handle incoming calls. May I have your name, please?';
  },

  /**
   * Build service list string for welcome messages
   */
  buildServiceList(services: readonly { name: string }[]): string {
    if (services.length === 0) {
      return '';
    }
    return services.map(s => s.name).join(', ');
  },

  /**
   * Get appropriate greeting prompt based on message type
   */
  getGreetingPrompt(isCustomMessage: boolean): string {
    return isCustomMessage
      ? 'May I have your name to begin with the process?'
      : 'May I get your name please?';
  },
} as const;
