export interface ParsedStreamUrl {
  url: string;
  platform: string;
  username: string;
  displayName: string;
}

export function detectPlatformFromUrl(input: string): string {
  const lower = input.toLowerCase();
  
  if (lower.includes('twitch.tv')) return 'twitch';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('chaturbate.com')) return 'chaturbate';
  if (lower.includes('kick.com')) return 'kick';
  if (lower.includes('stripchat.com')) return 'stripchat';
  if (lower.includes('bongacams.com')) return 'bongacams';
  
  return 'other';
}

export function normalizeStreamUrl(input: string, platform?: string): ParsedStreamUrl {
  let url = input.trim();
  let detectedPlatform = platform || detectPlatformFromUrl(url);
  let username = '';
  let displayName = '';

  // If it's not a URL (no protocol), construct one based on platform
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (detectedPlatform === 'twitch') {
      username = url;
      url = `https://twitch.tv/${username}`;
      displayName = username;
    } else if (detectedPlatform === 'youtube') {
      // YouTube needs full URLs
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        url = `https://${url}`;
      }
      username = url;
      displayName = 'YouTube Stream';
    } else if (detectedPlatform === 'chaturbate') {
      username = url;
      url = `https://chaturbate.com/${username}`;
      displayName = username;
    } else if (detectedPlatform === 'kick') {
      username = url;
      url = `https://kick.com/${username}`;
      displayName = username;
    } else {
      username = url;
      displayName = url;
    }
  } else {
    // Parse URL to extract username
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      if (detectedPlatform === 'twitch') {
        // Twitch: https://twitch.tv/username
        username = pathname.split('/').filter(Boolean)[0] || '';
        displayName = username;
      } else if (detectedPlatform === 'youtube') {
        // YouTube: various formats
        if (pathname.includes('/watch')) {
          displayName = 'YouTube Stream';
        } else if (pathname.includes('/channel/') || pathname.includes('/@')) {
          username = pathname.split('/').pop() || '';
          displayName = username.replace('@', '');
        } else {
          displayName = 'YouTube Stream';
        }
      } else if (detectedPlatform === 'chaturbate') {
        // Chaturbate: https://chaturbate.com/username/
        username = pathname.split('/').filter(Boolean)[0] || '';
        displayName = username;
      } else if (detectedPlatform === 'kick') {
        // Kick: https://kick.com/username
        username = pathname.split('/').filter(Boolean)[0] || '';
        displayName = username;
      } else {
        // Generic
        const parts = pathname.split('/').filter(Boolean);
        username = parts[parts.length - 1] || '';
        displayName = username || urlObj.hostname;
      }
    } catch (error) {
      displayName = url;
    }
  }

  return {
    url,
    platform: detectedPlatform,
    username,
    displayName: displayName || username || url,
  };
}

export function buildStreamUrl(username: string, platform: string): string {
  const baseUrls: Record<string, string> = {
    twitch: 'https://twitch.tv/',
    youtube: '', // YouTube needs full URL
    chaturbate: 'https://chaturbate.com/',
    kick: 'https://kick.com/',
    stripchat: 'https://stripchat.com/',
    bongacams: 'https://bongacams.com/',
  };

  const baseUrl = baseUrls[platform.toLowerCase()];
  if (baseUrl) {
    return `${baseUrl}${username}`;
  }
  
  return username;
}

