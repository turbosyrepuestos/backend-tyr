import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRequire } from 'node:module';

const requireEpayco = createRequire(__filename);
const epayco = requireEpayco(
  'epayco-sdk-node',
) as typeof import('epayco-sdk-node');

type EpaycoClientInstance = ReturnType<typeof epayco>;

@Injectable()
export class EpaycoService {
  private readonly logger = new Logger(EpaycoService.name);
  private client: EpaycoClientInstance | null = null;

  constructor(private readonly config: ConfigService) {}

  /**
   * Cliente SDK (lazy). Requiere EPAYCO_PUBLIC_KEY y EPAYCO_PRIVATE_KEY.
   */
  private getClient(): EpaycoClientInstance {
    if (this.client) {
      return this.client;
    }
    const apiKey = this.config.get<string>('EPAYCO_PUBLIC_KEY')?.trim();
    const privateKey = this.config.get<string>('EPAYCO_PRIVATE_KEY')?.trim();
    const testRaw = this.config.get<string>('EPAYCO_TEST', 'true');
    const test = testRaw === 'true' || testRaw === '1';

    if (!apiKey || !privateKey) {
      this.logger.error(
        'Faltan EPAYCO_PUBLIC_KEY o EPAYCO_PRIVATE_KEY en el entorno',
      );
      throw new Error('Epayco no está configurado');
    }

    this.client = epayco({
      apiKey,
      privateKey,
      lang: 'ES',
      test,
    });
    return this.client;
  }

  /**
   * Consulta el estado en ePayco por ref_payco (x_ref_payco en el webhook).
   * El SDK usa GET /restpagos/transaction/response.json?ref_payco=...
   */
  async getChargeStatusByRefPayco(refPayco: string): Promise<unknown> {
    return this.getClient().charge.get(refPayco);
  }
}
