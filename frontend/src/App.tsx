import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store';
import { wsClient } from './lib/websocket';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Channels } from './pages/Channels';
import { Recordings } from './pages/Recordings';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  const { token, theme, settings, updateRecording, updateChannel } = useStore();

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    // Connect WebSocket
    wsClient.connect();

    const unsubscribe = wsClient.subscribe((message) => {
      if (message.type === 'recording_update') {
        updateRecording(message.data);
      } else if (message.type === 'channel_update') {
        updateChannel(message.data);
      }
    });

    return () => {
      unsubscribe();
      wsClient.disconnect();
    };
  }, []);

  // Check if auth is required
  const requiresAuth = settings?.authEnabled ?? false;
  const isAuthenticated = !!token;

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: theme === 'dark' ? '#1f2937' : '#fff',
            color: theme === 'dark' ? '#f9fafb' : '#111',
          },
        }}
      />
      <Routes>
        {requiresAuth && !isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
            <Route
              path="/channels"
              element={
                <Layout>
                  <Channels />
                </Layout>
              }
            />
            <Route
              path="/recordings"
              element={
                <Layout>
                  <Recordings />
                </Layout>
              }
            />
            <Route
              path="/settings"
              element={
                <Layout>
                  <Settings />
                </Layout>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default App;

