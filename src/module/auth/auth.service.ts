import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ForgotPasswordDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpResponseDto,
} from './dto/index';
import { UserService } from 'src/module/users/services/users.service';
import { HashService } from 'src/common/utils/services/hash.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, Token } from './interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from './entities/otp.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { BrevoService } from 'src/common/utils/services/brevo.service';
import { RoleService } from '../roles/services/role.service';
import { ApiKey } from 'src/common/utils/apikey/entities/apikey.entitie';
import * as crypto from 'crypto';
import { FirebaseAdminService } from 'src/common/firebase/firebase-admin.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly userService: UserService,
    private readonly brevoService: BrevoService,
    private readonly roleService: RoleService,
    private readonly firebaseAdminService: FirebaseAdminService,
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshToken>,
    @InjectModel(TokenBlacklist.name)
    private readonly tokenBlacklistModel: Model<TokenBlacklist>,
  ) {}

  async register(userRegister: RegisterDto, apiKey?: ApiKey) {
    try {
      await this.validateEmailForSignUp(userRegister.email);

      const hashedPassword = await this.hashService.hash(userRegister.password);

      const user = await this.userService.create({
        ...userRegister,
        password: hashedPassword,
      });

      await this.generateOtp(user.email, userRegister.password, apiKey);
      return {
        message: 'User registered successfully',
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      console.error('Error during user registration:', error);
      throw new InternalServerErrorException(
        'Something went wrong during registration',
      );
    }
  }

  async getTokens(jwtPayload: JwtPayload, userId?: string): Promise<Token> {
    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
      throw new Error('JWT_SECRET is not set');
    }

    // El JWT solo lleva identificador y rol; los permisos se validan en PermissionsGuard desde BD
    const jti = crypto.randomBytes(32).toString('hex');
    const payloadWithJti = { ...jwtPayload, jti };

    const accessTokenOptions = {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '30m',
    };

    const accessToken = await this.signToken(
      payloadWithJti,
      secretKey,
      accessTokenOptions,
    );

    // Generar refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';

    // Calcular fecha de expiración del refresh token
    const expiresAt = new Date();
    const expiryDays = parseInt(refreshTokenExpiry.replace('d', '')) || 7;
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Guardar refresh token en la base de datos si se proporciona userId
    if (userId) {
      // Revocar refresh tokens anteriores del usuario
      await this.refreshTokenModel.updateMany(
        { userId, isRevoked: false },
        { isRevoked: true },
      );

      // Guardar el nuevo refresh token
      await this.refreshTokenModel.create({
        userId,
        token: refreshToken,
        expiresAt,
        isRevoked: false,
      });
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async signToken(payload: JwtPayload, secretKey: string, options: any) {
    return await this.jwtService.signAsync(payload, {
      secret: secretKey,
      ...options,
    });
  }

  /**
   * Valida el ID token emitido por Firebase (Google) en el cliente y devuelve JWT
   * solo si ya existe un usuario en MongoDB con ese correo o con el mismo firebaseUid.
   */
  async loginWithGoogleIdToken(idToken: string): Promise<VerifyOtpResponseDto> {
    let decoded: Awaited<
      ReturnType<FirebaseAdminService['verifyIdToken']>
    >;
    try {
      decoded = await this.firebaseAdminService.verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException(
        'Token de Firebase inválido, expirado o no pertenece a este proyecto',
      );
    }

    if (decoded.firebase?.sign_in_provider !== 'google.com') {
      throw new UnauthorizedException(
        'Solo se admite inicio de sesión con Google',
      );
    }

    if (!decoded.email_verified) {
      throw new UnauthorizedException(
        'Debes usar una cuenta de Google con correo verificado',
      );
    }

    const email = decoded.email?.toLowerCase()?.trim();
    if (!email) {
      throw new UnauthorizedException(
        'El token no incluye un correo electrónico',
      );
    }

    const firebaseUid = decoded.uid;

    let user =
      (await this.userService.findOneByFirebaseUid(firebaseUid)) ??
      (await this.userService.findOneByEmail(email));

    if (!user) {
      throw new UnauthorizedException(
        'No existe una cuenta con este correo. Regístrate primero en la plataforma.',
      );
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('Cuenta deshabilitada');
    }

    const userId = String(user._id);

    if (!user.firebaseUid) {
      await this.userService.linkFirebaseUid(userId, firebaseUid);
    }

    const permissions = await this.roleService.getPermissionsByRoleName(
      user.role,
    );

    const tokens = await this.getTokens(
      {
        sub: userId,
        username: user.username,
        role: user.role,
      },
      userId,
    );

    return {
      message: 'Sesión iniciada con Google correctamente',
      userId,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions,
      ...tokens,
    };
  }

  async validateEmailForSignUp(email: string): Promise<boolean | undefined> {
    const user = await this.userService.findOneByEmailRegister(email);

    if (user) {
      throw new HttpException('Email already exists!', 400);
    }
    return true;
  }

  /**
   * Genera un código OTP de 6 dígitos y lo envía por email usando Brevo
   */
  async generateOtp(
    email: string,
    password: string,
    apiKey?: ApiKey,
  ): Promise<{ message: string }> {
    try {
      // Verificar si el usuario existe y la contraseña es correcta
      const user = await this.userService.findOneByEmail(email);
      if (!user) {
        throw new BadRequestException(
          'El usuario no existe o la contraseña es incorrecta',
        );
      }

      // Verificar si la contraseña es correcta
      const isPasswordCorrect = await this.hashService.compare(
        password,
        user.password,
      );
      if (!isPasswordCorrect) {
        throw new BadRequestException('La contraseña es incorrecta');
      }

      // Generar código OTP de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Calcular fecha de expiración (10 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Eliminar OTPs anteriores no verificados del mismo email
      await this.otpModel.deleteMany({ email, verified: false });

      // Guardar el OTP en la base de datos
      await this.otpModel.create({
        email,
        code,
        expiresAt,
        verified: false,
        attempts: 0,
      });

      // Obtener configuración de plantilla si existe
      const templateConfig = apiKey?.emailTemplates instanceof Map 
        ? apiKey.emailTemplates.get('login') 
        : (apiKey?.emailTemplates as any)?.['login'];

      // Enviar el OTP por email usando Brevo
      await this.brevoService.sendOtpEmail(email, code, 'login', templateConfig);

      return {
        message: 'Código OTP enviado exitosamente al email',
      };
    } catch (error) {
      console.error('Error al generar OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al generar el código OTP');
    }
  }

  /**
   * Verifica el código OTP ingresado por el usuario.
   * Si es para login, genera tokens.
   * Si es para recuperación, permite el cambio de contraseña en el siguiente paso.
   */
  async verifyOtp(email: string, code: string): Promise<VerifyOtpResponseDto> {
    try {
      // Buscar el OTP más reciente para este email
      const otp = await this.otpModel
        .findOne({
          email,
          verified: false,
        })
        .sort({ createdAt: -1 });

      if (!otp) {
        throw new BadRequestException(
          'No se encontró un código OTP válido para este email',
        );
      }

      // Verificar si el OTP ha expirado
      if (new Date() > otp.expiresAt) {
        await this.otpModel.deleteOne({ _id: otp._id });
        throw new BadRequestException('El código OTP ha expirado');
      }

      // Verificar el número de intentos (máximo 3)
      if (otp.attempts >= 3) {
        await this.otpModel.deleteOne({ _id: otp._id });
        throw new BadRequestException(
          'Has excedido el número máximo de intentos',
        );
      }

      // Verificar si el código es correcto
      if (otp.code !== code) {
        // Incrementar el contador de intentos
        otp.attempts += 1;
        await otp.save();

        const attemptsLeft = 3 - otp.attempts;
        throw new BadRequestException(
          `Código incorrecto. Te quedan ${attemptsLeft} intento(s)`,
        );
      }

      // Obtener el usuario
      const user = await this.userService.findOneByEmail(email);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Marcar el OTP como verificado
      otp.verified = true;
      await otp.save();

      // Si el OTP es para recuperación de contraseña, no generamos tokens de sesión todavía
      if (otp.type === 'password_recovery') {
        return {
          message:
            'Código de recuperación verificado exitosamente. Ahora puedes cambiar tu contraseña.',
          email: user.email,
          username: user.username,
          role: user.role,
        } as VerifyOtpResponseDto;
      }

      // Si es para login normal, generamos los tokens
      const permissions = await this.roleService.getPermissionsByRoleName(
        user.role,
      );

      const tokens = await this.getTokens(
        {
          sub: user.id,
          username: user.username,
          role: user.role,
        },
        user.id,
      );

      return {
        message: 'Código OTP verificado exitosamente. Login completado',
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        permissions,
        ...tokens,
      };
    } catch (error) {
      console.error('Error al verificar OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al verificar el código OTP',
      );
    }
  }

  /**
   * Refresca el access token usando un refresh token válido
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      // Buscar el refresh token en la base de datos
      const storedToken = await this.refreshTokenModel.findOne({
        token: refreshToken,
        isRevoked: false,
      });

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token inválido o revocado');
      }

      // Verificar si el refresh token ha expirado
      if (new Date() > storedToken.expiresAt) {
        await this.refreshTokenModel.updateOne(
          { _id: storedToken._id },
          { isRevoked: true },
        );
        throw new UnauthorizedException('Refresh token expirado');
      }

      // Obtener el usuario
      const user = await this.userService.findOneById(storedToken.userId);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Revocar el refresh token actual
      await this.refreshTokenModel.updateOne(
        { _id: storedToken._id },
        { isRevoked: true },
      );

      const tokens = await this.getTokens(
        {
          sub: user.id,
          username: user.username,
          role: user.role,
        },
        user.id,
      );

      return tokens;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al refrescar el token');
    }
  }

  /**
   * Realiza logout invalidando los tokens del usuario
   */
  async logout(
    accessToken: string,
    userId: string,
  ): Promise<{ message: string }> {
    try {
      // Decodificar el token para obtener su expiración
      let expiresAt: Date;
      try {
        const decoded = this.jwtService.decode(accessToken) as any;
        if (decoded && decoded.exp) {
          expiresAt = new Date(decoded.exp * 1000);
        } else {
          // Si no se puede decodificar, usar expiración por defecto
          expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        }
      } catch {
        expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      }

      // Agregar el access token a la blacklist
      await this.tokenBlacklistModel.create({
        token: accessToken,
        userId,
        expiresAt,
        type: 'access',
      });

      // Revocar todos los refresh tokens activos del usuario
      await this.refreshTokenModel.updateMany(
        { userId, isRevoked: false },
        { isRevoked: true },
      );

      return {
        message: 'Logout exitoso. Tokens invalidados',
      };
    } catch (error) {
      console.error('Error al hacer logout:', error);
      throw new InternalServerErrorException('Error al realizar logout');
    }
  }

  /**
   * Verifica si un token está en la blacklist
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.tokenBlacklistModel.findOne({ token });
    return !!blacklisted;
  }

  /**
   * Inicia el proceso de recuperación de contraseña enviando un OTP
   */
  async initiatePasswordRecovery(
    forgotPasswordDto: ForgotPasswordDto,
    apiKey?: ApiKey,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    try {
      // Verificar si el usuario existe
      const user = await this.userService.findOneByEmail(email);
      if (!user) {
        // Por seguridad, devolvemos un mensaje genérico aunque el usuario no exista
        return {
          message:
            'Si el correo está registrado, recibirás un código de recuperación',
        };
      }

      // Generar código OTP de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Calcular fecha de expiración (10 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Eliminar OTPs anteriores del mismo email y tipo recovery
      await this.otpModel.deleteMany({ email, type: 'password_recovery' });

      // Guardar el OTP en la base de datos
      await this.otpModel.create({
        email,
        code,
        expiresAt,
        verified: false,
        attempts: 0,
        type: 'password_recovery',
      });

      // Obtener configuración de plantilla si existe
      const templateConfig = apiKey?.emailTemplates instanceof Map 
        ? apiKey.emailTemplates.get('password_recovery') 
        : (apiKey?.emailTemplates as any)?.['password_recovery'];

      // Enviar el OTP por email indicando que es para recuperación
      await this.brevoService.sendOtpEmail(
        email,
        code,
        'password_recovery',
        templateConfig,
      );

      return {
        message: 'Código de recuperación enviado exitosamente al email',
      };
    } catch (error) {
      console.error('Error al iniciar recuperación:', error);
      throw new InternalServerErrorException(
        'Error al procesar la solicitud de recuperación',
      );
    }
  }

  /**
   * Cambia la contraseña después de haber verificado el OTP exitosamente.
   * Requiere que exista un OTP de recuperación ya marcado como verified: true.
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { email, newPassword } = resetPasswordDto;

    try {
      // Buscar el OTP de recuperación verificado
      const otp = await this.otpModel
        .findOne({
          email,
          verified: true,
          type: 'password_recovery',
        })
        .sort({ updatedAt: -1 });

      if (!otp) {
        throw new BadRequestException(
          'Debes verificar el código antes de cambiar la contraseña o el código ha expirado',
        );
      }

      // Obtener el usuario
      const user = await this.userService.findOneByEmail(email);
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Hashear la nueva contraseña
      const hashedPassword = await this.hashService.hash(newPassword);

      // Actualizar contraseña del usuario
      await this.userService.updatePassword(user.id, hashedPassword);

      // Eliminar OTP usado
      await this.otpModel.deleteOne({ _id: otp._id });

      return {
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error al actualizar la contraseña',
      );
    }
  }
}
