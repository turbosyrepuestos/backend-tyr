import { Injectable, Logger } from '@nestjs/common';
import { EpaycoService } from './epayco.service';

/** Payload típico de la URL de confirmación ePayco (GET o POST). */
export type EpaycoConfirmationPayload = Record<
  string,
  string | number | undefined
>;

const APPROVED_COD = 1;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly epaycoService: EpaycoService) {}

  /**
   * Procesa la notificación: revalida contra la API con ref_payco y ejecuta lógica si aprobado.
   */
  async processEpaycoConfirmation(
    payload: EpaycoConfirmationPayload,
  ): Promise<{ status: string; verified: boolean; approved?: boolean }> {
    const refPayco = this.extractRefPayco(payload);
    if (!refPayco) {
      this.logger.warn('Confirmación ePayco sin x_ref_payco / ref_payco');
      return { status: 'ok', verified: false };
    }

    let remote: unknown;
    try {
      remote = await this.epaycoService.getChargeStatusByRefPayco(refPayco);
    } catch (err) {
      this.logger.error(
        `Error consultando transacción ref_payco=${refPayco}`,
        err instanceof Error ? err.stack : String(err),
      );
      return { status: 'ok', verified: false };
    }

    if (this.isSdkError(remote)) {
      this.logger.warn(
        `Respuesta ePayco con error para ref_payco=${refPayco}: ${JSON.stringify(remote)}`,
      );
      return { status: 'ok', verified: false };
    }

    const data = this.unwrapData(remote);
    const cod = this.parseCod(
      data.x_cod_respuesta ??
        data.x_cod_response ??
        payload.x_cod_respuesta ??
        payload.x_cod_response,
    );

    const approved = cod === APPROVED_COD;
    if (approved) {
      this.onPaymentApproved({ refPayco, payload, gatewayData: data });
    } else if (cod !== undefined) {
      this.logger.log(
        `Transacción ref_payco=${refPayco} no aprobada (x_cod_respuesta=${cod}). Respuesta: ${payload.x_respuesta ?? payload.x_response ?? ''}`,
      );
    }

    return { status: 'ok', verified: true, approved };
  }

  private extractRefPayco(
    payload: EpaycoConfirmationPayload,
  ): string | undefined {
    const raw = payload.x_ref_payco ?? payload.ref_payco;
    const s = raw !== undefined && raw !== null ? String(raw).trim() : '';
    return s || undefined;
  }

  private unwrapData(result: unknown): Record<string, unknown> {
    if (!result || typeof result !== 'object') {
      return {};
    }
    const obj = result as Record<string, unknown>;
    const inner = obj.data;
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      return inner as Record<string, unknown>;
    }
    return obj;
  }

  private isSdkError(result: unknown): boolean {
    if (!result || typeof result !== 'object') {
      return false;
    }
    return 'error' in result && result.error !== undefined;
  }

  private parseCod(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  /**
   * Aquí enlaza tu persistencia (pedido, suscripción, etc.) cuando el cobro queda aprobado.
   */
  protected onPaymentApproved(ctx: {
    refPayco: string;
    payload: EpaycoConfirmationPayload;
    gatewayData: Record<string, unknown>;
  }): void {
    const invoice = this.scalarForLog(
      ctx.payload.x_id_invoice ?? ctx.gatewayData.x_id_invoice,
    );
    this.logger.log(
      `Pago aprobado ref_payco=${ctx.refPayco} factura/pedido=${invoice}`,
    );
    // Ejemplo: void this.ordersService.markPaidByInvoice(invoice, ctx.refPayco);
  }

  private scalarForLog(value: unknown): string {
    if (value === undefined || value === null) {
      return 'n/a';
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
    return 'n/a';
  }
}
