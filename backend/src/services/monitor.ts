import { spawn } from 'child_process';
import { config } from '../config';
import { ChannelModel } from '../models/Channel';
import { recorderService } from './recorder';
import { broadcastChannelUpdate } from '../websocket';

class MonitorService {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('Monitor service already running');
      return;
    }

    console.log('Starting monitor service');
    this.isRunning = true;
    
    // Initial check
    this.checkChannels();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkChannels();
    }, config.monitoring.intervalSeconds * 1000);
  }

  stop() {
    console.log('Stopping monitor service');
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async checkChannels() {
    const channels = ChannelModel.findEnabled();
    const autoRecordChannels = channels.filter(c => c.autoRecord);
    
    console.log(`Checking ${autoRecordChannels.length} channels for live status`);
    
    for (const channel of autoRecordChannels) {
      try {
        const isLive = await this.checkIfLive(channel.url);
        const wasLive = channel.isLive;
        
        // Update channel status
        const updated = ChannelModel.update(channel.id, {
          isLive,
          lastChecked: new Date().toISOString(),
        });
        
        if (updated) {
          broadcastChannelUpdate(updated);
        }
        
        // If channel just went live, start recording
        if (isLive && !wasLive) {
          console.log(`Channel ${channel.name} went live, starting recording`);
          await recorderService.startRecording(channel.url, {
            quality: channel.quality,
            title: `${channel.name}_${new Date().toISOString()}`,
            channelId: channel.id,
          });
        }
      } catch (error) {
        console.error(`Error checking channel ${channel.name}:`, error);
      }
    }
  }

  private async checkIfLive(url: string): Promise<boolean> {
    console.log(`[Monitor] Checking if live: ${url}`);
    
    // Try multiple methods in sequence
    const methods = [
      () => this.checkWithJson(url),
      () => this.checkWithStreamList(url),
      () => this.checkCanHandle(url),
    ];
    
    for (const method of methods) {
      try {
        const result = await method();
        if (result !== null) {
          console.log(`[Monitor] ${url} - Live: ${result}`);
          return result;
        }
      } catch (error) {
        console.error(`[Monitor] Check method failed for ${url}:`, error);
      }
    }
    
    console.log(`[Monitor] ${url} - All methods failed, assuming offline`);
    return false;
  }

  private checkWithJson(url: string): Promise<boolean | null> {
    return new Promise((resolve) => {
      console.log(`[Monitor] Trying JSON method for ${url}`);
      const args = [url, '--json'];
      const process = spawn(config.recording.streamlinkPath, args);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        console.log(`[Monitor] JSON method exit code ${code} for ${url}`);
        
        if (output.trim()) {
          try {
            const data = JSON.parse(output);
            if (data && data.streams && Object.keys(data.streams).length > 0) {
              console.log(`[Monitor] Found ${Object.keys(data.streams).length} streams via JSON`);
              resolve(true);
              return;
            }
          } catch (e) {
            console.log(`[Monitor] JSON parse failed, checking raw output`);
          }
        }
        
        // Check error output for stream availability
        if (errorOutput.includes('Available streams:') || errorOutput.includes('Found matching plugin')) {
          console.log(`[Monitor] Streams detected in stderr`);
          resolve(true);
        } else if (errorOutput.includes('No playable streams found') || 
                   errorOutput.includes('offline') ||
                   errorOutput.includes('This video is unavailable')) {
          console.log(`[Monitor] Explicitly offline message detected`);
          resolve(false);
        } else {
          resolve(null); // Try next method
        }
      });
      
      process.on('error', () => resolve(null));
      
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          resolve(null);
        }
      }, 15000);
    });
  }

  private checkWithStreamList(url: string): Promise<boolean | null> {
    return new Promise((resolve) => {
      console.log(`[Monitor] Trying stream list method for ${url}`);
      // Just check if streamlink can find the stream without JSON
      const args = [url, '--stream-url', 'best', '--retry-open', '1'];
      const process = spawn(config.recording.streamlinkPath, args);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        console.log(`[Monitor] Stream list exit code ${code} for ${url}`);
        
        // If we got a stream URL in stdout, it's live
        if (output.trim() && (output.includes('http://') || output.includes('https://'))) {
          console.log(`[Monitor] Got stream URL, channel is live`);
          resolve(true);
        } else if (errorOutput.includes('No playable streams found') || 
                   errorOutput.includes('offline') ||
                   errorOutput.includes('Unable to find')) {
          console.log(`[Monitor] Stream not available`);
          resolve(false);
        } else if (code === 0 && output.trim()) {
          // Got some output with success code
          console.log(`[Monitor] Success with output, assuming live`);
          resolve(true);
        } else {
          resolve(null); // Try next method
        }
      });
      
      process.on('error', () => resolve(null));
      
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          resolve(null);
        }
      }, 15000);
    });
  }

  private checkCanHandle(url: string): Promise<boolean | null> {
    return new Promise((resolve) => {
      console.log(`[Monitor] Trying can-handle method for ${url}`);
      // Check if streamlink can even handle this URL
      const args = ['--can-handle-url', url];
      const process = spawn(config.recording.streamlinkPath, args);
      
      process.on('close', (code) => {
        console.log(`[Monitor] Can-handle exit code ${code} for ${url}`);
        // If streamlink can handle the URL, assume we need to try recording
        // This is a last resort - it doesn't mean the stream is live
        if (code === 0) {
          console.log(`[Monitor] URL is supported by streamlink, trying optimistic live check`);
          // Try one more time with a quick check
          this.quickStreamCheck(url).then(resolve);
        } else {
          console.log(`[Monitor] URL not supported by streamlink`);
          resolve(false);
        }
      });
      
      process.on('error', () => resolve(null));
      
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          resolve(null);
        }
      }, 10000);
    });
  }

  private quickStreamCheck(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      console.log(`[Monitor] Quick stream check for ${url}`);
      const args = [url, 'best', '--stream-url', '--default-stream', 'best', '--retry-streams', '1'];
      const process = spawn(config.recording.streamlinkPath, args, {
        timeout: 10000,
      });
      
      let hasOutput = false;
      
      process.stdout?.on('data', () => {
        hasOutput = true;
      });
      
      process.on('close', (code) => {
        console.log(`[Monitor] Quick check result: code=${code}, hasOutput=${hasOutput}`);
        resolve(code === 0 && hasOutput);
      });
      
      process.on('error', () => resolve(false));
      
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          resolve(false);
        }
      }, 10000);
    });
  }

  async manualCheck(channelId: string): Promise<boolean> {
    const channel = ChannelModel.findById(channelId);
    if (!channel) {
      return false;
    }
    
    const isLive = await this.checkIfLive(channel.url);
    
    const updated = ChannelModel.update(channel.id, {
      isLive,
      lastChecked: new Date().toISOString(),
    });
    
    if (updated) {
      broadcastChannelUpdate(updated);
    }
    
    return isLive;
  }

  async diagnosticCheck(url: string): Promise<any> {
    console.log(`[Monitor] Running diagnostic check for ${url}`);
    
    const results: any = {
      url,
      timestamp: new Date().toISOString(),
      methods: {},
    };
    
    // Test each method individually
    try {
      results.methods.json = await this.checkWithJson(url);
    } catch (error: any) {
      results.methods.json = { error: error.message };
    }
    
    try {
      results.methods.streamList = await this.checkWithStreamList(url);
    } catch (error: any) {
      results.methods.streamList = { error: error.message };
    }
    
    try {
      results.methods.canHandle = await this.checkCanHandle(url);
    } catch (error: any) {
      results.methods.canHandle = { error: error.message };
    }
    
    results.overallResult = await this.checkIfLive(url);
    
    return results;
  }
}

export const monitorService = new MonitorService();

