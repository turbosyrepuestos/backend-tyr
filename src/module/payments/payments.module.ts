import { Module } from '@nestjs/common';
import { EpaycoService } from './epayco.service';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [EpaycoService, PaymentsService],
  exports: [EpaycoService, PaymentsService],
})
export class PaymentsModule {}
