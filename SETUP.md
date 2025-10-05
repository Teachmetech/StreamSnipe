# StreamSnipe Setup Guide

## Quick Setup (Docker)

The easiest way to get started is with Docker:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/streamsnipe.git
cd streamsnipe

# 2. Configure environment (optional)
# Edit docker-compose.yml to customize settings

# 3. Start the application
docker-compose up -d

# 4. Access the application
open http://localhost:3000
```

## Development Setup

For local development without Docker:

### Prerequisites

1. **Node.js 18+**: Install from [nodejs.org](https://nodejs.org/)
2. **streamlink**: Stream extraction tool
3. **ffmpeg**: Media processing

### Installing System Dependencies

#### macOS (using Homebrew)
```bash
brew install streamlink ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install streamlink ffmpeg
```

#### Windows (using Chocolatey)
```bash
choco install streamlink ffmpeg
```

Or download installers:
- streamlink: https://streamlink.github.io/install.html
- ffmpeg: https://ffmpeg.org/download.html

### Installing Node.js Dependencies

```bash
# Install all dependencies (root, backend, frontend)
npm install

# Or install separately
cd backend && npm install
cd ../frontend && npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example backend/.env
```

2. Edit `backend/.env` to customize settings:
```env
# Essential settings
PORT=3000
AUTH_ENABLED=false
RECORDINGS_PATH=./recordings

# Optional: Enable authentication
AUTH_ENABLED=true
JWT_SECRET=your-random-secret-here
ADMIN_PASSWORD=your-secure-password

# Optional: Enable S3 uploads
S3_ENABLED=true
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
```

### Running in Development

```bash
# Start both backend and frontend concurrently
npm run dev

# Or start separately in different terminals:

# Terminal 1 - Backend (port 3000)
npm run backend

# Terminal 2 - Frontend (port 5173)
npm run frontend
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **WebSocket**: ws://localhost:3000/ws

### Building for Production

```bash
# Build both backend and frontend
npm run build

# Start the production server
npm start
```

The built application will serve both the API and static frontend from port 3000.

## First Run

### Without Authentication

Simply navigate to http://localhost:3000 (or :5173 in development) and start using the application.

### With Authentication

1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Use these credentials:
   - Username: `admin`
   - Password: Value of `ADMIN_PASSWORD` from .env

## Adding Your First Channel

1. Go to the **Channels** page
2. Click **Add Channel**
3. Fill in the details:
   - **Stream URL**: e.g., `https://twitch.tv/username`
   - **Channel Name**: Display name
   - **Platform**: Auto-detected
   - **Quality**: Choose recording quality
   - **Auto-record**: Enable to record automatically when live
   - **Monitor**: Enable channel monitoring
4. Click **Add Channel**

## Starting a Recording

### Auto-Recording
If you enabled auto-record on a channel, recordings will start automatically when the channel goes live.

### Manual Recording
1. Go to the **Recordings** page
2. Click **Start Recording**
3. Enter the stream URL
4. Choose quality and format
5. Click **Start Recording**

## Troubleshooting

### "Streamlink not found" error

Verify streamlink is installed:
```bash
streamlink --version
```

If not found, install it as described above.

### Port 3000 already in use

Change the port in your configuration:
```bash
# In backend/.env
PORT=3001

# Or in docker-compose.yml
ports:
  - "3001:3000"
```

### Cannot write to recordings directory

Ensure the directory exists and is writable:
```bash
mkdir -p recordings
chmod 755 recordings
```

### Database locked error

Stop all instances and restart:
```bash
# Docker
docker-compose down
docker-compose up -d

# Local
# Kill all node processes and restart
```

### Recordings fail to start

Check the logs for errors:
```bash
# Docker
docker-compose logs -f

# Local
# Check terminal output
```

Common issues:
- Stream is not live
- Invalid stream URL
- Streamlink/ffmpeg not in PATH
- Insufficient disk space

## Platform-Specific Notes

### Twitch
- Use full URLs: `https://twitch.tv/username`
- Works with live streams
- Authentication not required for public streams

### YouTube
- Use full URLs: `https://youtube.com/watch?v=...`
- Works with live streams
- Some streams may require authentication

### Chaturbate
- Use full URLs: `https://chaturbate.com/username`
- Works with live streams
- streamlink handles authentication automatically

### Other Platforms
StreamSnipe supports any platform that streamlink supports. Check the [streamlink plugins list](https://streamlink.github.io/plugins.html) for supported sites.

## Advanced Configuration

### S3-Compatible Storage

StreamSnipe supports any S3-compatible storage:

```env
S3_ENABLED=true
S3_BUCKET=my-recordings
S3_REGION=us-east-1

# For AWS S3
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# For Wasabi
S3_ENDPOINT=https://s3.wasabisys.com

# For Backblaze B2
S3_ENDPOINT=https://s3.us-west-001.backblazeb2.com

# For MinIO
S3_ENDPOINT=http://localhost:9000
```

### Custom Recording Quality

You can specify custom streamlink quality strings:
- `best` - Best available quality
- `worst` - Lowest quality
- `1080p60`, `1080p`, `720p60`, `720p`, `480p`, `360p` - Specific resolutions
- `source` - Original stream quality (Twitch)

### Auto-Cleanup

Enable automatic deletion of old recordings:

```env
AUTO_CLEANUP_ENABLED=true
AUTO_CLEANUP_DAYS=30  # Delete recordings older than 30 days
```

Note: Only recordings uploaded to cloud (if S3 is enabled) or completed recordings will be cleaned up.

## Need Help?

- 📖 Check the main [README](README.md)
- 🐛 Report issues on [GitHub](https://github.com/yourusername/streamsnipe/issues)
- 💬 Ask questions in [Discussions](https://github.com/yourusername/streamsnipe/discussions)

