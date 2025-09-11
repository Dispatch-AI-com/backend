import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { JWT_EXPIRATION_TIME } from '@/modules/auth/auth.config';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { GoogleStrategy } from '@/modules/auth/strategies/google.strategy';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { DatabaseModule } from '@/modules/database/database.module';
import { User, userSchema } from '@/modules/user/schema/user.schema';
import { UserModule } from '@/modules/user/user.module';
import { VerificationGuard } from '@/common/guards/verification.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'your_jwt_secret',
        signOptions: { expiresIn: JWT_EXPIRATION_TIME },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: userSchema }]),
    DatabaseModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, VerificationGuard],
  exports: [AuthService, VerificationGuard],
})
export class AuthModule {}
