import { Router } from 'express';
import { ChannelModel } from '../models/Channel';
import { authMiddleware } from '../middleware/auth';
import { monitorService } from '../services/monitor';
import { normalizeStreamUrl } from '../utils/url';

const router = Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const channels = ChannelModel.findAll();
    res.json(channels);
  } catch (error: any) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const channel = ChannelModel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(channel);
  } catch (error: any) {
    console.error('Error fetching channel:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

router.post('/', (req, res) => {
  try {
    const { url: inputUrl, name, autoRecord, quality, enabled, platform: inputPlatform } = req.body;

    if (!inputUrl) {
      return res.status(400).json({ error: 'URL or username is required' });
    }

    // Parse and normalize the URL
    const parsed = normalizeStreamUrl(inputUrl, inputPlatform);

    const channel = ChannelModel.create({
      url: parsed.url,
      name: name || parsed.displayName,
      platform: parsed.platform,
      autoRecord: autoRecord ?? false,
      quality: quality || 'best',
      enabled: enabled ?? true,
    });

    res.status(201).json(channel);
  } catch (error: any) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const { url, name, autoRecord, quality, enabled } = req.body;
    
    const channel = ChannelModel.update(req.params.id, {
      url,
      name,
      autoRecord,
      quality,
      enabled,
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json(channel);
  } catch (error: any) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = ChannelModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

router.post('/:id/check', async (req, res) => {
  try {
    const isLive = await monitorService.manualCheck(req.params.id);
    res.json({ isLive });
  } catch (error: any) {
    console.error('Error checking channel:', error);
    res.status(500).json({ error: 'Failed to check channel' });
  }
});

router.post('/:id/test', async (req, res) => {
  try {
    const channel = ChannelModel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Run a detailed diagnostic check
    const diagnostic = await monitorService.diagnosticCheck(channel.url);
    res.json(diagnostic);
  } catch (error: any) {
    console.error('Error testing channel:', error);
    res.status(500).json({ error: 'Failed to test channel' });
  }
});

export default router;

