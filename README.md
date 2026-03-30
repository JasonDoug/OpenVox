# OpenVox - Real-time Sound Isolation Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/JasonDoug/OpenVox)](https://github.com/JasonDoug/OpenVox/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/JasonDoug/OpenVox)](https://github.com/JasonDoug/OpenVox/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/JasonDoug/OpenVox)](https://github.com/JasonDoug/OpenVox/pulls)

OpenVox is an open-source web application that provides real-time sound isolation and enhancement using AI. It allows users to focus on specific audio sources (like a voice in a noisy environment) while suppressing background noise. The application runs as a hybrid system with client-side audio capture and server-side AI processing.

## Overview

Based on the commercial Supervox application, OpenVox aims to provide core sound isolation features through a web interface. The application captures audio from the user's microphone (including Bluetooth microphones), streams it to a server for AI-powered processing, and returns the enhanced audio in real-time.

**Key Features:**
- Real-time noise suppression and source separation
- Target source selection with visual feedback
- Focus strength control
- Bluetooth microphone support
- On-device and cloud processing options
- Privacy-first design (audio processed locally when possible)

## Quick Start

### Using Helper Scripts (Recommended)

```bash
# Clone the repository
git clone https://github.com/JasonDoug/OpenVox.git
cd OpenVox

# Install dependencies
npm install

# Start both servers with one command
./start.sh

# Later, stop both servers with one command
./stop.sh
```

The scripts will automatically:
- Find available ports (starting from 3000/4000)
- Kill any existing servers
- Start both client and server in the background
- Save PID files for easy stopping

### Manual Start (Alternative)

```bash
# Start development servers in separate terminals
npm run dev:server  # Terminal 1: Server on port 4000
npm run dev:client  # Terminal 2: Client on port 3000
```

Open http://localhost:3000 in your browser and click "Start Microphone" to begin.

## Architecture

The application follows a hybrid architecture:

### Client (React + TypeScript)
- Audio capture via Web Audio API
- Real-time visualization
- WebSocket communication with server
- User interface for source selection and controls

### Server (Node.js + Fastify)
- WebSocket audio streaming
- ONNX Runtime for ML model inference
- Audio processing pipeline
- REST API endpoints

### Audio Processing
- ONNX models for noise suppression and source separation
- Fallback to simple signal processing
- Configurable focus strength and noise gate

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern browser with Web Audio API support (Chrome/Edge recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd OpenVox
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the server directory:
   ```bash
   PORT=4000
   HOST=0.0.0.0
   NODE_ENV=development
   ```

### Development

Start both client and server in development mode:

```bash
# Start the server (port 4000)
npm run dev:server

# Start the client (port 3000)
npm run dev:client
```

The client will be available at http://localhost:3000 and the server at http://localhost:4000.

### Building for Production

```bash
# Build both client and server
npm run build

# Start production server
npm start
```

## Project Structure

```
OpenVox/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.tsx         # Main application component
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Styles
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── index.ts        # Fastify server
│   │   └── audioProcessor.ts # Audio processing with ONNX
│   ├── models/             # ONNX model files
│   └── package.json
├── package.json            # Root package.json with workspaces
└── README.md
```

## Usage

1. Open the application in your browser
2. Click "Start Microphone" to grant microphone access
3. Click "Start Processing" to begin AI audio enhancement
4. Select a detected source to focus on
5. Adjust the focus strength slider to control isolation level

## Audio Models

For production use, you need to provide ONNX models for audio processing. The system currently supports:
- Noise suppression models (e.g., RNNoise ONNX version)
- Source separation models (e.g., Demucs)

Place model files in `server/models/` and update the model loading code in `audioProcessor.ts`.

## Development

### Initial Phase
For detailed information about the initial development phase, decisions made, and architecture choices, see the [Development Log](docs/DEVELOPMENT_LOG.md).

### Next Phase
For the upcoming development plan focusing on real audio processing and enhanced UI, see the [Next Phase Plan](docs/NEXT_PHASE.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Based on the Supervox commercial application concept
- Uses ONNX Runtime for machine learning inference
- Built with React, Fastify, and Web Audio API