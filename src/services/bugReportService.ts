import api from './api';

export interface BugReport {
  id: string;
  title: string;
  description: string;
  type: 'BUG_REPORT' | 'FEATURE_REQUEST';
  status: string;
  createdById: string;
  createdByEmail: string;
  createdAt: string;
}

export interface BugReportRequest {
  title: string;
  description: string;
  type: 'BUG_REPORT' | 'FEATURE_REQUEST';
}

export const bugReportService = {
  createReport: async (data: BugReportRequest): Promise<BugReport> => {
    const response = await api.post('/bug-reports', data);
    return response.data;
  },

  getAllReports: async (): Promise<BugReport[]> => {
    const response = await api.get('/bug-reports');
    return response.data;
  },

  resolveReport: async (reportId: string): Promise<BugReport> => {
    const response = await api.put(`/bug-reports/${reportId}/resolve`);
    return response.data;
  },
};
