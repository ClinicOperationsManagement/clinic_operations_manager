import api from './api';
import type { User, ApiResponse } from '../types';

export const userService = {
  getUsers: async (params?: any) => {
    const response = await api.get<any, ApiResponse<User[]>>('/users', { params });
    return response;
  },

  getUserById: async (id: string) => {
    const response = await api.get<any, ApiResponse<{ user: User }>>(`/users/${id}`);
    return response.data?.user;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.put<any, ApiResponse<{ user: User }>>(`/users/${id}`, userData);
    return response.data?.user;
  },

  deleteUser: async (id: string) => {
    await api.delete(`/users/${id}`);
  },
};
