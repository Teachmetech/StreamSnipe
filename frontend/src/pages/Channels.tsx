import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { channelsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatRelativeTime, getPlatformColor, cn } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Edit,
  Radio,
  Power,
  PowerOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Channel } from '@/types';

export const Channels: React.FC = () => {
  const { channels, setChannels, updateChannel, removeChannel } = useStore();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    platform: 'other',
    quality: 'best',
    autoRecord: false,
    enabled: true,
  });
  const [isUrlInput, setIsUrlInput] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await channelsApi.getAll();
      setChannels(data);
    } catch (error) {
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({
        url: channel.url,
        name: channel.name,
        platform: channel.platform,
        quality: channel.quality,
        autoRecord: channel.autoRecord,
        enabled: channel.enabled,
      });
      setIsUrlInput(true);
    } else {
      setEditingChannel(null);
      setFormData({
        url: '',
        name: '',
        platform: 'twitch',
        quality: 'best',
        autoRecord: false,
        enabled: true,
      });
      setIsUrlInput(true);
    }
    setModalOpen(true);
  };

  const detectPlatformAndName = (input: string) => {
    const lower = input.toLowerCase();
    let platform = 'other';
    let name = '';
    
    // Detect platform from URL
    if (lower.includes('twitch.tv')) {
      platform = 'twitch';
      const match = input.match(/twitch\.tv\/([^/?]+)/i);
      name = match ? match[1] : '';
    } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      platform = 'youtube';
      name = 'YouTube Stream';
    } else if (lower.includes('chaturbate.com')) {
      platform = 'chaturbate';
      const match = input.match(/chaturbate\.com\/([^/?]+)/i);
      name = match ? match[1] : '';
    } else if (lower.includes('kick.com')) {
      platform = 'kick';
      const match = input.match(/kick\.com\/([^/?]+)/i);
      name = match ? match[1] : '';
    } else if (!input.includes('http://') && !input.includes('https://') && !input.includes('.')) {
      // Looks like a username without URL
      name = input;
      setIsUrlInput(false);
    }
    
    return { platform, name };
  };

  const handleUrlChange = (input: string) => {
    setFormData(prev => ({ ...prev, url: input }));
    
    if (input && !editingChannel) {
      const { platform, name } = detectPlatformAndName(input);
      setFormData(prev => ({
        ...prev,
        platform: platform || prev.platform,
        name: name || prev.name,
      }));
      
      // Check if it's a URL or username
      setIsUrlInput(input.includes('http://') || input.includes('https://') || input.includes('.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Backend will auto-fill name if not provided
      const dataToSend = {
        ...formData,
        // Don't send empty name, let backend auto-fill
        name: formData.name || undefined,
      };

      if (editingChannel) {
        const updated = await channelsApi.update(editingChannel.id, dataToSend);
        updateChannel(updated);
        toast.success('Channel updated');
      } else {
        const created = await channelsApi.create(dataToSend);
        setChannels([...channels, created]);
        toast.success('Channel added');
      }
      setModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save channel');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      await channelsApi.delete(id);
      removeChannel(id);
      toast.success('Channel deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete channel');
    }
  };

  const handleToggleAutoRecord = async (channel: Channel) => {
    try {
      const updated = await channelsApi.update(channel.id, {
        autoRecord: !channel.autoRecord,
      });
      updateChannel(updated);
      toast.success(`Auto-record ${updated.autoRecord ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      toast.error('Failed to update channel');
    }
  };

  const handleCheckLive = async (id: string) => {
    try {
      const { isLive } = await channelsApi.checkLive(id);
      toast.success(isLive ? '✅ Channel is LIVE!' : '⚠️ Channel appears offline');
      loadChannels();
    } catch (error: any) {
      toast.error('Failed to check channel status');
    }
  };

  const handleDiagnostic = async (id: string) => {
    const toastId = toast.loading('Running diagnostic test...');
    try {
      const result = await channelsApi.testChannel(id);
      toast.dismiss(toastId);
      
      const methods = result.methods;
      const summary = `
Diagnostic Results:
- JSON Method: ${methods.json === true ? '✅ Live' : methods.json === false ? '❌ Offline' : '⚠️ Failed'}
- Stream List: ${methods.streamList === true ? '✅ Live' : methods.streamList === false ? '❌ Offline' : '⚠️ Failed'}
- Can Handle: ${methods.canHandle === true ? '✅ Supported' : '❌ Not Supported'}

Overall: ${result.overallResult ? '✅ LIVE' : '❌ OFFLINE'}
      `.trim();
      
      alert(summary);
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error('Diagnostic test failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channels</h1>
          <p className="text-muted-foreground">Manage your monitored channels</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : channels.length === 0 ? (
            <div className="text-center py-12">
              <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No channels added yet</p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Channel
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', getPlatformColor(channel.platform))}>
                        <Radio className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{channel.name}</div>
                          {channel.isLive && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {channel.platform} • {channel.quality}
                          {channel.lastChecked && (
                            <> • Checked {formatRelativeTime(channel.lastChecked)}</>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                          {channel.url}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckLive(channel.id)}
                      >
                        Check Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDiagnostic(channel.id)}
                        title="Run diagnostic test"
                      >
                        🔧 Test
                      </Button>
                      <Button
                        variant={channel.autoRecord ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleAutoRecord(channel)}
                      >
                        {channel.autoRecord ? (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Auto-Record
                          </>
                        ) : (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Manual
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(channel)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(channel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingChannel ? 'Edit Channel' : 'Add Channel'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Stream URL or Username</label>
            <Input
              type="text"
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://chaturbate.com/username or just 'username'"
              required
            />
            <p className="text-xs text-muted-foreground">
              {isUrlInput || formData.url.includes('http') 
                ? '✓ URL detected - Platform will be auto-detected' 
                : '⚠ Username detected - Select platform below'}
            </p>
          </div>

          {(!isUrlInput && !formData.url.includes('http')) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
                <option value="chaturbate">Chaturbate</option>
                <option value="kick">Kick</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Display Name {formData.name && '(auto-filled)'}
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Override auto-detected name"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use auto-detected name
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quality</label>
            <select
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="best">Best</option>
              <option value="1080p60">1080p60</option>
              <option value="1080p">1080p</option>
              <option value="720p60">720p60</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRecord"
              checked={formData.autoRecord}
              onChange={(e) => setFormData({ ...formData, autoRecord: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="autoRecord" className="text-sm font-medium">
              Auto-record when live
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="enabled" className="text-sm font-medium">
              Monitor this channel
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingChannel ? 'Update' : 'Add'} Channel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

