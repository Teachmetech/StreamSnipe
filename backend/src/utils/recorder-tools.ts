/**
 * Determines which recording tool to use for a given platform
 */

export type RecorderTool = 'streamlink' | 'yt-dlp';

// Platforms that work well with Streamlink
const STREAMLINK_PLATFORMS = [
  'twitch',
  'youtube',
  'kick',
  'afreecatv',
  'trovo',
  'facebook',
  'vimeo',
  'dailymotion',
];

// Platforms that require yt-dlp (not supported by Streamlink or removed)
const YT_DLP_PLATFORMS = [
  'chaturbate',
  'stripchat',
  'bongacams',
  'myfreecams',
  'cam4',
  'other', // Default to yt-dlp for unknown platforms as it has broader support
];

/**
 * Determines the best recording tool for a platform
 */
export function getRecorderTool(platform: string): RecorderTool {
  const normalizedPlatform = platform.toLowerCase();
  
  if (STREAMLINK_PLATFORMS.includes(normalizedPlatform)) {
    return 'streamlink';
  }
  
  if (YT_DLP_PLATFORMS.includes(normalizedPlatform)) {
    return 'yt-dlp';
  }
  
  // Default to yt-dlp for unknown platforms as it has broader support
  return 'yt-dlp';
}

/**
 * Get the quality format string for the tool
 */
export function getQualityFormat(tool: RecorderTool, quality: string): string {
  if (tool === 'streamlink') {
    // Streamlink uses quality like: best, 1080p, 720p, worst
    return quality;
  } else {
    // yt-dlp uses format codes, map common qualities
    switch (quality.toLowerCase()) {
      case 'best':
        return 'best';
      case 'worst':
        return 'worst';
      case '1080p':
        return 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
      case '720p':
        return 'bestvideo[height<=720]+bestaudio/best[height<=720]';
      case '480p':
        return 'bestvideo[height<=480]+bestaudio/best[height<=480]';
      default:
        return 'best';
    }
  }
}

