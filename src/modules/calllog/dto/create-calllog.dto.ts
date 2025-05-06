export class CreateCallLogDto {
    companyId!: string;
    serviceBookedId!: string;
    callerNumber!: string;
    status!: string;
    startAt!: Date;
    endAt?: Date;
    recordingUrl?: string;
  }
  