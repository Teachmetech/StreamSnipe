import React, { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { statusApi, recordingsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatBytes, formatRelativeTime, getStatusColor, cn } from '@/lib/utils';
import {
  Activity,
  Video,
  HardDrive,
  Radio,
  StopCircle,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { status, setStatus, recordings, updateRecording } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statusData, recordingsData] = await Promise.all([
        statusApi.get(),
        recordingsApi.getAll(10),
      ]);
      setStatus(statusData);
      useStore.getState().setRecordings(recordingsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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

  const activeRecordings = recordings.filter((r) => r.status === 'recording');

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Monitor your active recordings and system status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recordings</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status?.activeRecordings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently recording</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status?.totalRecordings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatBytes(status?.diskUsage.used || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Storage used</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Channels</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Radio className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{status?.liveChannels || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {status?.monitoredChannels || 0} monitored
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Recordings */}
      {activeRecordings.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500 animate-pulse" />
              Active Recordings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {activeRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn('h-3 w-3 rounded-full shrink-0', getStatusColor(recording.status))} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{recording.title}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        {recording.platform} • {recording.quality} • Started{' '}
                        {formatRelativeTime(recording.startedAt)}
                      </div>
                    </div>
                    {recording.fileSize && (
                      <div className="hidden md:block text-sm font-medium text-muted-foreground shrink-0">
                        {formatBytes(recording.fileSize)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleStopRecording(recording.id)}
                    className="w-full sm:w-auto"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Recordings */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Recent Recordings
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-2"></div>
              <p>Loading recordings...</p>
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground mb-2">No recordings yet</p>
              <p className="text-sm text-muted-foreground">
                Start recording from the Channels or Recordings page
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.slice(0, 10).map((recording) => (
                <div
                  key={recording.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn('h-2 w-2 rounded-full shrink-0', getStatusColor(recording.status))} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{recording.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(recording.startedAt)}
                      </div>
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground shrink-0">
                      {recording.fileSize ? formatBytes(recording.fileSize) : '-'}
                    </div>
                  </div>
                  {recording.status === 'completed' && recording.filePath && (
                    <a
                      href={recordingsApi.download(recording.id)}
                      download
                      className="text-primary hover:text-primary/80 transition-colors sm:ml-2"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

