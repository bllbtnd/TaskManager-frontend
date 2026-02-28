import api from './api';

export interface GitHubIssue {
  id: string;
  projectId: string;
  gitHubIssueNumber: number;
  gitHubTitle: string;
  gitHubDescription: string;
  gitHubState: 'open' | 'closed';
  gitHubUrl: string;
  gitHubLabels?: string;
  gitHubAssignee?: string;
  syncedAt: string;
}

export interface SyncGitHubRequest {
  githubToken?: string;
}

export const gitHubService = {
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
};
