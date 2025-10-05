import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { recordingsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  formatBytes,
  formatDate,
  formatRelativeTime,
  getPlatformColor,
  getStatusColor,
  cn,
} from '@/lib/utils';
import {
  Plus,
  Download,
  Trash2,
  Video,
  Search,
  StopCircle,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Recordings: React.FC = () => {
  const { recordings, setRecordings, updateRecording, removeRecording } = useStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    quality: 'best',
    format: 'mp4',
  });

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const data = await recordingsApi.getAll();
      setRecordings(data);
    } catch (error) {
      toast.error('Failed to load recordings');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const recording = await recordingsApi.start(formData);
      updateRecording(recording);
      toast.success('Recording started');
      setModalOpen(false);
      setFormData({ url: '', title: '', quality: 'best', format: 'mp4' });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start recording');
    }
  };

  const handleStopRecording = async (id: string) => {
    try {
      const recording = await recordingsApi.stop(id);
      updateRecording(recording);
      toast.success('Recording stopped');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to stop recording');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      await recordingsApi.delete(id);
      removeRecording(id);
      toast.success('Recording deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete recording');
    }
  };

  const handleUploadToCloud = async (id: string) => {
    try {
      await recordingsApi.uploadToCloud(id);
      toast.success('Upload started');
      loadRecordings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload');
    }
  };

  const filteredRecordings = recordings.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recordings</h1>
          <p className="text-muted-foreground">Manage your recorded streams</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Start Recording
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search recordings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No recordings found' : 'No recordings yet'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Your First Recording
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center',
                          getPlatformColor(recording.platform)
                        )}
                      >
                        <Video className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{recording.title}</div>
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              getStatusColor(recording.status)
                            )}
                          />
                          <span className="text-xs text-muted-foreground capitalize">
                            {recording.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {recording.platform} • {recording.quality} • {recording.format}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Started {formatRelativeTime(recording.startedAt)}
                          {recording.completedAt && (
                            <> • Completed {formatDate(recording.completedAt)}</>
                          )}
                        </div>
                      </div>
                      {recording.fileSize && (
                        <div className="text-sm font-medium">
                          {formatBytes(recording.fileSize)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {recording.status === 'recording' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStopRecording(recording.id)}
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      )}
                      {recording.status === 'completed' && recording.filePath && (
                        <>
                          <a
                            href={recordingsApi.download(recording.id)}
                            download
                          >
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </a>
                          {!recording.uploadedToCloud && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUploadToCloud(recording.id)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(recording.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {recording.error && (
                    <div className="mt-2 text-sm text-destructive">
                      Error: {recording.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Recording Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Start Recording"
      >
        <form onSubmit={handleStartRecording} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Stream URL</label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://twitch.tv/username"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recording Title</label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="My Recording"
              required
            />
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
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="mp4">MP4</option>
              <option value="mkv">MKV</option>
              <option value="ts">TS</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Start Recording
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

