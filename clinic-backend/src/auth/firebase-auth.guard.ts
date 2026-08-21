import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { firebaseAdmin } from './firebase.config';
import type { UserData } from '../types/express';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.slice('Bearer '.length).trim();

    try {
      const decodedToken: UserData = await firebaseAdmin
        .auth()
        .verifyIdToken(token);
      request.user = decodedToken;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid authorization token');
    }
  }
}
