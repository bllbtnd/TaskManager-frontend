import api from './api';

export interface Project {
  id: string;
  name: string;
  description: string;
  githubUrl?: string;
  ownerId: string;
  ownerIds?: string[];
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequest {
  name: string;
  description: string;
  githubUrl?: string;
  memberIds?: string[];
}

export interface InviteUserRequest {
  email: string;
}

export interface MemberDetails {
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

export const projectService = {
  createProject: async (data: ProjectRequest): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  getUserProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  updateProject: async (id: string, data: ProjectRequest): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  inviteUser: async (projectId: string, data: InviteUserRequest): Promise<Project> => {
    const response = await api.post(`/projects/${projectId}/invite`, data);
    return response.data;
  },

  leaveProject: async (projectId: string): Promise<Project> => {
    const response = await api.post(`/projects/${projectId}/leave`);
    return response.data;
  },

  getProjectMembers: async (projectId: string): Promise<string[]> => {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  },

  removeUser: async (projectId: string, email: string): Promise<Project> => {
    const response = await api.delete(`/projects/${projectId}/members/${email}`);
    return response.data;
  },

  getProjectMembersDetails: async (projectId: string): Promise<MemberDetails[]> => {
    const response = await api.get(`/projects/${projectId}/members/details`);
    return response.data;
  },

  addProjectOwner: async (projectId: string, data: InviteUserRequest): Promise<Project> => {
    const response = await api.post(`/projects/${projectId}/owners/add`, data);
    return response.data;
  },

  removeProjectOwner: async (projectId: string, data: InviteUserRequest): Promise<Project> => {
    const response = await api.post(`/projects/${projectId}/owners/remove`, data);
    return response.data;
  },

  getProjectOwners: async (projectId: string): Promise<string[]> => {
    const response = await api.get(`/projects/${projectId}/owners`);
    return response.data;
  },
};
