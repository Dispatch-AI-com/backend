import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Service, ServiceSchema } from './schema/service.schema';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
