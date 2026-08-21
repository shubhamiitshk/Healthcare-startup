export type UserData = {
  uid: string;
  email?: string;
  phone_number?: string;
  name?: string;
  picture?: string;
  iss?: string;
  aud?: string;
  auth_time?: number;
  user_id?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  firebase?: {
    identities: Record<string, unknown>;
    sign_in_provider: string;
  };
};

declare global {
  namespace Express {
    interface Request {
      user?: UserData;
    }
  }
}

export {};
