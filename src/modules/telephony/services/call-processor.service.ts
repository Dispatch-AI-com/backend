import { Injectable } from '@nestjs/common';

import { SYSTEM_RESPONSES } from '@/common/constants/system-responses.constant';
import {
  VoiceGatherBody,
  VoiceStatusBody,
} from '@/common/interfaces/twilio-voice-webhook';
import { winstonLogger } from '@/logger/winston.logger';
import { CompanyService } from '@/modules/company/company.service';
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
    private readonly companyService: CompanyService,
    private readonly aiIntegration: AiIntegrationService,
    private readonly dataPersistence: CallDataPersistenceService,
  ) {}

  async handleVoice(voiceData: VoiceGatherBody): Promise<string> {
    const { CallSid, To, From } = voiceData;
    winstonLogger.log(
      `[CallProcessorService][handleVoice] Full request data: ${JSON.stringify(voiceData)}`,
    );
    winstonLogger.log(
      `[CallProcessorService][handleVoice] CallSid=${CallSid}, Looking for user with twilioPhoneNumber=${To}`,
    );
    await this.sessionHelper.ensureSession(CallSid);

    // Store caller information
    await this.sessionHelper.setCallerInfo(
      CallSid,
      From,
      new Date().toISOString(),
    );

    const user = await this.userService.findByTwilioPhoneNumber(To);
    if (user == null) {
      winstonLogger.warn(
        `[CallProcessorService][handleVoice] No user found with twilioPhoneNumber=${To}`,
      );
      return this.speakAndLog(CallSid, 'User not found', NextAction.HANGUP);
    }
    const company = await this.companyService.findByUserId(user._id as string);
    const userGreeting = await this.userService.getGreeting(user._id as string);
    await this.sessionHelper.fillCompany(CallSid, company, user);

    const welcome = WelcomeMessageHelper.buildWelcomeMessage(
      company.businessName,
      undefined,
      userGreeting,
    );

    const twimlResponse = await this.speakAndLog(
      CallSid,
      welcome,
      NextAction.GATHER,
    );
    winstonLogger.log(
      `[CallProcessorService][handleVoice] Generated TwiML: ${twimlResponse.substring(0, 200)}...`,
    );
    return twimlResponse;
  }

  async handleGather({
    CallSid,
    SpeechResult = '',
  }: VoiceGatherBody): Promise<string> {
    winstonLogger.log(
      `[CallProcessorService][callSid=${CallSid}][handleGather] Received gather request with SpeechResult: "${SpeechResult}"`,
    );
    await this.sessionHelper.ensureSession(CallSid);
    let reply: string = SYSTEM_RESPONSES.fallback;

    if (SpeechResult) {
      try {
        await this.sessionHelper.appendUserMessage(CallSid, SpeechResult);
        winstonLogger.log(
          `[CallProcessorService][callSid=${CallSid}][handleGather] Calling AI service...`,
        );
        const aiReplyData = await this.aiIntegration.getAIReply(
          CallSid,
          SpeechResult,
        );
        const shouldHangup = aiReplyData.shouldHangup === true;
        winstonLogger.log(
          `[CallProcessorService][callSid=${CallSid}][handleGather] AI response received: shouldHangup=${String(
            shouldHangup,
          )}`,
        );
        reply = aiReplyData.message.trim() || SYSTEM_RESPONSES.fallback;

        // Check if AI indicates conversation should end
        if (shouldHangup) {
          winstonLogger.log(
            `[CallProcessorService][callSid=${CallSid}][handleGather] AI indicates conversation complete, hanging up`,
          );
          return await this.speakAndLog(CallSid, reply, NextAction.HANGUP);
        }
      } catch (err) {
        winstonLogger.error(
          `[CallProcessorService][callSid=${CallSid}][handleGather] AI call failed`,
          { stack: (err as Error).stack, message: (err as Error).message },
        );
        reply = SYSTEM_RESPONSES.error;
      }
    } else {
      winstonLogger.warn(
        `[CallProcessorService][callSid=${CallSid}][handleGather] No SpeechResult received`,
      );
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
