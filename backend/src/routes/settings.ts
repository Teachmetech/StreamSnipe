import { Router } from 'express';
import { SettingsModel } from '../models/Settings';
import { authMiddleware } from '../middleware/auth';
import { config } from '../config';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const settings = SettingsModel.get();
    
    // Don't expose sensitive data
    const response = {
      ...settings,
      // S3 credentials are write-only
      s3AccessKeyId: settings.s3Enabled ? '***' : undefined,
      s3SecretAccessKey: settings.s3Enabled ? '***' : undefined,
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', (req, res) => {
  try {
    const updates = req.body;
    const settings = SettingsModel.update(updates);
    
    res.json(settings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

