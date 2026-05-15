import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersistenceModule } from './module/persistance/persistance.module';
import { ProductsModule } from './module/products/products.module';
import { PaymentsModule } from './module/payments/payments.module';
import { AuthModule } from './module/auth/auth.module';
import { FirebaseAdminModule } from './common/firebase/firebase-admin.module';
import dbConfig from './module/persistance/db-config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [dbConfig],
      isGlobal: true,
    }),
    PersistenceModule,
    FirebaseAdminModule,
    AuthModule,
    ProductsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
