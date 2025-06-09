import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  ServiceLocationMapping,
  ServiceLocationMappingSchema,
} from './schema/service-location-mapping.schema';
import { ServiceLocationMappingController } from './service-location-mapping.controller';
import { ServiceLocationMappingService } from './service-location-mapping.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ServiceLocationMapping.name,
        schema: ServiceLocationMappingSchema,
      },
    ]),
  ],
  controllers: [ServiceLocationMappingController],
  providers: [ServiceLocationMappingService],
  exports: [ServiceLocationMappingService],
})
export class ServiceLocationMappingModule {}
