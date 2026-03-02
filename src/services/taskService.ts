import api from './api';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedToEmails?: string[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  timeSpentMs?: number;
  activeWorkMs?: number;
  timerStartedAt?: string;
  sessionStartedAt?: string;
  pausedAt?: string;
  sessionActiveWorkMs?: number;
  timerActive?: boolean;
}

export interface TaskRequest {
  title: string;
  description: string;
  status?: TaskStatus;
  assignedToEmails?: string[];
  deadline?: string;
  timeSpentMs?: number;
  activeWorkMs?: number;
}

export const taskService = {
  createTask: async (projectId: string, data: TaskRequest): Promise<Task> => {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  getProjectTasks: async (projectId: string): Promise<Task[]> => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  updateTask: async (projectId: string, taskId: string, data: TaskRequest): Promise<Task> => {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },

  updateTaskStatus: async (projectId: string, taskId: string, status: TaskStatus): Promise<Task> => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, status, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  startTimer: async (projectId: string, taskId: string): Promise<Task> => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/timer/start`);
    return response.data;
  },

  pauseTimer: async (projectId: string, taskId: string): Promise<Task> => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/timer/pause`);
    return response.data;
  },

  resumeTimer: async (projectId: string, taskId: string): Promise<Task> => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/timer/resume`);
    return response.data;
  },

  stopTimer: async (projectId: string, taskId: string): Promise<Task> => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/timer/stop`);
    return response.data;
  },

  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  },
};
