import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';
import { AppointmentsService } from './appointments/appointments.service';

const rawOrigins = process.env.CORS_ORIGINS;
const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
const defaultOrigins = isProd
  ? []
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
const allowedOrigins = rawOrigins
  ? rawOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  : defaultOrigins;

@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class AppGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @SubscribeMessage('schedule-queue-status')
  async onScheduleQueue(
    client: Socket,
    @MessageBody() payload: { scheduleId: string; date: string },
  ) {
    const { scheduleId, date } = payload;
    const total = await this.appointmentsService.countBySchedule(
      scheduleId,
      date,
    );
    const serving = await this.appointmentsService.getCurrentServing(
      scheduleId,
      date,
    );
    const room = `queue-updated-${scheduleId}-${date}`;
    this.server.emit(room, { totalQueue: total, currentServing: serving });
  }

  @SubscribeMessage('check-queue-status')
  async onCheckQueueStatus(
    client: Socket,
    @MessageBody() payload: { appointmentId: string },
  ) {
    const { appointmentId } = payload;
    const peopleAhead =
      await this.appointmentsService.getPeopleAhead(appointmentId);
    this.server.emit(`queue-position-updated-${appointmentId}`, {
      appointmentId,
      peopleAhead,
    });
  }
}
