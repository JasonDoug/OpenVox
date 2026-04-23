import { useState, useRef, useEffect, useCallback } from 'react';

function App() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [focusStrength, setFocusStrength] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState<string>('checking...');
  const [modelsReady, setModelsReady] = useState<boolean>(false);

  const isProcessingRef = useRef(isProcessing);
  const wsRef = useRef(ws);
  const audioContextRef = useRef(audioContext);

  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { wsRef.current = ws; }, [ws]);
  useEffect(() => { audioContextRef.current = audioContext; }, [audioContext]);

  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Visualization loop
  const draw = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#111827'; // bg-gray-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Color based on height and frequency
        const hue = (i / bufferLength) * 360;
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.8)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    renderFrame();
  }, []);

  // Check server health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setServerStatus('ready');
          setModelsReady(data.modelsLoaded || false);
        } else {
          setServerStatus('error');
        }
      } catch (err) {
        console.error('Health check failed:', err);
        setServerStatus('disconnected');
      }
    };
    checkHealth();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
      if (ws) {
        ws.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [mediaStream, audioContext, ws]);

  // Connect to WebSocket server
  const connectWebSocket = useCallback((currentContext?: AudioContext) => {
    // If there's an existing WebSocket, close it first to ensure a clean state
    if (ws) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }

    // Use relative path for proxy support
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    setServerStatus('connecting...');
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsWsConnected(true);
      setServerStatus('connected');
      
      // Send initial configuration
      const sampleRate = currentContext?.sampleRate || audioContext?.sampleRate || 44100;
      websocket.send(JSON.stringify({
        type: 'config',
        config: {
          focusStrength: focusStrength,
          selectedSource: selectedSource,
          sampleRate: sampleRate
        }
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        
        switch (data.type) {
          case 'processed_audio':
            // Play processed audio
            if (data.audioData && data.audioData.length > 0) {
              const currentContext = audioContextRef.current;
              if (currentContext) {
                // Always try to resume context on message arrival in case it suspended
                if (currentContext.state === 'suspended') {
                  currentContext.resume();
                }

                if (currentContext.state === 'running') {
                  const buffer = currentContext.createBuffer(1, data.audioData.length, currentContext.sampleRate);
                  const channelData = buffer.getChannelData(0);
                  
                  for (let i = 0; i < data.audioData.length; i++) {
                    channelData[i] = data.audioData[i] / 32768.0;
                  }
                  
                  const source = currentContext.createBufferSource();
                  source.buffer = buffer;
                  source.connect(currentContext.destination);
                  source.start();
                }
              }
            }
            break;
          case 'config_ack':
            console.log('Configuration acknowledged');
            break;
          case 'sources_detected':
            if (data.sources) {
              setSources(data.sources);
              if (data.sources.length > 0 && !selectedSource) {
                setSelectedSource(data.sources[0]);
              }
            }
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsWsConnected(false);
      setServerStatus('disconnected');
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setServerStatus('error');
    };

    setWs(websocket);
  }, [focusStrength, selectedSource, audioContext, ws]);

  // Start audio capture
  const startAudioCapture = async () => {
    try {
      // Request microphone access with more flexible constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      setMediaStream(stream);
      
      // Create audio context
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Some browsers require explicit resume on user interaction
      if (context.state === 'suspended') {
        await context.resume();
      }
      
      setAudioContext(context);
      
      // Create analyser for visualization
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      // Connect media stream to analyser
      const sourceNode = context.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;
      sourceNode.connect(analyser);
      
      // Create script processor for real-time audio processing
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;
      
      // Connect script processor for sending audio data
      sourceNode.connect(scriptProcessor);
      scriptProcessor.connect(context.destination);
      
      // Process audio data
      scriptProcessor.onaudioprocess = (e) => {
        if (!isProcessingRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array for WebSocket transmission
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }

        if (Math.random() < 0.05) {
          console.log(`Sending ${int16Data.length} samples to server. First sample: ${int16Data[0]}`);
        }
        
        // Send audio data to server
        wsRef.current.send(JSON.stringify({
          type: 'audio',
          audioData: Array.from(int16Data), // Convert to regular array for JSON
          timestamp: Date.now(),
          sampleRate: context.sampleRate
        }));
      };
      
      setIsConnected(true);
      
      // Sources will now come dynamically from the server
      setSources([]);
      setSelectedSource(null);
      
      // Start visualization
      setTimeout(draw, 100);
      
      // Connect to WebSocket server with the new context
      connectWebSocket(context);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      let errorMessage = 'Could not access microphone.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings and refresh.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Microphone is already in use by another application.';
        } else {
          errorMessage = `Microphone error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  // Stop audio capture
  const stopAudioCapture = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    if (ws) {
      ws.close();
    }
    
    setMediaStream(null);
    setAudioContext(null);
    setIsConnected(false);
    setSources([]);
    setSelectedSource(null);
    setIsProcessing(false);
    setIsWsConnected(false);
    setWs(null);
    
    // Clean up refs
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
  };

  // Toggle audio processing
  const toggleProcessing = () => {
    const nextProcessing = !isProcessing;
    if (nextProcessing && !isWsConnected) {
      connectWebSocket();
    }
    
    // If turning on, send current config immediately
    if (nextProcessing && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'config',
        config: {
          focusStrength: focusStrength,
          selectedSource: selectedSource || 'Voice 1'
        }
      }));
    }
    
    setIsProcessing(nextProcessing);
  };

  // Update server when settings change
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && isProcessing) {
      ws.send(JSON.stringify({
        type: 'config',
        config: {
          focusStrength: focusStrength,
          selectedSource: selectedSource
        }
      }));
    }
  }, [focusStrength, selectedSource, ws, isProcessing]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">OpenVox</h1>
        <p className="text-gray-400">Real-time Sound Isolation</p>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Controls</h2>
            
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${serverStatus === 'ready' || serverStatus === 'connected' ? 'bg-green-500' : serverStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm">Server: {serverStatus}</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${modelsReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm">AI Models: {modelsReady ? 'Active' : 'Fallback (Algorithmic)'}</span>
              </div>
            </div>
            
            {!isConnected ? (
              <button
                onClick={startAudioCapture}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded mb-2"
              >
                Start Microphone
              </button>
            ) : (
              <button
                onClick={stopAudioCapture}
                className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded mb-2"
              >
                Stop
              </button>
            )}

            <button
              onClick={() => connectWebSocket()}
              className="w-full bg-gray-700 hover:bg-gray-600 py-2 px-4 rounded text-sm mb-4"
              disabled={!isConnected}
            >
              Reconnect WebSocket
            </button>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Focus Strength: {focusStrength}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={focusStrength}
                onChange={(e) => setFocusStrength(parseInt(e.target.value))}
                className="w-full"
                disabled={!isConnected}
              />
            </div>

            <div className="mt-6">
              <button
                onClick={toggleProcessing}
                disabled={!isConnected}
                className={`w-full py-2 px-4 rounded ${
                  isProcessing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? 'Processing Active' : 'Start Processing'}
              </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p>WebSocket: {isWsConnected ? 'Connected' : 'Disconnected'}</p>
            </div>
          </div>

          {/* Source Selection */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Detected Sources</h2>
            {sources.length === 0 ? (
              <p className="text-gray-400">No sources detected</p>
            ) : (
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedSource(source)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedSource === source
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{source}</span>
                      {selectedSource === source && (
                        <span className="text-xs bg-blue-800 px-2 py-1 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visualization */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Audio Visualization</h2>
            <div className="h-40 bg-gray-900 rounded flex items-center justify-center overflow-hidden">
              {isConnected ? (
                <canvas 
                  ref={canvasRef} 
                  width={400} 
                  height={160} 
                  className="w-full h-full"
                />
              ) : (
                <p className="text-gray-500">Start microphone to see visualization</p>
              )}
            </div>
            <div className="mt-4">
              <audio ref={audioRef} className="w-full" controls={true} />
              <div className="text-sm text-gray-400 mt-2">
                <p>Audio processing: {isProcessing ? 'Active' : 'Inactive'}</p>
                <button 
                  onClick={() => {
                    if (audioContext) {
                      const osc = audioContext.createOscillator();
                      osc.connect(audioContext.destination);
                      osc.start();
                      osc.stop(audioContext.currentTime + 0.5);
                    }
                  }}
                  className="mt-2 text-xs bg-gray-700 p-1 rounded"
                >
                  Test Audio Output (Beep)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 bg-gray-800 p-3 rounded-lg flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Microphone Connected' : 'Microphone Disconnected'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              {isProcessing ? 'Server processing active' : 'Server processing paused'}
            </div>
            <div className="text-sm text-gray-400">
              Focus: {focusStrength}%
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;