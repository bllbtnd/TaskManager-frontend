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

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

export interface UserSettings {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
  totalProjects: number;
  totalTasks: number;
  totalTimeSpentMs: number;
  githubUsername?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface EmailPreferences {
  projectInvitations: boolean;
  taskAssignments: boolean;
  projectDeletion: boolean;
  taskStatusChanges: boolean;
  taskCompletion: boolean;
  taskDeadlineReminders: boolean;
  projectRemoval: boolean;
  weeklySummary: boolean;
  dailyDigest: boolean;
}

export interface UserProjectDetail {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    assignedToEmails: string[];
    deadline?: string;
    createdAt: string;
    completedAt?: string;
  }>;
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

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },

  getAdminStats: async (): Promise<{ users: number; projects: number; tasks: number }> => {
    const response = await api.get('/users/admin/stats');
    return response.data;
  },

  getCurrentUserProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  getUserSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/users/settings');
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/users/change-password', data);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserSettings> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  deleteAccount: async (data: DeleteAccountRequest): Promise<{ message: string }> => {
    const response = await api.delete('/users/me', { data });
    return response.data;
  },

  getUserProjects: async (userId: string): Promise<UserProjectDetail[]> => {
    const response = await api.get(`/admin/users/${userId}/projects`);
    return response.data;
  },

  getEmailPreferences: async (): Promise<EmailPreferences> => {
    const response = await api.get('/users/email-preferences');
    return response.data;
  },

  updateEmailPreferences: async (preferences: EmailPreferences): Promise<EmailPreferences> => {
    const response = await api.put('/users/email-preferences', preferences);
    return response.data;
  },
};
