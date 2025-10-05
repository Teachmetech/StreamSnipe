import { create } from 'zustand';
import { Channel, Recording, Settings, SystemStatus, User } from '../types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string | null) => void;
  logout: () => void;

  // Channels
  channels: Channel[];
  setChannels: (channels: Channel[]) => void;
  updateChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;

  // Recordings
  recordings: Recording[];
  setRecordings: (recordings: Recording[]) => void;
  updateRecording: (recording: Recording) => void;
  removeRecording: (id: string) => void;

  // Settings
  settings: Settings | null;
  setSettings: (settings: Settings) => void;

  // Status
  status: SystemStatus | null;
  setStatus: (status: SystemStatus) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: localStorage.getItem('token'),
  setAuth: (user, token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  // Channels
  channels: [],
  setChannels: (channels) => set({ channels }),
  updateChannel: (channel) =>
    set((state) => ({
      channels: state.channels.map((c) => (c.id === channel.id ? channel : c)),
    })),
  removeChannel: (id) =>
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== id),
    })),

  // Recordings
  recordings: [],
  setRecordings: (recordings) => set({ recordings }),
  updateRecording: (recording) =>
    set((state) => {
      const exists = state.recordings.find((r) => r.id === recording.id);
      if (exists) {
        return {
          recordings: state.recordings.map((r) =>
            r.id === recording.id ? recording : r
          ),
        };
      } else {
        return {
          recordings: [recording, ...state.recordings],
        };
      }
    }),
  removeRecording: (id) =>
    set((state) => ({
      recordings: state.recordings.filter((r) => r.id !== id),
    })),

  // Settings
  settings: null,
  setSettings: (settings) => set({ settings }),

  // Status
  status: null,
  setStatus: (status) => set({ status }),

  // Theme
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return { theme: newTheme };
    }),
}));

