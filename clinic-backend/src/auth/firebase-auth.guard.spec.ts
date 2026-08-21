jest.mock('./firebase.config', () => ({
  firebaseAdmin: {
    auth: jest.fn(),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { firebaseAdmin } from './firebase.config';

const verifyIdTokenMock = firebaseAdmin.auth as unknown as jest.Mock;

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;

  const mockContext = (headers: Record<string, string>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    verifyIdTokenMock.mockReset();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [FirebaseAuthGuard],
    }).compile();
    guard = moduleRef.get(FirebaseAuthGuard);
  });

  it('rejects when no Authorization header is present', async () => {
    await expect(guard.canActivate(mockContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it('rejects when Authorization header is not a Bearer token', async () => {
    const innerVerify = jest.fn();
    verifyIdTokenMock.mockReturnValue({ verifyIdToken: innerVerify });
    await expect(
      guard.canActivate(mockContext({ authorization: 'Basic abc123' })),
    ).rejects.toThrow(UnauthorizedException);
    expect(innerVerify).not.toHaveBeenCalled();
  });

  it('rejects when the token cannot be verified', async () => {
    verifyIdTokenMock.mockReturnValue({
      verifyIdToken: jest.fn().mockRejectedValue(new Error('bad token')),
    });
    await expect(
      guard.canActivate(mockContext({ authorization: 'Bearer bogus' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('attaches the decoded token to req.user on success', async () => {
    const decoded = { uid: 'user-1', email: 'a@b.com' };
    verifyIdTokenMock.mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue(decoded),
    });
    const req: { headers: Record<string, string>; user?: unknown } = {
      headers: { authorization: 'Bearer good-token' },
    };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
        getNext: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const ok = await guard.canActivate(ctx);
    expect(ok).toBe(true);
    expect(req.user).toEqual(decoded);
  });
});
