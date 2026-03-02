import api from './api';

export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const authService = {
  register: async (data: RegisterData): Promise<string> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    const authData = response.data;
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    return authData;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'GLOBAL_ADMIN' || user?.role === 'ADMIN';
  },

  isGlobalAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'GLOBAL_ADMIN';
  },

  getGitHubOAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await api.get('/auth/github/oauth-url');
    return response.data;
  },

  handleGitHubCallback: async (code: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/github/callback', { code });
    const authData = response.data;
    
    // Store token and user data if login successful
    if (authData.token) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData));
    }
    
    return authData;
  },
};
