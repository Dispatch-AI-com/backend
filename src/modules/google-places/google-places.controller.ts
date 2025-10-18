import { Controller, Get, Query } from '@nestjs/common';

import { GooglePlacesService } from './google-places.service';

@Controller('places')
export class GooglePlacesController {
  constructor(private readonly svc: GooglePlacesService) {}

  @Get('autocomplete')
  async autocomplete(
    @Query('input') input: string,
    @Query('sessiontoken') sessiontoken?: string,
    @Query('types') types?: string,
    @Query('country') country?: string,
  ): Promise<unknown> {
    return this.svc.autocomplete({ input, sessiontoken, types, country });
  }

  @Get('details')
  async details(
    @Query('place_id') place_id: string,
    @Query('fields') fields?: string,
  ): Promise<unknown> {
    return this.svc.details({ place_id, fields });
  }
}
