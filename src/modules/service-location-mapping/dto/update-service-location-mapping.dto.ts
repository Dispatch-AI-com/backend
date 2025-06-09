import { PartialType } from '@nestjs/swagger';

import { CreateServiceLocationMappingDto } from './create-service-location-mapping.dto';

export class UpdateServiceLocationMappingDto extends PartialType(
  CreateServiceLocationMappingDto,
) {}
