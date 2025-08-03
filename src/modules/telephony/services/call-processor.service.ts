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
import { ValidationHelper } from '../helpers/validation.helper';
import { WelcomeMessageHelper } from '../helpers/welcome-message.helper';
import { AiIntegrationService } from './ai-integration.service';
import { CallDataPersistenceService } from './call-data-persistence.service';

const PUBLIC_URL = process.env.PUBLIC_URL ?? 'https://your-domain/api';

@Injectable()
export class CallProcessorService {
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

    if (ValidationHelper.isFinalCallStatus(CallStatus)) {
      winstonLogger.log(
        `[CallProcessorService][callSid=${CallSid}][handleStatus] status=${CallStatus}`,
      );

      try {
        await this.dataPersistence.processCallCompletion(CallSid, statusData);
      } catch (error) {
        winstonLogger.error(
          `[CallProcessorService][callSid=${CallSid}][handleStatus] Failed to process call completion`,
          { error: (error as Error).message, stack: (error as Error).stack },
        );
      }
    }

    winstonLogger.log(
      `[CallProcessorService][callSid=${CallSid}][handleStatus] status=${CallStatus}`,
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
