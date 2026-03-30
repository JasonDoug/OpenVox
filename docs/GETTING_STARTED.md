# Getting Started with OpenVox Development

This guide will help you set up the OpenVox development environment and start contributing.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js (or use yarn)
- **Git**: For version control
- **Modern Browser**: Chrome/Edge recommended for WebAudio and WebSocket support

## Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/JasonDoug/OpenVox.git
cd OpenVox
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for both client and server using npm workspaces.

### 3. Environment Configuration

Create a `.env` file in the `server/` directory:

```bash
PORT=4000
HOST=0.0.0.0
NODE_ENV=development
```

### 4. Start Development Servers

Open two terminal windows or use a process manager:

**Terminal 1 - Server:**
```bash
npm run dev:server
```

**Terminal 2 - Client:**
```bash
npm run dev:client
```

### 5. Access the Application

- **Client**: http://localhost:3000
- **Server API**: http://localhost:4000
- **WebSocket**: ws://localhost:4000/ws

## Project Structure

```
OpenVox/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main component
│   │   ├── main.tsx       # Entry point
│   │   └── index.css      # Styles
│   ├── package.json
│   └── vite.config.ts     # Vite configuration
├── server/                # Node.js backend
│   ├── src/
│   │   ├── index.ts       # Fastify server
│   │   └── audioProcessor.ts
│   ├── models/           # ONNX model files
│   └── package.json
├── docs/                  # Documentation
└── package.json          # Root package.json
```

## Development Workflow

### Client Development

The client uses:
- **React 18** with TypeScript
- **Vite** for development and bundling
- **Web Audio API** for audio capture
- **WebSocket** for server communication

**Key files:**
- `client/src/App.tsx` - Main application logic
- `client/vite.config.ts` - Development proxy configuration

### Server Development

The server uses:
- **Fastify** as web framework
- **WebSocket** support via `@fastify/websocket`
- **ONNX Runtime** for ML model inference
- **TypeScript** for type safety

**Key files:**
- `server/src/index.ts` - Server setup and routes
- `server/src/audioProcessor.ts` - Audio processing logic

### Audio Processing

The audio processing pipeline:
1. Client captures microphone audio
2. Audio chunks sent to server via WebSocket
3. Server processes with ONNX models (or simple processing)
4. Processed audio sent back to client
5. Client plays enhanced audio

## Testing the Application

### Basic Audio Flow Test

1. Open http://localhost:3000 in your browser
2. Click "Start Microphone" to grant permissions
3. Click "Start Processing" to begin audio streaming
4. Adjust "Focus Strength" slider
5. Observe server logs for audio processing

### WebSocket Communication Test

Check browser console and server logs for:
- WebSocket connection established
- Audio data being sent/received
- Configuration messages

## Adding ONNX Models

For production audio processing:

1. Download an ONNX model (e.g., noise suppression)
2. Place it in `server/models/`
3. Update `audioProcessor.ts` to load the model:

```typescript
await audioProcessor.loadModel('./models/your-model.onnx');
```

## Common Issues

### Microphone Permission Denied
- Ensure HTTPS in production
- Check browser permissions
- Try different browser

### WebSocket Connection Failed
- Verify server is running on port 4000
- Check CORS configuration
- Look for firewall issues

### Audio Quality Poor
- Adjust chunk size in audio capture
- Tune noise gate threshold
- Check model quality

## Building for Production

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on submitting pull requests.

## Next Steps

1. **Explore the codebase** - Understand the audio processing flow
2. **Add features** - Implement new audio processing capabilities
3. **Improve UI** - Enhance the user interface
4. **Add tests** - Write unit and integration tests
5. **Documentation** - Improve existing documentation