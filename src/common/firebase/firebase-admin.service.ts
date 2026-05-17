import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SERVICE_ACCOUNT_FILE = join(
  process.cwd(),
  process.env.SERVICE_ACCOUNT_FILE_PATH ?? 'serviceAccountKey.json',
);

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  onModuleInit() {
    if (admin.apps.length > 0) {
      return;
    }

    const serviceAccount = this.loadServiceAccount();
    if (!serviceAccount) {
      this.logger.warn(
        'Firebase Admin no inicializado: coloca serviceAccountKey.json en la raíz del proyecto ' +
          'o define FIREBASE_SERVICE_ACCOUNT_JSON como variable de entorno.',
      );
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log('Firebase Admin SDK inicializado correctamente');
    } catch (err) {
      this.logger.error(
        'Error al inicializar Firebase Admin',
        err instanceof Error ? err.message : err,
      );
    }
  }

  /**
   * Intenta cargar la cuenta de servicio:
   *  1. Archivo `serviceAccountKey.json` en la raíz del proyecto (dev local).
   *  2. Variable de entorno `FIREBASE_SERVICE_ACCOUNT_JSON` (producción / CI).
   */
  private loadServiceAccount(): admin.ServiceAccount | null {
    if (existsSync(SERVICE_ACCOUNT_FILE)) {
      try {
        const raw = readFileSync(SERVICE_ACCOUNT_FILE, 'utf-8');
        this.logger.log('Cuenta de servicio cargada desde serviceAccountKey.json');
        return JSON.parse(raw) as admin.ServiceAccount;
      } catch (err) {
        this.logger.error(
          'serviceAccountKey.json encontrado pero no se pudo parsear',
          err instanceof Error ? err.message : err,
        );
      }
    }

    const envRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (envRaw?.trim()) {
      try {
        return JSON.parse(envRaw) as admin.ServiceAccount;
      } catch (err) {
        this.logger.error(
          'FIREBASE_SERVICE_ACCOUNT_JSON no es un JSON válido',
          err instanceof Error ? err.message : err,
        );
      }
    }

    return null;
  }

  isReady(): boolean {
    return admin.apps.length > 0;
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.isReady()) {
      throw new InternalServerErrorException(
        'Firebase Admin no está configurado. Coloca serviceAccountKey.json en la raíz o define FIREBASE_SERVICE_ACCOUNT_JSON.',
      );
    }
    return admin.auth().verifyIdToken(idToken);
  }
}
