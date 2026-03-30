# OpenVox Architecture

## System Overview

OpenVox is a hybrid web application designed for real-time sound isolation and enhancement. It captures audio from the user's microphone, processes it using AI models, and returns the enhanced audio with minimal latency.

## Components

### 1. Client Application (React + TypeScript)

**Location:** `client/`

**Key Features:**
- Audio capture using Web Audio API
- Real-time visualization of audio streams
- WebSocket communication with server
- User interface for source selection and control

**Core Modules:**
- `App.tsx` - Main application component
- Audio capture and processing hooks
- WebSocket client for server communication
- UI components for controls and visualization

### 2. Server Application (Node.js + Fastify)

**Location:** `server/`

**Key Features:**
- WebSocket server for real-time audio streaming
- REST API for configuration and health checks
- ONNX Runtime integration for ML model inference
- Audio processing pipeline

**Core Modules:**
- `index.ts` - Fastify server with WebSocket support
- `audioProcessor.ts` - Audio processing with ONNX models
- Model loading and management

### 3. Audio Processing Pipeline

**Processing Stages:**
1. **Audio Capture** - Client captures microphone audio
2. **Streaming** - Audio chunks sent via WebSocket
3. **Preprocessing** - Normalization, resampling
4. **AI Processing** - Noise suppression, source separation
5. **Postprocessing** - Gain adjustment, focus control
6. **Playback** - Enhanced audio returned to client

## Data Flow

```
┌─────────────┐    Audio Stream    ┌─────────────┐
│   Browser   │ ────────────────── │    Server   │
│  (Client)   │                    │  (Fastify)  │
└─────────────┘                    └─────────────┘
       │                                   │
       ▼                                   ▼
┌─────────────┐                    ┌─────────────┐
│  Web Audio  │                    │  ONNX Model │
│     API     │                    │  Inference  │
└─────────────┘                    └─────────────┘
       │                                   │
       ▼                                   ▼
┌─────────────┐                    ┌─────────────┐
│   Speaker   │ ◀───────────────── │   Processed │
│   Output    │   Enhanced Audio   │    Audio    │
└─────────────┘                    └─────────────┘
```

## WebSocket Protocol

### Message Types

**Client → Server:**
```json
{
  "type": "audio",
  "audioData": [0, 123, -456, ...],
  "timestamp": 1234567890,
  "sampleRate": 44100
}
```

```json
{
  "type": "config",
  "config": {
    "focusStrength": 75,
    "selectedSource": "Voice 1"
  }
}
```

**Server → Client:**
```json
{
  "type": "processed_audio",
  "audioData": [0, 234, -567, ...],
  "processed": true,
  "timestamp": 1234567890
}
```

```json
{
  "type": "config_ack",
  "success": true,
  "config": {...}
}
```

## Audio Models

### Supported Model Types

1. **Noise Suppression**
   - RNNoise ONNX version
   - DeepFeature denoising models

2. **Source Separation**
   - Demucs for music/vocal separation
   - Custom speaker separation models

### Model Integration

Models are loaded using ONNX Runtime Node.js bindings:
```typescript
const session = await InferenceSession.create(modelPath, {
  executionProviders: ['cpu']
});
```

## Performance Considerations

### Latency Targets
- **MVP:** < 300ms end-to-end
- **Optimized:** < 150ms end-to-end
- **Ideal:** < 60ms end-to-end

### Optimization Strategies
1. **Model Quantization** - Use INT8 models for faster inference
2. **Chunk Size Tuning** - Balance between latency and quality
3. **Web Workers** - Offload processing from main thread
4. **Caching** - Reuse model instances across connections

## Security & Privacy

### Data Privacy
- Audio processed on server (or locally if model permits)
- No audio data stored permanently
- WebSocket connections secured with HTTPS in production

### User Consent
- Clear microphone permission requests
- Transparent processing indicators
- Option to disable cloud processing

## Development Environment

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern browser with Web Audio API

### Local Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Start servers: `npm run dev:client` and `npm run dev:server`
4. Access at http://localhost:3000

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
- `PORT` - Server port (default: 4000)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)

## Future Enhancements

1. **WebRTC Data Channels** - Lower latency peer-to-peer audio
2. **Mobile PWA** - Progressive Web App capabilities
3. **Multi-microphone Support** - Beamforming with external mics
4. **Speaker Identification** - Voice fingerprinting
5. **Cloud Inference** - Optional heavy model processing

## Architecture Diagrams

### System Data Flow

```mermaid
graph TD
    A[User's Browser] -->|Audio Capture| B[Web Audio API]
    B -->|Raw Audio Chunks| C[WebSocket Client]
    C -->|Audio Stream| D[WebSocket Server]
    D -->|Audio Data| E[AudioProcessor]
    E -->|Inference Request| F[ONNX Runtime]
    F -->|Model Inference| G[ML Models]
    G -->|Processed Audio| F
    F -->|Enhanced Audio| E
    E -->|Processed Audio| D
    D -->|Audio Stream| C
    C -->|Audio Chunks| H[Audio Playback]
    I[User Controls] -->|Configuration| A
    A -->|Config Message| C
    C -->|Config| D
    D -->|Config| E
```

### Component Interaction

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant AudioProcessor
    participant ONNXModel

    User->>Browser: Click "Start Microphone"
    Browser->>Browser: Request microphone access
    Browser->>User: Microphone permission granted
    User->>Browser: Click "Start Processing"
    Browser->>Server: WebSocket connection
    Server->>AudioProcessor: Create new instance
    loop Real-time Audio
        Browser->>Server: Audio chunk via WebSocket
        Server->>AudioProcessor: Process audio
        AudioProcessor->>ONNXModel: Run inference
        ONNXModel-->>AudioProcessor: Processed audio
        AudioProcessor-->>Server: Enhanced audio
        Server-->>Browser: Processed audio chunk
        Browser->>Browser: Play enhanced audio
    end
    User->>Browser: Adjust focus strength
    Browser->>Server: Config update
    Server->>AudioProcessor: Update settings
```

### Audio Processing Pipeline

```mermaid
graph LR
    A[Microphone Input] --> B[Audio Capture]
    B --> C[Chunking]
    C --> D[WebSocket Transmission]
    D --> E[Server Reception]
    E --> F[Preprocessing]
    F --> G[ONNX Inference]
    G --> H[Postprocessing]
    H --> I[Focus Adjustment]
    I --> J[WebSocket Response]
    J --> K[Client Playback]
    
    style A fill:#e1f5fe
    style K fill:#e1f5fe
    style G fill:#f3e5f5
```