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
  const [serverStatus, setServerStatus] = useState<string>('disconnected');

  
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
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
  const connectWebSocket = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    const websocket = new WebSocket('ws://localhost:4000/ws');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsWsConnected(true);
      setServerStatus('connected');
      
      // Send initial configuration
      websocket.send(JSON.stringify({
        type: 'config',
        config: {
          focusStrength: focusStrength,
          selectedSource: selectedSource,
          sampleRate: audioContext?.sampleRate || 44100
        }
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        
        switch (data.type) {
          case 'processed_audio':
            // Play processed audio
            if (audioRef.current && data.audioData) {
              // In a real implementation, we would decode and play the processed audio
              console.log('Received processed audio');
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
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });
      setMediaStream(stream);
      
      // Create audio context
      const context = new AudioContext({ sampleRate: 44100 });
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
      
      // Process audio data
      scriptProcessor.onaudioprocess = (e) => {
        if (!isProcessing || !ws || ws.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array for WebSocket transmission
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }
        
        // Send audio data to server
        ws.send(JSON.stringify({
          type: 'audio',
          audioData: Array.from(int16Data), // Convert to regular array for JSON
          timestamp: Date.now(),
          sampleRate: context.sampleRate
        }));
      };
      
      setIsConnected(true);
      
      // Set initial sources (these would come from server detection)
      setSources(['Voice 1', 'Voice 2', 'Background Noise']);
      setSelectedSource('Voice 1');
      
      // Connect to WebSocket server
      connectWebSocket();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure you have granted permission.');
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
    if (!isProcessing && !isWsConnected) {
      connectWebSocket();
    }
    setIsProcessing(!isProcessing);
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
                <div className={`w-3 h-3 rounded-full ${serverStatus === 'connected' ? 'bg-green-500' : serverStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm">Server: {serverStatus}</span>
              </div>
            </div>
            
            {!isConnected ? (
              <button
                onClick={startAudioCapture}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded"
              >
                Start Microphone
              </button>
            ) : (
              <button
                onClick={stopAudioCapture}
                className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded"
              >
                Stop
              </button>
            )}

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
            <div className="h-40 bg-gray-900 rounded flex items-center justify-center">
              {isConnected ? (
                <div className="text-center">
                  <p className="text-gray-400">Audio stream active</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Sample rate: {audioContext?.sampleRate || 'N/A'} Hz
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Start microphone to see visualization</p>
              )}
            </div>
            <div className="mt-4">
              <audio ref={audioRef} className="w-full hidden" />
              <div className="text-sm text-gray-400">
                <p>Audio processing: {isProcessing ? 'Active' : 'Inactive'}</p>
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