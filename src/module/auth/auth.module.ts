import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { UtilsModule } from 'src/common/utils/utils.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from './entities/otp.entity';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './entities/refresh-token.entity';
import {
  TokenBlacklist,
  TokenBlacklistSchema,
} from './entities/token-blacklist.entity';
import { BrevoService } from 'src/common/utils/services/brevo.service';
import { RolesModule } from '../roles/roles.module';
import { ApiKeyModule } from 'src/common/utils/apikey/apikey.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-change-me-in-production',
      signOptions: {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY ??
          '30m') as unknown as number,
      },
    }),
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: TokenBlacklist.name, schema: TokenBlacklistSchema },
    ]),
    UtilsModule,
    forwardRef(() => UsersModule),
    RolesModule,
    ApiKeyModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, BrevoService],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
