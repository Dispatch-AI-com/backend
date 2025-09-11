import { Injectable, Logger } from '@nestjs/common';
import { McpCalendarIntegrationService } from '@/modules/calendar/services/mcp-calendar-integration.service';

/**
 * Telephony Calendar集成服务
 * 在Telephony系统中集成MCP Calendar功能
 */
@Injectable()
export class TelephonyCalendarIntegrationService {
  private readonly logger = new Logger(TelephonyCalendarIntegrationService.name);

  constructor(
    private readonly mcpCalendarIntegration: McpCalendarIntegrationService,
  ) {}

  /**
   * 处理通话中的日历事件创建
   * 当AI检测到用户想要预约服务时调用
   */
  async handleCallCalendarEvent(
    userId: string,
    callData: {
      callSid: string;
      customerName: string;
      customerPhone: string;
      serviceType: string;
      preferredTime: string;
      customerEmail?: string;
    }
  ): Promise<{
    success: boolean;
    eventId?: string;
    emailSent?: boolean;
    message: string;
  }> {
    try {
      this.logger.log(`处理通话日历事件，用户: ${userId}, 通话: ${callData.callSid}`);

      // 1. 检查用户是否可以创建日历事件
      const canCreate = await this.mcpCalendarIntegration.canUserCreateCalendarEvent(userId);
      
      if (!canCreate) {
        this.logger.warn(`用户 ${userId} 无法创建日历事件，可能没有连接Google Calendar`);
        return {
          success: false,
          message: '请先连接Google Calendar以创建预约',
        };
      }

      // 2. 准备MCP调用参数
      const { emailData, calendarData, mcpParams } = 
        await this.mcpCalendarIntegration.prepareTelephonyMcpCall(userId, callData);

      // 3. 调用MCP AI后端
      const result = await this.mcpCalendarIntegration.callMcpAiBackend(
        userId,
        mcpParams,
        emailData,
        calendarData
      );

      this.logger.log(`通话日历事件创建成功:`, {
        callSid: callData.callSid,
        userId,
        eventId: result.eventId,
        emailSent: result.emailSent,
      });

      return {
        success: true,
        eventId: result.eventId,
        emailSent: result.emailSent,
        message: '预约已创建，确认邮件已发送',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`处理通话日历事件失败:`, error);
      return {
        success: false,
        message: `创建预约失败: ${errorMessage}`,
      };
    }
  }

  /**
   * 检查用户是否已连接Google Calendar
   */
  async checkUserCalendarConnection(userId: string): Promise<{
    connected: boolean;
    provider?: string;
    expiresAt?: Date;
    message: string;
  }> {
    try {
      const config = await this.mcpCalendarIntegration.getUserCalendarConfig(userId);
      
      if (!config.hasValidToken) {
        return {
          connected: false,
          message: '未连接Google Calendar',
        };
      }

      if (!config.canCreateEvents) {
        return {
          connected: true,
          provider: config.provider,
          expiresAt: config.tokenExpiresAt,
          message: 'Google Calendar已连接，但令牌即将过期',
        };
      }

      return {
        connected: true,
        provider: config.provider,
        expiresAt: config.tokenExpiresAt,
        message: 'Google Calendar已连接，可以创建预约',
      };
    } catch (error) {
      this.logger.error(`检查用户日历连接失败:`, error);
      return {
        connected: false,
        message: '检查日历连接时出错',
      };
    }
  }

  /**
   * 为AI对话提供日历状态信息
   */
  async getCalendarStatusForAi(userId: string): Promise<{
    canCreateEvents: boolean;
    provider?: string;
    message: string;
  }> {
    try {
      const config = await this.mcpCalendarIntegration.getUserCalendarConfig(userId);
      
      if (!config.hasValidToken) {
        return {
          canCreateEvents: false,
          message: '用户尚未连接Google Calendar，无法创建预约。请引导用户连接Google Calendar。',
        };
      }

      if (!config.canCreateEvents) {
        return {
          canCreateEvents: false,
          provider: config.provider,
          message: 'Google Calendar已连接，但访问令牌即将过期，需要重新授权。',
        };
      }

      return {
        canCreateEvents: true,
        provider: config.provider,
        message: 'Google Calendar已连接，可以创建预约事件。',
      };
    } catch (error) {
      this.logger.error(`获取AI日历状态失败:`, error);
      return {
        canCreateEvents: false,
        message: '无法获取日历状态，请稍后重试。',
      };
    }
  }

  /**
   * 创建预约确认消息
   */
  async createAppointmentConfirmation(
    userId: string,
    appointmentData: {
      customerName: string;
      serviceType: string;
      appointmentTime: string;
      customerEmail?: string;
    }
  ): Promise<string> {
    try {
      const config = await this.mcpCalendarIntegration.getUserCalendarConfig(userId);
      
      if (!config.canCreateEvents) {
        return `抱歉，${appointmentData.customerName}，我无法为您创建预约，因为Google Calendar尚未连接。请稍后联系我们的客服人员。`;
      }

      // 准备预约数据
      const callData = {
        callSid: 'confirmation_call',
        customerName: appointmentData.customerName,
        customerPhone: 'N/A',
        serviceType: appointmentData.serviceType,
        preferredTime: appointmentData.appointmentTime,
        customerEmail: appointmentData.customerEmail,
      };

      // 创建预约
      const result = await this.handleCallCalendarEvent(userId, callData);

      if (result.success) {
        return `太好了，${appointmentData.customerName}！我已经为您创建了${appointmentData.serviceType}的预约，时间是${appointmentData.appointmentTime}。确认邮件已发送到您的邮箱。如有任何问题，请随时联系我们。`;
      } else {
        return `抱歉，${appointmentData.customerName}，创建预约时遇到了问题：${result.message}。请稍后联系我们的客服人员。`;
      }
    } catch (error) {
      this.logger.error(`创建预约确认消息失败:`, error);
      return `抱歉，${appointmentData.customerName}，创建预约时遇到了技术问题。请稍后联系我们的客服人员。`;
    }
  }
}
