export type SpeakerType = 'AI' | 'User';

export const SPEAKER_TYPE = {
  AI: 'AI' as const,
  User: 'User' as const,
} as const;

export const SPEAKER_TYPE_VALUES: SpeakerType[] = ['AI', 'User'];
