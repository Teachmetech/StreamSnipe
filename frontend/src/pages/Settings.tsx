import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { settingsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const { setSettings } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    recordingsPath: '',
    defaultQuality: 'best',
    defaultFormat: 'mp4',
    monitorInterval: 60,
    autoCleanupEnabled: false,
    autoCleanupDays: 30,
    s3Enabled: false,
    s3Bucket: '',
    s3Region: 'us-east-1',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
      setFormData({
        recordingsPath: data.recordingsPath,
        defaultQuality: data.defaultQuality,
        defaultFormat: data.defaultFormat,
        monitorInterval: data.monitorInterval,
        autoCleanupEnabled: data.autoCleanupEnabled,
        autoCleanupDays: data.autoCleanupDays,
        s3Enabled: data.s3Enabled,
        s3Bucket: data.s3Bucket || '',
        s3Region: data.s3Region || 'us-east-1',
      });
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = await settingsApi.update(formData);
      setSettings(updated);
      toast.success('Settings saved');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure StreamSnipe</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Recording Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Recording Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recordings Path</label>
              <Input
                type="text"
                value={formData.recordingsPath}
                onChange={(e) =>
                  setFormData({ ...formData, recordingsPath: e.target.value })
                }
                placeholder="/app/recordings"
              />
              <p className="text-xs text-muted-foreground">
                Where recordings will be saved on the server
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Quality</label>
                <select
                  value={formData.defaultQuality}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultQuality: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="best">Best</option>
                  <option value="1080p60">1080p60</option>
                  <option value="1080p">1080p</option>
                  <option value="720p60">720p60</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Default Format</label>
                <select
                  value={formData.defaultFormat}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultFormat: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="mp4">MP4</option>
                  <option value="mkv">MKV</option>
                  <option value="ts">TS</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Monitoring Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Monitor Interval (seconds)
              </label>
              <Input
                type="number"
                min="30"
                max="3600"
                value={formData.monitorInterval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monitorInterval: parseInt(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                How often to check if monitored channels are live
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cleanup Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Auto-Cleanup Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoCleanup"
                checked={formData.autoCleanupEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoCleanupEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
              <label htmlFor="autoCleanup" className="text-sm font-medium">
                Enable automatic cleanup of old recordings
              </label>
            </div>

            {formData.autoCleanupEnabled && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cleanup After (days)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.autoCleanupDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autoCleanupDays: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Recordings older than this will be automatically deleted
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cloud Storage Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cloud Storage (S3)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="s3Enabled"
                checked={formData.s3Enabled}
                onChange={(e) =>
                  setFormData({ ...formData, s3Enabled: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label htmlFor="s3Enabled" className="text-sm font-medium">
                Enable S3 cloud storage
              </label>
            </div>

            {formData.s3Enabled && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">S3 Bucket</label>
                  <Input
                    type="text"
                    value={formData.s3Bucket}
                    onChange={(e) =>
                      setFormData({ ...formData, s3Bucket: e.target.value })
                    }
                    placeholder="my-recordings-bucket"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">S3 Region</label>
                  <Input
                    type="text"
                    value={formData.s3Region}
                    onChange={(e) =>
                      setFormData({ ...formData, s3Region: e.target.value })
                    }
                    placeholder="us-east-1"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  S3 credentials are configured via environment variables on the
                  server
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};

