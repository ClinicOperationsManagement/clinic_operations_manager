import api from './api';
import type { LoginCredentials, ApiResponse, AuthResponse, User } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<any, ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }
    throw new Error(response.error || 'Login failed');
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  register: async (userData: Partial<User> & { password: string }): Promise<User> => {
    const response = await api.post<any, ApiResponse<{ user: User }>>('/auth/register', userData);
    if (response.success && response.data) {
      return response.data.user;
    }
    throw new Error(response.error || 'Registration failed');
  },

  changePassword: async (passwords: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    const response = await api.put<any, ApiResponse<any>>('/auth/change-password', passwords);
    if (!response.success) {
      throw new Error(response.error || 'Password change failed');
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<any, ApiResponse<{ user: User }>>('/auth/me');
    if (response.success && response.data) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    throw new Error(response.error || 'Failed to get user info');
  },
};
