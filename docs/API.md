# OpenVox API Documentation

## Base URL

Development: `http://localhost:4000`

## REST Endpoints

### Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-30T12:00:00.000Z"
}
```

### Root Endpoint

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "OpenVox API Server",
  "version": "0.1.0",
  "endpoints": {
    "health": "/api/health",
    "websocket": "/ws",
    "processAudio": "/api/process-audio"
  }
}
```

### Process Audio (Non-real-time)

**Endpoint:** `POST /api/process-audio`

**Request Body:** (Audio data in appropriate format)

**Response:**
```json
{
  "message": "Audio processing endpoint"
}
```

*Note: This endpoint is currently a placeholder for non-real-time audio processing.*

## WebSocket API

**Endpoint:** `ws://localhost:4000/ws`

### Connection

1. Client establishes WebSocket connection to `/ws`
2. Server creates an AudioProcessor instance for the connection
3. Server sends welcome/configuration acknowledgment

### Message Format

All messages are JSON formatted.

#### Client → Server Messages

**Audio Data:**
```json
{
  "type": "audio",
  "audioData": [0, 123, -456, 789, ...],
  "timestamp": 1234567890,
  "sampleRate": 44100
}
```

**Configuration:**
```json
{
  "type": "config",
  "config": {
    "focusStrength": 75,
    "selectedSource": "Voice 1",
    "sampleRate": 44100
  }
}
```

#### Server → Client Messages

**Processed Audio:**
```json
{
  "type": "processed_audio",
  "audioData": [0, 234, -567, 890, ...],
  "processed": true,
  "timestamp": 1234567890
}
```

**Configuration Acknowledgment:**
```json
{
  "type": "config_ack",
  "success": true,
  "config": {
    "focusStrength": 75,
    "selectedSource": "Voice 1"
  }
}
```

**Error:**
```json
{
  "type": "error",
  "message": "Audio processing failed",
  "timestamp": 1234567890
}
```

**Sources Detected:**
```json
{
  "type": "sources_detected",
  "sources": ["Voice 1", "Voice 2", "Background Noise"]
}
```

### Connection Lifecycle

1. **Connection Established** - Server logs "WebSocket connection established"
2. **Configuration Exchange** - Client sends initial config, server acknowledges
3. **Audio Streaming** - Continuous audio data exchange
4. **Configuration Updates** - Dynamic config changes during session
5. **Disconnection** - Clean shutdown with logs

### Error Handling

- Invalid JSON: Server logs error and continues
- Processing errors: Server sends error message to client
- Connection errors: Logged on server side

## Authentication & Security

### Current Implementation
- No authentication required for development
- CORS enabled for localhost origins
- WebSocket connections accepted from any origin

### Production Considerations
- Add authentication tokens
- Restrict CORS origins
- Use WSS (WebSocket Secure) protocol
- Implement rate limiting

## Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- Limit connections per IP
- Throttle audio data rate
- Implement request quotas

## Versioning

API version is included in root endpoint response. Current version: `0.1.0`

## Examples

### JavaScript Client Example

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:4000/ws');

ws.onopen = () => {
  // Send configuration
  ws.send(JSON.stringify({
    type: 'config',
    config: { focusStrength: 75 }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'processed_audio') {
    // Play processed audio
    playAudio(data.audioData);
  }
};

// Send audio data
ws.send(JSON.stringify({
  type: 'audio',
  audioData: audioSamples,
  timestamp: Date.now()
}));
```

### cURL Examples

```bash
# Health check
curl http://localhost:4000/api/health

# Root endpoint
curl http://localhost:4000/

# Process audio (placeholder)
curl -X POST http://localhost:4000/api/process-audio \
  -H "Content-Type: application/json" \
  -d '{"audio": "data"}'
```