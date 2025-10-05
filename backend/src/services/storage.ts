import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { config } from '../config';
import { RecordingModel } from '../models/Recording';

class StorageService {
  private s3Client?: S3Client;

  constructor() {
    if (config.s3.enabled && config.s3.accessKeyId && config.s3.secretAccessKey) {
      this.s3Client = new S3Client({
        region: config.s3.region,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
        endpoint: config.s3.endpoint,
      });
    }
  }

  async uploadToS3(recordingId: string): Promise<void> {
    if (!this.s3Client || !config.s3.enabled) {
      throw new Error('S3 not configured');
    }

    const recording = RecordingModel.findById(recordingId);
    if (!recording || !recording.filePath) {
      throw new Error('Recording not found or has no file');
    }

    if (!fs.existsSync(recording.filePath)) {
      throw new Error('Recording file does not exist');
    }

    const fileStream = fs.createReadStream(recording.filePath);
    const fileName = path.basename(recording.filePath);

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: config.s3.bucket,
          Key: `recordings/${fileName}`,
          Body: fileStream,
          ContentType: 'video/mp4',
        },
      });

      upload.on('httpUploadProgress', (progress) => {
        console.log(`Upload progress for ${recordingId}:`, progress);
      });

      await upload.done();

      RecordingModel.update(recordingId, {
        uploadedToCloud: true,
      });

      console.log(`Successfully uploaded ${fileName} to S3`);
    } catch (error) {
      console.error(`Error uploading to S3:`, error);
      throw error;
    }
  }

  deleteLocalFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  getDiskUsage(): { used: number; total: number; percent: number } {
    // Simple implementation - can be enhanced with actual disk space checking
    try {
      let totalSize = 0;
      const files = this.getAllRecordingFiles();
      
      files.forEach(file => {
        totalSize += this.getFileSize(file);
      });

      // For simplicity, we'll just return the total size of recordings
      // In production, you'd want to check actual disk space
      return {
        used: totalSize,
        total: totalSize * 2, // Placeholder
        percent: 50, // Placeholder
      };
    } catch {
      return { used: 0, total: 0, percent: 0 };
    }
  }

  private getAllRecordingFiles(): string[] {
    try {
      if (!fs.existsSync(config.storage.recordingsPath)) {
        return [];
      }
      
      const files = fs.readdirSync(config.storage.recordingsPath);
      return files.map(f => path.join(config.storage.recordingsPath, f));
    } catch {
      return [];
    }
  }

  async cleanupOldRecordings(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recordings = RecordingModel.findAll();
    let deleted = 0;
    
    for (const recording of recordings) {
      const recordingDate = new Date(recording.startedAt);
      
      if (recordingDate < cutoffDate && recording.filePath) {
        // Only delete if uploaded to cloud or if cloud is not enabled
        if (recording.uploadedToCloud || !config.s3.enabled) {
          if (this.deleteLocalFile(recording.filePath)) {
            RecordingModel.delete(recording.id);
            deleted++;
          }
        }
      }
    }
    
    console.log(`Cleaned up ${deleted} old recordings`);
    return deleted;
  }
}

export const storageService = new StorageService();

