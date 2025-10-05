import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { Recording, RecordingProcess } from '../types';
import { RecordingModel } from '../models/Recording';
import { broadcastRecordingUpdate } from '../websocket';

class RecorderService {
  private activeRecordings: Map<string, RecordingProcess> = new Map();

  async startRecording(
    url: string,
    options: {
      quality?: string;
      format?: string;
      title?: string;
      channelId?: string;
    } = {}
  ): Promise<Recording> {
    const quality = options.quality || config.recording.defaultQuality;
    const format = options.format || config.recording.defaultFormat;
    const title = options.title || `Recording ${new Date().toISOString()}`;
    
    // Detect platform from URL
    const platform = this.detectPlatform(url);
    
    // Ensure recordings directory exists
    if (!fs.existsSync(config.storage.recordingsPath)) {
      fs.mkdirSync(config.storage.recordingsPath, { recursive: true });
    }
    
    // Generate filename
    const filename = `${this.sanitizeFilename(title)}_${Date.now()}.${format}`;
    const filePath = path.join(config.storage.recordingsPath, filename);
    
    // Create recording record
    const recording = RecordingModel.create({
      channelId: options.channelId,
      url,
      platform,
      title,
      status: 'recording',
      quality,
      format,
      filePath,
    });
    
    // Start streamlink process
    try {
      const process = await this.spawnStreamlink(url, quality, filePath);
      
      this.activeRecordings.set(recording.id, {
        id: recording.id,
        process,
        startTime: new Date(),
        url,
        filePath,
      });
      
      this.setupProcessHandlers(recording.id, process, filePath);
      
      broadcastRecordingUpdate(recording);
      
      return recording;
    } catch (error: any) {
      // Update recording as failed
      const updated = RecordingModel.update(recording.id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString(),
      });
      
      broadcastRecordingUpdate(updated!);
      throw error;
    }
  }

  async stopRecording(id: string): Promise<Recording | undefined> {
    const activeRecording = this.activeRecordings.get(id);
    if (!activeRecording) {
      return undefined;
    }
    
    // Kill the process
    activeRecording.process.kill('SIGTERM');
    
    // Give it time to cleanup, then force kill if needed
    setTimeout(() => {
      if (!activeRecording.process.killed) {
        activeRecording.process.kill('SIGKILL');
      }
    }, 5000);
    
    this.activeRecordings.delete(id);
    
    // Update database
    const fileSize = this.getFileSize(activeRecording.filePath);
    const recording = RecordingModel.update(id, {
      status: 'stopped',
      completedAt: new Date().toISOString(),
      fileSize,
    });
    
    if (recording) {
      broadcastRecordingUpdate(recording);
    }
    
    return recording;
  }

  getActiveRecordings(): Recording[] {
    const activeIds = Array.from(this.activeRecordings.keys());
    return activeIds
      .map(id => RecordingModel.findById(id))
      .filter((r): r is Recording => r !== undefined);
  }

  isRecording(id: string): boolean {
    return this.activeRecordings.has(id);
  }

  private spawnStreamlink(url: string, quality: string, outputPath: string): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      const args = [
        url,
        quality,
        '-o', outputPath,
        '--force',
        '--hls-live-restart',
        '--stream-timeout', '120',
        '--retry-streams', '10',
        '--retry-max', '20',
        '--retry-open', '3',
        '--hls-segment-timeout', '120',
      ];
      
      console.log(`[Recorder] Starting streamlink for ${url} with quality ${quality}`);
      console.log(`[Recorder] Output: ${outputPath}`);
      console.log(`[Recorder] Command: streamlink ${args.join(' ')}`);
      
      const process = spawn(config.recording.streamlinkPath, args);
      
      let started = false;
      let errorOutput = '';
      let hasStreamData = false;
      
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[Recorder] streamlink stdout: ${output}`);
        
        // Consider it started if we see any of these indicators
        if (!started && (
          output.includes('Opening stream') ||
          output.includes('Starting output') ||
          output.includes('Writing output to') ||
          output.includes('Stream ended') ||
          output.includes('[download]')
        )) {
          console.log('[Recorder] Stream process confirmed started');
          started = true;
          hasStreamData = true;
          resolve(process);
        }
      });
      
      process.stderr?.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        console.log(`[Recorder] streamlink stderr: ${output}`);
        
        // Also check stderr for positive indicators
        if (!started && (
          output.includes('Found matching plugin') ||
          output.includes('Available streams:') ||
          output.includes('Opening stream')
        )) {
          console.log('[Recorder] Stream detected in stderr, assuming started');
          started = true;
          hasStreamData = true;
          resolve(process);
        }
        
        // Only reject on fatal errors, not warnings
        if (!started && (
          output.includes('No playable streams found') ||
          output.includes('Unable to open URL') ||
          output.includes('Failed to start stream')
        )) {
          console.error('[Recorder] Fatal error detected');
          reject(new Error(`Streamlink error: ${output}`));
        }
      });
      
      process.on('error', (error) => {
        console.error('[Recorder] Process error:', error);
        if (!started) {
          reject(error);
        }
      });
      
      // More lenient startup - assume success after short delay if no errors
      setTimeout(() => {
        if (!started && errorOutput && errorOutput.includes('error')) {
          console.error('[Recorder] Startup timeout with errors');
          process.kill();
          reject(new Error('Streamlink process failed to start: ' + errorOutput));
        } else if (!started) {
          // No errors detected, assume it's working
          console.log('[Recorder] No errors after 10s, assuming stream is starting...');
          started = true;
          resolve(process);
        }
      }, 10000);
      
      // Final timeout - kill if really stuck
      setTimeout(() => {
        if (!started) {
          console.error('[Recorder] Hard timeout reached');
          process.kill();
          reject(new Error('Streamlink process failed to start within timeout'));
        }
      }, 60000);
    });
  }

  private setupProcessHandlers(recordingId: string, process: ChildProcess, filePath: string) {
    process.on('exit', (code, signal) => {
      console.log(`Recording ${recordingId} exited with code ${code}, signal ${signal}`);
      
      this.activeRecordings.delete(recordingId);
      
      const fileSize = this.getFileSize(filePath);
      const status = code === 0 ? 'completed' : 'failed';
      const error = code !== 0 ? `Process exited with code ${code}` : undefined;
      
      const recording = RecordingModel.update(recordingId, {
        status,
        completedAt: new Date().toISOString(),
        fileSize,
        error,
      });
      
      if (recording) {
        broadcastRecordingUpdate(recording);
      }
    });
  }

  private detectPlatform(url: string): string {
    if (url.includes('twitch.tv')) return 'twitch';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('chaturbate.com')) return 'chaturbate';
    if (url.includes('kick.com')) return 'kick';
    return 'other';
  }

  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .substring(0, 100);
  }

  private getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

export const recorderService = new RecorderService();

