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

router.post('/', async (req, res) => {
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

    // Check if live and start recording if autoRecord is enabled
    // Don't await - run in background to respond quickly
    if (autoRecord && enabled) {
      monitorService.checkAndStartRecording(channel.id).catch(error => {
        console.error(`Error checking new channel ${channel.name}:`, error);
      });
    }

    res.status(201).json(channel);
  } catch (error: any) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const { url: inputUrl, name, autoRecord, quality, enabled, platform } = req.body;
    
    // Normalize URL if provided
    let normalizedUrl = inputUrl;
    if (inputUrl) {
      const parsed = normalizeStreamUrl(inputUrl, platform);
      normalizedUrl = parsed.url;
    }
    
    const channel = ChannelModel.update(req.params.id, {
      url: normalizedUrl,
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

// Utility endpoint to fix all channel URLs (removes invisible characters)
router.post('/fix-urls', (req, res) => {
  try {
    const channels = ChannelModel.findAll();
    const fixed: string[] = [];
    
    for (const channel of channels) {
      try {
        const parsed = normalizeStreamUrl(channel.url, channel.platform);
        if (parsed.url !== channel.url) {
          ChannelModel.update(channel.id, { url: parsed.url });
          fixed.push(channel.id);
          console.log(`Fixed URL for channel ${channel.name}: ${channel.url} -> ${parsed.url}`);
        }
      } catch (error) {
        console.error(`Failed to fix URL for channel ${channel.id}:`, error);
      }
    }
    
    res.json({ 
      message: `Fixed ${fixed.length} channel(s)`,
      fixedIds: fixed 
    });
  } catch (error: any) {
    console.error('Error fixing channel URLs:', error);
    res.status(500).json({ error: 'Failed to fix channel URLs' });
  }
});

export default router;

