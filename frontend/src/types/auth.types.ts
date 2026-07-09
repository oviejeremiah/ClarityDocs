export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export type AuthApiError = {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
};
