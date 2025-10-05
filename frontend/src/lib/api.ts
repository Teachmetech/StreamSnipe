import axios from 'axios';
import type { Channel, Recording, Settings, SystemStatus, User } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
      username,
      password,
    });
    return data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};

// Channels
export const channelsApi = {
  getAll: async () => {
    const { data } = await api.get<Channel[]>('/channels');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<Channel>(`/channels/${id}`);
    return data;
  },
  create: async (channel: Partial<Channel>) => {
    const { data } = await api.post<Channel>('/channels', channel);
    return data;
  },
  update: async (id: string, updates: Partial<Channel>) => {
    const { data } = await api.patch<Channel>(`/channels/${id}`, updates);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/channels/${id}`);
  },
  checkLive: async (id: string) => {
    const { data } = await api.post<{ isLive: boolean }>(`/channels/${id}/check`);
    return data;
  },
  testChannel: async (id: string) => {
    const { data } = await api.post<any>(`/channels/${id}/test`);
    return data;
  },
};

// Recordings
export const recordingsApi = {
  getAll: async (limit?: number) => {
    const { data } = await api.get<Recording[]>('/recordings', {
      params: { limit },
    });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<Recording>(`/recordings/${id}`);
    return data;
  },
  start: async (options: {
    url: string;
    quality?: string;
    format?: string;
    title?: string;
    channelId?: string;
  }) => {
    const { data } = await api.post<Recording>('/recordings/start', options);
    return data;
  },
  stop: async (id: string) => {
    const { data } = await api.post<Recording>(`/recordings/${id}/stop`);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/recordings/${id}`);
  },
  download: (id: string) => {
    return `/api/recordings/${id}/download`;
  },
  uploadToCloud: async (id: string) => {
    const { data } = await api.post(`/recordings/${id}/upload`);
    return data;
  },
};

// Settings
export const settingsApi = {
  get: async () => {
    const { data } = await api.get<Settings>('/settings');
    return data;
  },
  update: async (settings: Partial<Settings>) => {
    const { data } = await api.put<Settings>('/settings', settings);
    return data;
  },
};

// Status
export const statusApi = {
  get: async () => {
    const { data } = await api.get<SystemStatus>('/status');
    return data;
  },
};

export default api;

