import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  },
  
  storage: {
    recordingsPath: process.env.RECORDINGS_PATH || path.join(process.cwd(), 'recordings'),
    maxDiskUsagePercent: parseInt(process.env.MAX_DISK_USAGE_PERCENT || '90', 10),
  },
  
  s3: {
    enabled: process.env.S3_ENABLED === 'true',
    bucket: process.env.S3_BUCKET || '',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    endpoint: process.env.S3_ENDPOINT,
  },
  
  recording: {
    defaultQuality: process.env.DEFAULT_QUALITY || 'best',
    defaultFormat: process.env.DEFAULT_FORMAT || 'ts',
    streamlinkPath: process.env.STREAMLINK_PATH || 'streamlink',
    ytDlpPath: process.env.YT_DLP_PATH || 'yt-dlp',
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  },
  
  monitoring: {
    intervalSeconds: parseInt(process.env.MONITOR_INTERVAL_SECONDS || '60', 10),
    autoCleanupEnabled: process.env.AUTO_CLEANUP_ENABLED === 'true',
    autoCleanupDays: parseInt(process.env.AUTO_CLEANUP_DAYS || '30', 10),
  },
  
  database: {
    path: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'streamsnipe.sqlite'),
  },
};

