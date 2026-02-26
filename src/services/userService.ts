import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UserStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export const userService = {
  getPendingUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/pending');
    return response.data;
  },

  approveUser: async (userId: string, status: 'APPROVED' | 'REJECTED'): Promise<User> => {
    const response = await api.post('/users/approve', { userId, status });
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },
};
