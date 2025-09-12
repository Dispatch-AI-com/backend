import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VerificationGuard } from '@/common/guards/verification.guard';
import { UserModule } from '@/modules/user/user.module';

import { Service, ServiceSchema } from './schema/service.schema';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
    UserModule,
  ],
  controllers: [ServiceController],
  providers: [ServiceService, VerificationGuard],
  exports: [ServiceService],
})
export class ServiceModule {}
