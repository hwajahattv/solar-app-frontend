export interface SessionStatus {
  configured: boolean;
  authenticated: boolean;
  username?: string;
  uid?: string;
  expiresAt?: string;
  error?: string;
}
