export interface SignInResponse {
  token: string;
  sessionId: string;
  status: string;
  id?: string;
  userId?: string;
}
