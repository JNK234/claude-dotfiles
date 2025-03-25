import ApiService from './ApiService';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  role: string;
  created_at: string;
}

class AuthService extends ApiService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', credentials);
    // Store token in local storage
    localStorage.setItem('token', response.access_token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  logout(): void {
    localStorage.removeItem('token');
    // Redirect to login page
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export default new AuthService();