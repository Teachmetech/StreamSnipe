export interface Channel {
  id: string;
  url: string;
  platform: string;
  name: string;
  autoRecord: boolean;
  quality: string;
  enabled: boolean;
  lastChecked?: string;
  isLive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recording {
  id: string;
  channelId?: string;
  url: string;
  platform: string;
  title: string;
  status: 'recording' | 'completed' | 'failed' | 'stopped';
  quality: string;
  format: string;
  filePath?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
  uploadedToCloud?: boolean;
}

export interface Settings {
  authEnabled: boolean;
  recordingsPath: string;
  s3Enabled: boolean;
  s3Bucket?: string;
  s3Region?: string;
  defaultQuality: string;
  defaultFormat: string;
  monitorInterval: number;
  autoCleanupEnabled: boolean;
  autoCleanupDays: number;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface SystemStatus {
  activeRecordings: number;
  totalRecordings: number;
  diskUsage: {
    used: number;
    total: number;
    percent: number;
  };
  monitoredChannels: number;
  liveChannels: number;
}

export interface RecordingProcess {
  id: string;
  process: any;
  startTime: Date;
  url: string;
  filePath: string;
}

