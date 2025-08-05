import { Injectable } from '@nestjs/common';

import { SYSTEM_RESPONSES } from '@/common/constants/system-responses.constant';
import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import { CompanyService } from '@/modules/company/company.service';
import { ServiceService } from '@/modules/service/service.service';
import {
  buildSayResponse,
  NextAction,
} from '@/modules/telephony/utils/twilio-response.util';
import { UserService } from '@/modules/user/user.service';

import { SessionHelper } from '../helpers/session.helper';
import { WelcomeMessageHelper } from '../helpers/welcome-message.helper';
import { AiIntegrationService } from './ai-integration.service';
import { CallDataPersistenceService } from './call-data-persistence.service';

const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://your-domain/api';

@Injectable()
export class CallProcessorService {
  private readonly statusHandlers: Record<
    string,
    (callSid: string, statusData: VoiceStatusBody) => Promise<void> | void
  > = {
    // Final statuses that require data persistence
    completed: this.handleCompletedStatus.bind(this),
    busy: this.handleFinalStatus.bind(this),
    failed: this.handleFinalStatus.bind(this),
    'no-answer': this.handleFinalStatus.bind(this),
    // Non-final statuses that only require logging
    queued: this.handleNonFinalStatus.bind(this),
    ringing: this.handleNonFinalStatus.bind(this),
    'in-progress': this.handleNonFinalStatus.bind(this),
  };

  // White list derived from statusHandlers and VoiceStatusBody interface
  private readonly validCallStatuses = new Set<string>(
    Object.keys(this.statusHandlers),
  );

  constructor(
    private readonly sessionHelper: SessionHelper,
    private readonly userService: UserService,
    private readonly serviceService: ServiceService,
    private readonly companyService: CompanyService,
    private readonly aiIntegration: AiIntegrationService,
    private readonly dataPersistence: CallDataPersistenceService,
  ) {}

  async handleVoice({ CallSid, To }: VoiceGatherBody): Promise<string> {
    await this.sessionHelper.ensureSession(CallSid);
    const user = await this.userService.findByTwilioPhoneNumber(To);
    if (user == null) {
      return this.speakAndLog(CallSid, 'User not found', NextAction.GATHER);
    }

    const services = await this.serviceService.findAllActiveByUserId(
      user._id as string,
    );
    await this.sessionHelper.fillCompanyServices(CallSid, services);

    const company = await this.companyService.findByUserId(user._id as string);
    await this.sessionHelper.fillCompany(CallSid, company);

    const welcome = WelcomeMessageHelper.buildWelcomeMessage(
      company.businessName,
      services,
      company.greeting,
    );

    return this.speakAndLog(CallSid, welcome, NextAction.GATHER);
  }

  async handleGather({
    CallSid,
    SpeechResult = '',
  }: VoiceGatherBody): Promise<string> {
    await this.sessionHelper.ensureSession(CallSid);
    let reply: string = SYSTEM_RESPONSES.fallback;

    if (SpeechResult) {
      try {
        await this.sessionHelper.appendUserMessage(CallSid, SpeechResult);
        const aiReplyData = await this.aiIntegration.getAIReply(
          CallSid,
          SpeechResult,
        );
        reply = aiReplyData.message.trim() || SYSTEM_RESPONSES.fallback;

        // Check if AI indicates conversation should end
        if (aiReplyData.shouldHangup === true) {
          winstonLogger.log(
            `[CallProcessorService][callSid=${CallSid}][handleGather] AI indicates conversation complete, hanging up`,
          );
          return await this.speakAndLog(CallSid, reply, NextAction.HANGUP);
        }
      } catch (err) {
        winstonLogger.error(
          `[CallProcessorService][callSid=${CallSid}][handleGather] AI call failed`,
          { stack: (err as Error).stack },
        );
        reply = SYSTEM_RESPONSES.error;
      }
    }
    return this.speakAndLog(CallSid, reply, NextAction.GATHER);
  }

  async handleStatus(statusData: VoiceStatusBody): Promise<void> {
    const { CallSid, CallStatus } = statusData;

    // Validate CallStatus against white list
    if (!this.validCallStatuses.has(CallStatus)) {
      winstonLogger.warn(
        `[CallProcessorService][callSid=${CallSid}][handleStatus] Invalid call status received: ${CallStatus}. Ignoring.`,
      );
      return;
    }

    // Get handler for the validated status (guaranteed to exist)
    const handler = this.statusHandlers[CallStatus];
    await handler(CallSid, statusData);

    winstonLogger.log(
      `[CallProcessorService][callSid=${CallSid}][handleStatus] status=${CallStatus}`,
    );
  }

  private async handleCompletedStatus(
    callSid: string,
    statusData: VoiceStatusBody,
  ): Promise<void> {
    winstonLogger.log(
      `[CallProcessorService][callSid=${callSid}][handleCompletedStatus] Processing completed call`,
    );

    try {
      await this.dataPersistence.processCallCompletion(callSid, statusData);
    } catch (error) {
      winstonLogger.error(
        `[CallProcessorService][callSid=${callSid}][handleCompletedStatus] Failed to process call completion`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
    }
  }

  private async handleFinalStatus(
    callSid: string,
    statusData: VoiceStatusBody,
  ): Promise<void> {
    winstonLogger.log(
      `[CallProcessorService][callSid=${callSid}][handleFinalStatus] Processing final call status: ${statusData.CallStatus}`,
    );

    try {
      await this.dataPersistence.processCallCompletion(callSid, statusData);
    } catch (error) {
      winstonLogger.error(
        `[CallProcessorService][callSid=${callSid}][handleFinalStatus] Failed to process call completion for status ${statusData.CallStatus}`,
        { error: (error as Error).message, stack: (error as Error).stack },
      );
    }
  }

  private handleNonFinalStatus(
    callSid: string,
    statusData: VoiceStatusBody,
  ): void {
    // For non-final statuses, just log - no additional processing needed
    winstonLogger.log(
      `[CallProcessorService][callSid=${callSid}][handleNonFinalStatus] Non-final status: ${statusData.CallStatus}`,
    );
  }

  private async speakAndLog(
    callSid: string,
    text: string,
    next: NextAction,
  ): Promise<string> {
    await this.sessionHelper.appendAiMessage(callSid, text);

    return buildSayResponse({
      text,
      next,
      sid: callSid,
      publicUrl: PUBLIC_URL,
    });
  }
}
