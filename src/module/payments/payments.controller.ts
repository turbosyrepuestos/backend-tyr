import { Controller, Get, HttpCode, Logger, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Auth } from 'src/common/decorators/auth.decorator';
import { UserRole } from 'src/common/guard/roles.enum';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * URL de confirmación ePayco (POST o GET según configuración del checkout).
   * Debe ser pública (sin JWT). Configura la misma ruta en el panel ePayco.
   */
  @Auth({ roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER] })
  @Get('epayco/webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Webhook ePayco (confirmación de pago)',
    description:
      'Recibe x_ref_payco y otros parámetros, consulta el estado en la API y procesa aprobaciones.',
  })
  async handleEpaycoWebhook(@Req() req: Request) {
    const query = (req.query ?? {}) as Record<
      string,
      string | string[] | undefined
    >;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data: Record<string, string | number | undefined> = {};

    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      data[k] = Array.isArray(v) ? v[0] : v;
    }
    for (const [k, v] of Object.entries(body)) {
      if (v === undefined) continue;
      if (typeof v === 'string' || typeof v === 'number') {
        data[k] = v;
      }
    }

    this.logger.debug(`ePayco webhook keys: ${Object.keys(data).join(', ')}`);

    return this.paymentsService.processEpaycoConfirmation(data);
  }
}
