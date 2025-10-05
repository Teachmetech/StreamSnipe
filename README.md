# StreamSnipe 🎯

A self-hosted stream recorder for Twitch, YouTube, Chaturbate, and other streaming platforms. Built with Node.js, Express, React, and streamlink.

## Features

- 🎥 **Multi-Platform Support**: Record streams from Twitch, YouTube, Chaturbate, Kick, and more
- 🤖 **Auto-Recording**: Monitor channels and automatically record when they go live
- 📦 **Manual Recording**: Start one-off recordings with a single click
- ☁️ **Cloud Storage**: Optional S3 integration for automatic uploads
- 🔒 **Optional Authentication**: Secure your instance with JWT-based login
- 📊 **Real-Time Dashboard**: Monitor active recordings with WebSocket updates
- 🎨 **Beautiful UI**: Modern, responsive interface with dark/light themes
- 🐳 **Docker Ready**: Easy deployment with Docker Compose

## Screenshots

### Dashboard
Monitor active recordings, system status, and recent recordings in real-time.

### Channels
Manage monitored channels with auto-record capabilities.

### Recordings
Browse, download, and manage all your recordings.

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/streamsnipe.git
cd streamsnipe
```

2. Start with Docker Compose:
```bash
docker-compose up -d
```

3. Access the application:
```
http://localhost:3000
```

### Manual Installation

#### Prerequisites
- Node.js 18+ and npm
- streamlink
- ffmpeg

#### Installation Steps

1. Install system dependencies:
```bash
# macOS
brew install streamlink ffmpeg

# Ubuntu/Debian
sudo apt-get install streamlink ffmpeg

# Windows (using Chocolatey)
choco install streamlink ffmpeg
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development servers:
```bash
# Start both backend and frontend
npm run dev

# Or start separately
npm run backend  # Backend on port 3000
npm run frontend # Frontend on port 5173
```

4. Access the application:
```
http://localhost:5173 (development)
```

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=3000
NODE_ENV=production

# Authentication (optional)
AUTH_ENABLED=false
JWT_SECRET=your-super-secret-jwt-key
ADMIN_PASSWORD=your-admin-password

# Storage
RECORDINGS_PATH=/app/recordings
MAX_DISK_USAGE_PERCENT=90

# Cloud Storage (optional)
S3_ENABLED=false
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=

# Recording Defaults
DEFAULT_QUALITY=best
DEFAULT_FORMAT=mp4

# Monitoring
MONITOR_INTERVAL_SECONDS=60
AUTO_CLEANUP_ENABLED=false
AUTO_CLEANUP_DAYS=30
```

### Docker Configuration

Edit `docker-compose.yml` to customize your deployment:

- **Ports**: Change the port mapping if 3000 is already in use
- **Volumes**: Adjust volume paths for recordings and data
- **Environment**: Configure all settings via environment variables

## Platform Support

StreamSnipe supports any platform that streamlink supports:

### Officially Tested
- ✅ **Twitch** - Live streams and VODs
- ✅ **YouTube** - Live streams
- ✅ **Chaturbate** - Adult streams
- ✅ **Kick** - Live streams

### Also Supported
- Facebook Live
- Twitter/X Live
- DLive
- And [many more](https://streamlink.github.io/plugins.html)

## Usage

### Adding a Channel

1. Navigate to the **Channels** page
2. Click **Add Channel**
3. Enter the stream URL (e.g., `https://twitch.tv/username`)
4. Configure settings:
   - **Name**: Display name for the channel
   - **Platform**: Auto-detected from URL
   - **Quality**: Recording quality (best, 1080p, 720p, etc.)
   - **Auto-record**: Enable to automatically record when live
   - **Monitor**: Enable channel monitoring

### Manual Recording

1. Navigate to the **Recordings** page
2. Click **Start Recording**
3. Enter the stream URL
4. Choose quality and format
5. Click **Start Recording**

The recording will begin immediately and appear in your active recordings.

### Managing Recordings

- **Stop**: Stop an active recording
- **Download**: Download completed recordings
- **Upload**: Upload to S3 (if enabled)
- **Delete**: Remove recordings from the system

## Authentication

StreamSnipe supports optional authentication:

### Enabling Authentication

1. Set `AUTH_ENABLED=true` in your environment
2. Set a secure `JWT_SECRET`
3. Set an `ADMIN_PASSWORD`

### First Login

- **Username**: `admin`
- **Password**: Value of `ADMIN_PASSWORD` environment variable

The admin user is created automatically on first login.

## Cloud Storage (S3)

StreamSnipe can automatically upload recordings to S3-compatible storage:

### Configuration

1. Enable S3 in Settings or via environment variables
2. Configure:
   - **Bucket Name**
   - **Region**
   - **Access Key ID** (environment only)
   - **Secret Access Key** (environment only)
   - **Endpoint** (for S3-compatible services)

### Supported Services

- Amazon S3
- Wasabi
- Backblaze B2
- MinIO
- DigitalOcean Spaces
- Any S3-compatible service

## API

StreamSnipe provides a REST API for integration:

### Endpoints

```
# Authentication
POST   /api/auth/login

# Channels
GET    /api/channels
POST   /api/channels
PATCH  /api/channels/:id
DELETE /api/channels/:id
POST   /api/channels/:id/check

# Recordings
GET    /api/recordings
POST   /api/recordings/start
POST   /api/recordings/:id/stop
DELETE /api/recordings/:id
GET    /api/recordings/:id/download

# Settings
GET    /api/settings
PUT    /api/settings

# Status
GET    /api/status
```

### WebSocket

Connect to `/ws` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle: recording_update, channel_update, notification
};
```

## Development

### Project Structure

```
streamsnipe/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── database/    # Database setup
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── server.ts    # Entry point
│   └── package.json
├── frontend/            # React/Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities
│   │   ├── pages/       # Page components
│   │   ├── store/       # State management
│   │   └── types/       # TypeScript types
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Building for Production

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

## Troubleshooting

### Streamlink Not Found

Ensure streamlink is installed and in your PATH:
```bash
which streamlink  # macOS/Linux
where streamlink  # Windows
```

### Permission Errors

Ensure the recordings directory is writable:
```bash
chmod -R 755 ./recordings
```

### Port Already in Use

Change the port in `docker-compose.yml` or `.env`:
```yaml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Database Locked

SQLite database is locked. Ensure only one instance is running:
```bash
docker-compose down
docker-compose up -d
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/streamsnipe/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/streamsnipe/discussions)

## Acknowledgments

- [streamlink](https://github.com/streamlink/streamlink) - Stream extraction
- [ffmpeg](https://ffmpeg.org/) - Media processing
- [React](https://react.dev/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework

---

Made with ❤️ by the StreamSnipe team

