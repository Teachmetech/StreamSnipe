import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    twitch: 'bg-purple-500',
    youtube: 'bg-red-500',
    chaturbate: 'bg-orange-500',
    kick: 'bg-green-500',
    other: 'bg-gray-500',
  };
  return colors[platform.toLowerCase()] || colors.other;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    recording: 'bg-red-500 animate-pulse',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
    stopped: 'bg-yellow-500',
  };
  return colors[status] || colors.failed;
}

