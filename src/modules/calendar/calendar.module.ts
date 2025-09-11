import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CalendarTokenController } from './calendar-token.controller';
import { CalendarOAuthController } from './calendar-oauth.controller';
import { CalendarTokenService } from './calendar-token.service';
import { McpCalendarIntegrationService } from './services/mcp-calendar-integration.service';
import { CalendarOAuthService } from './services/calendar-oauth.service';
import { CalendarToken, CalendarTokenSchema } from './schema/calendar-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarToken.name, schema: CalendarTokenSchema },
    ]),
  ],
  controllers: [CalendarTokenController, CalendarOAuthController],
  providers: [CalendarTokenService, McpCalendarIntegrationService, CalendarOAuthService],
  exports: [CalendarTokenService, McpCalendarIntegrationService, CalendarOAuthService],
})
export class CalendarModule {}
