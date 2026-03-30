import { InferenceSession, Tensor } from 'onnxruntime-node';

export class AudioProcessor {
  private gain: number = 1.0;
  private noiseGateThreshold: number = 0.01;
  private sampleRate: number = 44100;
  private focusStrength: number = 50;
  private selectedSource: string | null = null;
  private session: InferenceSession | null = null;
  private modelLoaded: boolean = false;

  constructor(modelPath?: string) {
    // Initialize with default settings
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
        executionProviders: ['cpu'], // Could also use 'cuda' or other providers
      });
      this.modelLoaded = true;
      console.log('ONNX model loaded successfully');
    } catch (error) {
      console.error('Failed to load ONNX model:', error);
      throw error;
    }
  }

  // Process audio data (Int16Array format)
  processAudio(audioData: number[]): number[] {
    if (!this.modelLoaded) {
      // Fall back to simple processing if model not loaded
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
      // Prepare input tensor - adjust shape based on your model
      // Most audio models expect [batch_size, sequence_length] or [batch_size, channels, sequence_length]
      const inputTensor = new Tensor('float32', audioData, [1, audioData.length]);
      
      // Run inference
      const feeds: Record<string, Tensor> = { input: inputTensor };
      const results = await this.session.run(feeds);
      
      // Get output tensor - adjust based on your model's output name
      const outputTensor = results.output;
      const outputData = outputTensor.data as Float32Array;
      
      // Convert back to Int16Array
      const result = new Array(outputData.length);
      for (let i = 0; i < outputData.length; i++) {
        result[i] = Math.max(-32768, Math.min(32767, Math.round(outputData[i] * 32767)));
      }
      
      return result;
    } catch (error) {
      console.error('ONNX inference failed:', error);
      // Fall back to simple processing
      return this.simpleProcess(Array.from(audioData));
    }
  }

  private simpleProcess(audioData: number[]): number[] {
    // Convert Int16Array back to Float32 for processing
    const float32Data = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      float32Data[i] = audioData[i] / 32768.0;
    }

    // Apply noise gate
    const processed = this.applyNoiseGate(float32Data);
    
    // Apply gain based on focus strength
    const focused = this.applyFocus(processed);
    
    // Convert back to Int16Array
    const result = new Array(focused.length);
    for (let i = 0; i < focused.length; i++) {
      result[i] = Math.max(-32768, Math.min(32767, Math.round(focused[i] * 32767)));
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
    
    // Simple focus: amplify based on strength
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] * (1.0 + focusFactor);
    }
    
    // Apply clipping protection
    for (let i = 0; i < data.length; i++) {
      result[i] = Math.max(-1.0, Math.min(1.0, result[i]));
    }
    
    return result;
  }

  setFocusStrength(strength: number): void {
    this.focusStrength = Math.max(0, Math.min(100, strength));
  }

  setSelectedSource(source: string | null): void {
    this.selectedSource = source;
  }

  setNoiseGateThreshold(threshold: number): void {
    this.noiseGateThreshold = Math.max(0, Math.min(1, threshold));
  }

  isModelLoaded(): boolean {
    return this.modelLoaded;
  }
}