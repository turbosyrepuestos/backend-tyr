import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  senderName?: string;
  senderEmail?: string;
}

@Injectable()
export class BrevoService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY ?? '';
    this.apiUrl =
      process.env.BREVO_API_URL ??
      'https://api.brevo.com/v3/smtp/email';
  }

  async sendEmail(params: SendEmailParams): Promise<void> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'BREVO_API_KEY no está configurada; no se pueden enviar correos',
      );
    }

    const {
      to,
      subject,
      htmlContent,
      senderName = 'Turbos y Repuestos',
      senderEmail = process.env.BREVO_SENDER_EMAIL,
    } = params;

    if (!senderEmail) {
      throw new InternalServerErrorException(
        'BREVO_SENDER_EMAIL no está configurada',
      );
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: to,
            },
          ],
          subject,
          htmlContent,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status !== 201) {
        throw new InternalServerErrorException('Error al enviar el email');
      }
    } catch (error) {
      console.error(
        'Error al enviar email con Brevo:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('No se pudo enviar el email');
    }
  }

  async sendOtpEmail(
    email: string,
    code: string,
    type: 'login' | 'password_recovery' = 'login',
    templateConfig?: {
      subject?: string;
      htmlContent?: string;
      senderName?: string;
      senderEmail?: string;
    },
  ): Promise<void> {
    const isRecovery = type === 'password_recovery';
    const defaultTitle = isRecovery
      ? 'Recuperación de cuenta'
      : 'Código de verificación';
    const defaultMessage = isRecovery
      ? 'Has solicitado recuperar tu contraseña en <strong>Turbos y Repuestos</strong>. Confirma que eres tú con el siguiente código:'
      : 'Has solicitado un código para acceder a tu cuenta en <strong>Turbos y Repuestos</strong>. Usa el código a continuación:';

    let subject = templateConfig?.subject || `${defaultTitle} | Turbos y Repuestos`;
    let htmlContent = templateConfig?.htmlContent;

    if (htmlContent) {
      // Reemplazar placeholders en la plantilla personalizada
      htmlContent = htmlContent
        .replace(/{{code}}/g, code)
        .replace(/{{message}}/g, defaultMessage)
        .replace(/{{title}}/g, defaultTitle);
    } else {
      // Plantilla alineada con marca Turbos y Repuestos (industrial, alto contraste)
      htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${defaultTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap');

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      width: 100%;
      background-color: #f4f4f5;
      padding: 32px 16px 48px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      border: 1px solid #e4e4e7;
    }

    .header {
      background-color: #ffffff;
      padding: 28px 32px 24px;
      text-align: center;
      border-bottom: 1px solid #e4e4e7;
    }

    .logo {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #000000;
      margin: 0;
      line-height: 1.3;
      text-transform: uppercase;
    }

    .logo-sub {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.28em;
      color: #71717a;
      margin: 8px 0 0;
      text-transform: uppercase;
    }

    .content {
      padding: 36px 32px 40px;
      text-align: center;
    }

    .kicker {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: #eab308;
      text-transform: uppercase;
      margin: 0 0 12px;
    }

    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #000000;
      margin: 0 0 16px;
      line-height: 1.25;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .lead {
      color: #52525b;
      line-height: 1.65;
      font-size: 15px;
      margin: 0 0 28px;
      text-align: center;
    }

    .otp-card {
      margin: 0 auto;
      max-width: 360px;
      background: linear-gradient(145deg, #18181b 0%, #0a0a0a 100%);
      border-radius: 12px;
      padding: 28px 24px;
      border: 2px solid #27272a;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }

    .otp-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: #a1a1aa;
      text-transform: uppercase;
      margin: 0 0 14px;
    }

    .otp-code {
      font-size: 40px;
      font-weight: 800;
      color: #eab308;
      letter-spacing: 0.35em;
      margin: 0;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }

    .validity-note {
      font-size: 13px;
      color: #71717a;
      margin: 28px 0 0;
      line-height: 1.5;
    }

    .disclaimer {
      font-size: 13px;
      color: #a1a1aa;
      margin: 20px 0 0;
      line-height: 1.5;
    }

    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #eab308 0%, #ca8a04 100%);
      width: 100%;
    }

    .footer {
      background-color: #27272a;
      padding: 26px 28px;
      text-align: center;
    }

    .footer-brand {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: #ffffff;
      text-transform: uppercase;
      margin: 0 0 8px;
    }

    .footer-copy {
      font-size: 12px;
      color: #a1a1aa;
      margin: 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="accent-bar"></div>
      <div class="header">
        <p class="logo">Turbos y Repuestos</p>
        <p class="logo-sub">Potencia · Precisión · Confianza</p>
      </div>
      <div class="content">
        <p class="kicker">Seguridad</p>
        <h1>${defaultTitle}</h1>
        <p class="lead">${defaultMessage}</p>
        <div class="otp-card">
          <p class="otp-label">Tu código de acceso</p>
          <p class="otp-code">${code}</p>
        </div>
        <p class="validity-note">Este código caduca en <strong style="color:#18181b;">10 minutos</strong> por tu seguridad.</p>
        <p class="disclaimer">Si no realizaste esta solicitud, ignora este mensaje. Tu cuenta permanece protegida.</p>
      </div>
      <div class="footer">
        <p class="footer-brand">Turbos y Repuestos</p>
        <p class="footer-copy">© ${new Date().getFullYear()} Turbos y Repuestos. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    await this.sendEmail({
      to: email,
      subject,
      htmlContent,
      senderName: templateConfig?.senderName ?? 'Turbos y Repuestos',
      senderEmail: templateConfig?.senderEmail,
    });
  }
}
