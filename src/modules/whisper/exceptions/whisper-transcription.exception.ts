export class WhisperTranscriptionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhisperTranscriptionException';
  }
}
