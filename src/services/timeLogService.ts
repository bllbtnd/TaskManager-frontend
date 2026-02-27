import api from './api';

export interface TimeLog {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  durationMs: number;
}

export const getUserTimeLogs = async (startDate: string, endDate: string): Promise<TimeLog[]> => {
  const response = await api.get('/timelogs/user', {
    params: { startDate, endDate }
  });
  return response.data;
};

export const getProjectTimeLogs = async (projectId: string, startDate: string, endDate: string): Promise<TimeLog[]> => {
  const response = await api.get(`/timelogs/project/${projectId}`, {
    params: { startDate, endDate }
  });
  return response.data;
};

export const getTaskTimeLogs = async (taskId: string): Promise<TimeLog[]> => {
  const response = await api.get(`/timelogs/task/${taskId}`);
  return response.data;
};
