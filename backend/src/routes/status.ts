import { Router } from 'express';
import { RecordingModel } from '../models/Recording';
import { ChannelModel } from '../models/Channel';
import { recorderService } from '../services/recorder';
import { storageService } from '../services/storage';
import { optionalAuth } from '../middleware/auth';
import { SystemStatus } from '../types';

const router = Router();

router.use(optionalAuth);

router.get('/', (req, res) => {
  try {
    const activeRecordings = recorderService.getActiveRecordings().length;
    const totalRecordings = RecordingModel.count();
    const diskUsage = storageService.getDiskUsage();
    
    const channels = ChannelModel.findAll();
    const monitoredChannels = channels.filter(c => c.enabled).length;
    const liveChannels = channels.filter(c => c.isLive).length;

    const status: SystemStatus = {
      activeRecordings,
      totalRecordings,
      diskUsage,
      monitoredChannels,
      liveChannels,
    };

    res.json(status);
  } catch (error: any) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;

