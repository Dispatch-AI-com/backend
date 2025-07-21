import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { JWT_EXPIRATION_TIME } from '@/modules/auth/auth.config';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { StatusGuard } from '@/modules/auth/guards/status.guard';
import { AuthJwtService } from '@/modules/auth/services/jwt.service';
import { GoogleStrategy } from '@/modules/auth/strategies/google.strategy';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { LocalStrategy } from '@/modules/auth/strategies/local.strategy';
import { DatabaseModule } from '@/modules/database/database.module';
import { User, userSchema } from '@/modules/user/schema/user.schema';
import { UserModule } from '@/modules/user/user.module';

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
  providers: [
    AuthService,
    AuthJwtService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    RolesGuard,
    StatusGuard,
  ],
  exports: [AuthService, AuthJwtService, RolesGuard, StatusGuard],
})
export class AuthModule {}
