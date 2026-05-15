import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RegisterDto,
  GenerateOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  VerifyOtpResponseDto,
} from '../../../module/auth/dto';

/**
 * Decorador para documentar el endpoint de registro de usuario
 */
export function DocRegister() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrar usuario',
      description:
        'Registra un nuevo usuario en el sistema. El usuario recibirá un código de verificación por email después del registro.',
    }),
    ApiBody({ type: RegisterDto }),
    ApiResponse({
      status: 201,
      description: 'Usuario registrado exitosamente',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              username: { type: 'string', example: 'juan' },
              lastname: { type: 'string', example: 'Pérez' },
              email: { type: 'string', example: 'juan@ejemplo.com' },
              role: { type: 'string', example: 'user' },
              country: { type: 'string', example: 'Colombia' },
              city: { type: 'string', example: 'Bogotá' },
              phone: {
                type: 'object',
                properties: {
                  countryCode: { type: 'string', example: '+57' },
                  phoneNumber: { type: 'string', example: '3001234567' },
                },
              },
              photoUrl: {
                type: 'string',
                example: 'https://example.com/photo.jpg',
              },
            },
          },
          access_token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refresh_token: {
            type: 'string',
            example: 'abc123def456ghi789...',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Datos inválidos o el email ya está registrado',
    }),
    ApiResponse({
      status: 500,
      description: 'Error interno del servidor durante el registro',
    }),
  );
}

/**
 * Decorador para documentar el endpoint de generación de OTP
 */
export function DocGenerateOtp() {
  return applyDecorators(
    ApiOperation({
      summary: 'Generar código OTP',
      description:
        'Paso 1 del login: Genera y envía un código OTP de 6 dígitos al email del usuario. El código expira en 10 minutos y permite máximo 3 intentos de verificación.',
    }),
    ApiBody({ type: GenerateOtpDto }),
    ApiResponse({
      status: 201,
      description: 'Código OTP enviado exitosamente al email',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Código OTP enviado exitosamente al email',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'El usuario no existe o email inválido',
    }),
    ApiResponse({
      status: 500,
      description: 'Error al generar o enviar el código OTP',
    }),
  );
}

/**
 * Decorador para documentar el endpoint de verificación de OTP y login
 */
export function DocVerifyOtp() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verificar OTP y completar login',
      description:
        'Paso 2 del login: Verifica el código OTP ingresado por el usuario. Si es válido, genera y retorna los tokens JWT (access_token y refresh_token) junto con los datos del usuario.',
    }),
    ApiBody({ type: VerifyOtpDto }),
    ApiResponse({
      status: 201,
      description: 'Código OTP verificado exitosamente. Login completado',
      type: VerifyOtpResponseDto,
    }),
    ApiResponse({
      status: 400,
      description:
        'Código inválido, expirado, usuario no encontrado o se excedieron los intentos (máximo 3)',
    }),
    ApiResponse({
      status: 500,
      description: 'Error al verificar el código OTP',
    }),
  );
}

/**
 * Decorador para documentar el endpoint de refresh token
 */
export function DocRefreshToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refrescar access token',
      description:
        'Refresca el access token usando un refresh token válido. Genera nuevos access_token y refresh_token, e invalida el refresh token anterior.',
    }),
    ApiBody({ type: RefreshTokenDto }),
    ApiResponse({
      status: 201,
      description: 'Tokens refrescados exitosamente',
      schema: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refresh_token: {
            type: 'string',
            example: 'abc123def456ghi789...',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Refresh token inválido, expirado o revocado',
    }),
    ApiResponse({
      status: 500,
      description: 'Error al refrescar el token',
    }),
  );
}

/**
 * Decorador para documentar el endpoint de logout
 */
export function DocLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cerrar sesión',
      description:
        'Cierra la sesión del usuario autenticado. Invalida el access token actual agregándolo a la blacklist y revoca todos los refresh tokens activos del usuario.',
    }),
    ApiResponse({
      status: 200,
      description: 'Logout exitoso. Tokens invalidados',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Logout exitoso. Tokens invalidados',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'No autorizado. Token inválido o no proporcionado',
    }),
    ApiResponse({
      status: 500,
      description: 'Error al realizar logout',
    }),
  );
}
