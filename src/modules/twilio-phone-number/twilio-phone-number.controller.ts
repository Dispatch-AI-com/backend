import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateTwilioPhoneNumberDto } from './dto/create-twilio-phone-number.dto';
import { TwilioPhoneNumberDocument } from './schema/twilio-phone-number.schema';
import { TwilioPhoneNumberService } from './twilio-phone-number.service';

@ApiTags('Twilio Phone Numbers')
@Controller('twilio-phone-numbers')
export class TwilioPhoneNumberController {
  constructor(
    private readonly twilioPhoneNumberService: TwilioPhoneNumberService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateTwilioPhoneNumberDto,
  ): Promise<TwilioPhoneNumberDocument> {
    return this.twilioPhoneNumberService.create(dto.phoneNumber);
  }

  @Get()
  async findAll(): Promise<TwilioPhoneNumberDocument[]> {
    return this.twilioPhoneNumberService.findAll();
  }

  @Get('available')
  async getAvailable(): Promise<TwilioPhoneNumberDocument | null> {
    return this.twilioPhoneNumberService.getAvailable();
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.twilioPhoneNumberService.delete(id);
    return { message: 'Phone number deleted successfully' };
  }
}
