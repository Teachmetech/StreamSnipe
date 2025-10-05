import { Router } from 'express';
import { RecordingModel } from '../models/Recording';
import { recorderService } from '../services/recorder';
import { storageService } from '../services/storage';
import { authMiddleware } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const recordings = RecordingModel.findAll(limit);
    res.json(recordings);
  } catch (error: any) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const recording = RecordingModel.findById(req.params.id);
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    res.json(recording);
  } catch (error: any) {
    console.error('Error fetching recording:', error);
    res.status(500).json({ error: 'Failed to fetch recording' });
  }
});

router.post('/start', async (req, res) => {
  try {
    const { url, quality, format, title, channelId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const recording = await recorderService.startRecording(url, {
      quality,
      format,
      title,
      channelId,
    });

    res.status(201).json(recording);
  } catch (error: any) {
    console.error('Error starting recording:', error);
    res.status(500).json({ error: error.message || 'Failed to start recording' });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const recording = await recorderService.stopRecording(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found or not active' });
    }

    res.json(recording);
  } catch (error: any) {
    console.error('Error stopping recording:', error);
    res.status(500).json({ error: 'Failed to stop recording' });
  }
});

router.get('/:id/download', (req, res) => {
  try {
    const recording = RecordingModel.findById(req.params.id);
    
    if (!recording || !recording.filePath) {
      return res.status(404).json({ error: 'Recording file not found' });
    }

    if (!fs.existsSync(recording.filePath)) {
      return res.status(404).json({ error: 'File does not exist' });
    }

    const filename = path.basename(recording.filePath);
    res.download(recording.filePath, filename);
  } catch (error: any) {
    console.error('Error downloading recording:', error);
    res.status(500).json({ error: 'Failed to download recording' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const recording = RecordingModel.findById(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Delete file if exists
    if (recording.filePath) {
      storageService.deleteLocalFile(recording.filePath);
    }

    // Delete from database
    RecordingModel.delete(req.params.id);
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

router.post('/:id/upload', async (req, res) => {
  try {
    await storageService.uploadToS3(req.params.id);
    res.json({ message: 'Upload successful' });
  } catch (error: any) {
    console.error('Error uploading to S3:', error);
    res.status(500).json({ error: error.message || 'Failed to upload to S3' });
  }
});

export default router;

