import api from './api';

export interface GitHubIssue {
  id: string;
  projectId: string;
  gitHubIssueNumber: number;
  gitHubTitle: string;
  gitHubDescription: string;
  gitHubState: 'open' | 'closed';
  boardStatus?: 'TO_DO' | 'IN_PROGRESS' | 'DONE';
  gitHubUrl: string;
  gitHubLabels?: string;
  gitHubAssignee?: string;
  syncedAt: string;
}

export interface SyncGitHubRequest {
  githubToken?: string;
}

export const gitHubService = {
  getOAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await api.get('/auth/github/oauth-url');
    return response.data;
  },

  handleOAuthCallback: async (code: string): Promise<{ success: boolean; githubUsername: string }> => {
    const response = await api.post('/auth/github/callback', { code });
    return response.data;
  },

  disconnectGitHub: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/github/disconnect', {});
    return response.data;
  },

  syncGitHubIssues: async (projectId: string, githubToken?: string): Promise<{ success: boolean; message: string; issueCount: number }> => {
    const response = await api.post(`/projects/${projectId}/github/sync`, {
      githubToken: githubToken || '',
    });
    return response.data;
  },

  getGitHubIssues: async (projectId: string): Promise<GitHubIssue[]> => {
    const response = await api.get(`/projects/${projectId}/github/issues`);
    return response.data;
  },

  updateGitHubIssueStatus: async (
    projectId: string,
    issueId: string,
    state: 'open' | 'closed',
    boardStatus: 'TO_DO' | 'IN_PROGRESS' | 'DONE'
  ): Promise<{ success: boolean; message: string; state: 'open' | 'closed'; boardStatus: 'TO_DO' | 'IN_PROGRESS' | 'DONE' }> => {
    const response = await api.patch(`/projects/${projectId}/github/issues/${issueId}/status`, {
      state,
      boardStatus,
    });
    return response.data;
  },

  createGitHubIssue: async (projectId: string, taskId: string, title: string, body: string): Promise<{ success: boolean; message: string; issueNumber: number; issueUrl: string }> => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/github/create-issue`, {
      title,
      body,
    });
    return response.data;
  },

  closeGitHubIssue: async (projectId: string, taskId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/github/close-issue`, {});
    return response.data;
  },
};
