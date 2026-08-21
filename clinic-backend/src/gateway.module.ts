import { Global, Module, forwardRef } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { AppointmentsModule } from './appointments/appointments.module';

@Global()
@Module({
  imports: [forwardRef(() => AppointmentsModule)],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
