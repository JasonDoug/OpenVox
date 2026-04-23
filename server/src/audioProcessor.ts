import { InferenceSession, Tensor } from 'onnxruntime-node';

export class AudioProcessor {
  private gain: number = 1.0;
  private noiseGateThreshold: number = 0.01;
  private sampleRate: number = 44100;
  private focusStrength: number = 50;
  private selectedSource: string | null = null;
  private session: InferenceSession | null = null;
  private modelLoaded: boolean = false;
  private detectedSources: string[] = ['Human Speech', 'Background Hum'];
  private lastRms: number = 0;

  constructor(modelPath?: string) {
    if (modelPath) {
      this.loadModel(modelPath).catch(error => {
        console.warn('Failed to load model in constructor:', error.message);
      });
    }
  }

  // Load ONNX model for audio processing
  async loadModel(modelPath: string): Promise<void> {
    try {
      console.log(`Loading ONNX model from: ${modelPath}`);
      this.session = await InferenceSession.create(modelPath, {
        executionProviders: ['cpu'],
      });
      this.modelLoaded = true;
      this.detectedSources = ['AI Enhanced Voice', 'Environment Noise'];
      console.log('ONNX model loaded successfully');
    } catch (error) {
      console.error('Failed to load ONNX model:', error);
      throw error;
    }
  }

  // Process audio data (Int16Array format)
  async processAudio(audioData: number[]): Promise<number[]> {
    if (!this.modelLoaded) {
      return this.simpleProcess(audioData);
    }

    // Convert Int16Array to Float32Array for ONNX model
    const float32Data = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      float32Data[i] = audioData[i] / 32768.0;
    }

    // Run ONNX inference
    return this.runInference(float32Data);
  }

  private async runInference(audioData: Float32Array): Promise<number[]> {
    if (!this.session) {
      throw new Error('ONNX session not initialized');
    }

    try {
      // RNNoise typically expects a specific frame size (e.g. 480 samples)
      // For this demo, we'll wrap it or fallback to simple if frame doesn't match
      const inputTensor = new Tensor('float32', audioData, [1, audioData.length]);
      const feeds: Record<string, Tensor> = { input: inputTensor };
      
      // Attempt inference (names may vary by model)
      try {
        const results = await this.session.run(feeds);
        const outputTensor = results.output || Object.values(results)[0];
        const outputData = outputTensor.data as Float32Array;
        
        const result = new Array(outputData.length);
        for (let i = 0; i < outputData.length; i++) {
          result[i] = Math.max(-32768, Math.min(32767, Math.round(outputData[i] * 32767)));
        }
        return result;
      } catch (e) {
        // If the model names don't match or frame size is wrong, use simple
        return this.simpleProcess(Array.from(audioData));
      }
    } catch (error) {
      return this.simpleProcess(Array.from(audioData));
    }
  }

  private simpleProcess(audioData: number[]): number[] {
    const float32Data = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      float32Data[i] = audioData[i] / 32768.0;
    }

    const processed = this.applyNoiseGate(float32Data);
    const focused = this.applyFocus(processed);
    
    const result = new Array(focused.length);
    for (let i = 0; i < focused.length; i++) {
      result[i] = Math.max(-32768, Math.min(32767, Math.round(focused[i] * 32767 * this.gain)));
    }
    return result;
  }

  private applyNoiseGate(data: Float32Array): Float32Array {
    const result = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) < this.noiseGateThreshold) {
        result[i] = 0;
      } else {
        result[i] = data[i];
      }
    }
    return result;
  }

  private applyFocus(data: Float32Array): Float32Array {
    const focusFactor = this.focusStrength / 100.0;
    const result = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] * (1.0 + focusFactor);
    }
    for (let i = 0; i < data.length; i++) {
      result[i] = Math.max(-1.0, Math.min(1.0, result[i]));
    }
    return result;
  }

  detectSources(audioData?: number[]): string[] {
    if (!audioData || audioData.length === 0) return this.detectedSources;

    // RMS calculation
    let sumSq = 0;
    let peak = 0;
    for (let i = 0; i < audioData.length; i++) {
      const val = Math.abs(audioData[i] / 32768);
      sumSq += val * val;
      if (val > peak) peak = val;
    }
    const rms = Math.sqrt(sumSq / audioData.length);
    
    // AI Transient detection (e.g. bark, slam)
    if (peak > this.lastRms * 10 && peak > 0.4 && this.lastRms > 0) {
      if (!this.detectedSources.includes('Impulse Noise (Slam/Bark)')) {
        this.detectedSources = [...this.detectedSources, 'Impulse Noise (Slam/Bark)'];
      }
    }

    this.lastRms = rms;
    return this.detectedSources;
  }

  setFocusStrength(strength: number): void {
    this.focusStrength = Math.max(0, Math.min(100, strength));
  }

  setSelectedSource(source: string | null): void {
    this.selectedSource = source;
    if (source === 'Human Speech' || source === 'AI Enhanced Voice') {
      this.noiseGateThreshold = 0.01;
      this.gain = 1.3;
    } else if (source?.includes('Noise') || source?.includes('Hum') || source?.includes('Impulse')) {
      this.noiseGateThreshold = 0.7; // Cut them out
      this.gain = 0.2; // Muffle
    } else {
      this.noiseGateThreshold = 0.05;
      this.gain = 1.0;
    }
  }

  isModelLoaded(): boolean {
    return this.modelLoaded;
  }
}