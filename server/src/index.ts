import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { AudioProcessor } from './audioProcessor.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // Register plugins
    await fastify.register(fastifyCors, {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    });

    await fastify.register(fastifyWebsocket);

    // Serve static files from the client build in production
    if (process.env.NODE_ENV === 'production') {
      await fastify.register(fastifyStatic, {
        root: join(__dirname, '../../client/dist'),
        prefix: '/',
        decorateReply: false
      });
    }

    // WebSocket connection for audio streaming
    fastify.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection: any, req: any) => {
        fastify.log.info('WebSocket connection established');
        
        // Comprehensive check for the socket object
        let socket: any = null;
        
        if (connection.socket) {
          socket = connection.socket;
        } else if (connection.on) {
          socket = connection;
        } else if (req && req.socket && req.socket.on) {
          socket = req.socket;
        }

        if (!socket) {
          fastify.log.error('WebSocket socket could not be resolved from connection or request');
          // Log keys to help debug
          fastify.log.info(`Connection keys: ${Object.keys(connection || {}).join(', ')}`);
          return;
        }

        // Create audio processor for this connection
        const audioProcessor = new AudioProcessor(join(__dirname, '../models/rnnoise.onnx'));
        let knownSourcesCount = 0;
        
        socket.on('message', async (message: Buffer) => {
          try {
            // Handle incoming audio data
            const data = JSON.parse(message.toString());
            
            switch (data.type) {
              case 'audio':
                // Process audio data
                await processAudio(data.audioData, socket, audioProcessor);
                
                // Continuous source detection
                const currentSources = audioProcessor.detectSources(data.audioData);
                if (currentSources.length > knownSourcesCount) {
                  socket.send(JSON.stringify({
                    type: 'sources_detected',
                    sources: currentSources
                  }));
                  knownSourcesCount = currentSources.length;
                }
                break;
              case 'config':
                // Handle configuration
                handleConfig(data.config, socket, audioProcessor);
                break;
              default:
                fastify.log.warn('Unknown message type:', data.type);
            }
          } catch (error) {
            fastify.log.error(error as Error);
          }
        });

        socket.on('close', () => {
          fastify.log.info('WebSocket connection closed');
        });

        socket.on('error', (error: Error) => {
          fastify.log.error(error);
        });
      });
    });

    // Health check endpoint
    fastify.get('/api/health', async (request, reply) => {
      const modelPath = join(__dirname, '../models/rnnoise.onnx');
      const processor = new AudioProcessor(modelPath);
      
      // We need to wait a tiny bit because loadModel is async in constructor
      // Or better, check if file exists
      const fs = await import('fs');
      const modelExists = fs.existsSync(modelPath);

      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        modelsLoaded: modelExists
      };
    });

    // Root endpoint
    fastify.get('/', async (request, reply) => {
      return { 
        message: 'OpenVox API Server',
        version: '0.1.0',
        endpoints: {
          health: '/api/health',
          websocket: '/ws',
          processAudio: '/api/process-audio'
        }
      };
    });

    // API endpoints for audio processing
    fastify.post('/api/process-audio', async (request, reply) => {
      // This would be used for non-real-time processing
      return { message: 'Audio processing endpoint' };
    });

    // Start the server
    await fastify.listen({ port: PORT as number, host: HOST });
    fastify.log.info(`Server running at http://${HOST}:${PORT}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Audio processing functions
async function processAudio(audioData: any, socket: any, audioProcessor: AudioProcessor) {
  // Process audio using the AudioProcessor
  try {
    if (!audioData || audioData.length === 0) {
      return;
    }

    // Calculate input magnitude for debugging
    let sumSq = 0;
    const sampleCount = Math.min(audioData.length, 100);
    for (let i = 0; i < sampleCount; i++) {
      sumSq += (audioData[i] / 32768) ** 2;
    }
    const rms = Math.sqrt(sumSq / sampleCount);
    
    const processedData = await audioProcessor.processAudio(audioData);
    
    // Calculate output magnitude
    let outSumSq = 0;
    const outSampleCount = Math.min(processedData.length, 100);
    for (let i = 0; i < outSampleCount; i++) {
      outSumSq += (processedData[i] / 32768) ** 2;
    }
    const outRms = Math.sqrt(outSumSq / outSampleCount);

    // Use a more stable logging method
    if (Math.random() < 0.5) { 
      console.log(`Audio flow: In RMS: ${rms.toFixed(4)}, Out RMS: ${outRms.toFixed(4)}`);
    }
    
    // Send processed audio back to client
    socket.send(JSON.stringify({
      type: 'processed_audio',
      audioData: processedData,
      processed: true,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error processing audio:', error);
  }
}

function handleConfig(config: any, socket: any, audioProcessor: AudioProcessor) {
  console.log('Received config:', config);
  
  // Update audio processor with new configuration
  if (config.focusStrength !== undefined) {
    audioProcessor.setFocusStrength(config.focusStrength);
  }
  
  if (config.selectedSource !== undefined) {
    audioProcessor.setSelectedSource(config.selectedSource);
  }
  
  socket.send(JSON.stringify({
    type: 'config_ack',
    success: true,
    config: config
  }));
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

startServer();