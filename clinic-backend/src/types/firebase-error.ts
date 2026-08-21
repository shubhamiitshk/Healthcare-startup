export interface FirebaseAuthError extends Error {
  code: string;
  message: string;
  email?: string;
  phoneNumber?: string;
  uid?: string;
}

export function isFirebaseAuthError(err: unknown): err is FirebaseAuthError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string' &&
    typeof (err as { message?: unknown }).message === 'string'
  );
}
