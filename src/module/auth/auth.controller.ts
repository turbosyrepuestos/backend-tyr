import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  GenerateOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  FirebaseGoogleDto,
} from './dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';
import type { Request as ExpressRequest } from 'express';
import {
  DocRegister,
  DocGenerateOtp,
  DocVerifyOtp,
  DocRefreshToken,
  DocLogout,
} from './decorators/auth-swagger.decorator';

import { ApiKey } from 'src/common/utils/apikey/entities/apikey.entitie';

interface RequestWithApiKey extends ExpressRequest {
  apiKey?: ApiKey;
}

interface RequestWithUser extends ExpressRequest {
  user?: {
    sub: string;
  };
}

@ApiTags('authentication')
@Controller('auth')
// @UseGuards(ApiKeyGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @DocRegister()
  async registerUser(
    @Body() createAuthDto: RegisterDto,
    @Request() req: RequestWithApiKey,
  ) {
    const apiKey = req.apiKey;
    const token = await this.authService.register(createAuthDto, apiKey);
    return token;
  }

  @Post('otp/login')
  @DocGenerateOtp()
  async generateOtp(
    @Body() generateOtpDto: GenerateOtpDto,
    @Request() req: RequestWithApiKey,
  ) {
    const apiKey = req.apiKey;
    return await this.authService.generateOtp(
      generateOtpDto.email,
      generateOtpDto.password,
      apiKey,
    );
  }

  @Post('otp/verify')
  @DocVerifyOtp()
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyOtp(
      verifyOtpDto.email,
      verifyOtpDto.code,
    );
  }

  @Post('google')
  @ApiOperation({
    summary:
      'Login con Google (ID token de Firebase desde el SDK del frontend)',
    description:
      'Envía el idToken obtenido tras signInWithPopup / signInWithCredential. El usuario debe existir previamente en la base de datos (mismo email o firebaseUid vinculado).',
  })
  @ApiResponse({
    status: 200,
    description:
      'JWT access + refresh y permisos (misma forma que verify OTP).',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o usuario no registrado.',
  })
  async loginGoogle(@Body() dto: FirebaseGoogleDto) {
    return await this.authService.loginWithGoogleIdToken(dto.idToken);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @DocRefreshToken()
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @DocLogout()
  async logout(@Request() req: RequestWithUser) {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    const userId = req.user?.sub;

    if (!accessToken || !userId) {
      throw new BadRequestException('Token o usuario no encontrado');
    }

    return await this.authService.logout(accessToken, userId);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Request() req: RequestWithApiKey,
  ) {
    const apiKey = req.apiKey;
    return await this.authService.initiatePasswordRecovery(
      forgotPasswordDto,
      apiKey,
    );
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
