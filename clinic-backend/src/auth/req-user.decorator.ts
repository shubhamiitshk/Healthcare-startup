import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserData } from '../types/express';

export const ReqUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserData => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new Error('Request user not set - auth guard missing?');
    }
    return request.user;
  },
);
