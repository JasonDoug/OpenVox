# OpenVox Next Phase Development Plan

## Phase Overview

**Duration:** 4-6 weeks  
**Focus:** From infrastructure to functional audio processing  
**Goal:** Deliver a working prototype with real noise suppression and improved user experience

## Current State

### What Works
- ✅ Monorepo structure with React + Node.js
- ✅ WebSocket audio streaming (client ↔ server)
- ✅ Basic UI with controls
- ✅ AudioProcessor infrastructure ready for ONNX
- ✅ Development scripts (start.sh/stop.sh)
- ✅ Comprehensive documentation

### What's Missing
- ❌ Actual ONNX audio models
- ❌ Real audio quality improvement
- ❌ Source separation capability
- ❌ Error recovery and robustness
- ❌ Performance optimization

## Phase 1: Core Audio Processing (Weeks 1-2)

### Objective
Integrate real ONNX models to demonstrate actual sound isolation and noise suppression.

### Key Deliverables

#### 1.1 Noise Suppression Model Integration
**Task:** Add RNNoise ONNX model for real-time noise suppression

**Steps:**
1. Download RNNoise ONNX model (pre-trained)
2. Place in `server/models/rnnoise.onnx`
3. Update `audioProcessor.ts` to load and use model
4. Test with various noise sources (keyboard typing, background noise)
5. Measure SNR improvement

**Success Criteria:**
- Model loads successfully
- Noticeable noise reduction in real audio
- Latency < 200ms end-to-end

#### 1.2 Audio Pipeline Testing
**Task:** Validate end-to-end audio processing quality

**Steps:**
1. Create test scenarios with known audio samples
2. Implement audio quality metrics (SNR, PESQ)
3. Build simple test harness for automated testing
4. Test with different microphone inputs
5. Document performance characteristics

**Success Criteria:**
- Audio processes without distortion
- Measurable noise reduction (> 10dB SNR improvement)
- No audio dropouts or glitches

#### 1.3 Error Handling & Recovery
**Task:** Make audio processing robust to failures

**Steps:**
1. Implement graceful model loading failures
2. Add WebSocket reconnection logic
3. Handle microphone permission changes
4. Create fallback processing when models fail
5. Add user-facing error messages

**Success Criteria:**
- App continues working if model fails to load
- WebSocket reconnects automatically
- Clear error messages for users

## Phase 2: User Experience & Features (Weeks 3-4)

### Objective
Enhance the user interface and add meaningful audio controls.

### Key Deliverables

#### 2.1 Enhanced Audio Visualization
**Task:** Add real-time spectrogram and waveform display

**Steps:**
1. Implement Web Audio API analyzer
2. Create canvas-based spectrogram visualization
3. Add waveform display alongside controls
4. Show frequency bands that are being suppressed
5. Visual indicator of active noise reduction

**Success Criteria:**
- Real-time visualization updates smoothly
- User can see what frequencies are being processed
- Visual feedback helps users understand processing

#### 2.2 Source Selection & Focus Control
**Task:** Implement the source detection and selection UI

**Steps:**
1. Add multiple source cards (Source A, Source B, etc.)
2. Implement click-to-select interface
3. Add visual feedback for selected source
4. Create "Auto-Focus" mode that suggests strongest source
5. Add "Manual Target" mode with frequency band selection

**Success Criteria:**
- Users can select which sound to focus on
- Clear visual indication of selected source
- Auto-focus suggests reasonable defaults

#### 2.3 Preset System
**Task:** Allow users to save and load configurations

**Steps:**
1. Create preset data structure
2. Add save/load functionality with localStorage
3. Include common presets (Restaurant, Street, Lecture)
4. Add custom preset creation
5. Implement preset switching UI

**Success Criteria:**
- Users can save custom settings
- Common presets available
- Presets persist between sessions

## Phase 3: Performance & Polish (Weeks 5-6)

### Objective
Optimize for real-world use and prepare for broader testing.

### Key Deliverables

#### 3.1 Performance Optimization
**Task:** Reduce latency and improve efficiency

**Steps:**
1. Profile audio processing pipeline
2. Optimize chunk sizes for best latency/quality tradeoff
3. Implement Web Workers for audio processing
4. Add CPU usage monitoring
5. Create low-power mode for battery conservation

**Success Criteria:**
- End-to-end latency < 150ms
- CPU usage < 30% on modern hardware
- Memory usage stable over time

#### 3.2 Advanced Audio Features
**Task:** Add audio enhancement beyond basic noise suppression

**Steps:**
1. Implement dynamic range compression
2. Add EQ controls (low/mid/high)
3. Create "Depth" control for low-frequency enhancement
4. Add "Clarity" control for mid/high emphasis
5. Implement limiter to prevent clipping

**Success Criteria:**
- Enhanced audio quality with multiple controls
- Controls provide meaningful improvements
- No audio artifacts introduced

#### 3.3 Testing & Documentation
**Task:** Ensure quality and prepare for open-source release

**Steps:**
1. Create comprehensive test suite
2. Add unit tests for audio processing
3. Create integration tests for WebSocket
4. Write user guide and tutorials
5. Update all documentation

**Success Criteria:**
- Test coverage > 70%
- All critical paths tested
- Documentation complete for new contributors

## Technical Implementation Details

### Model Integration Approach

```typescript
// In audioProcessor.ts
async loadModel(modelPath: string): Promise<void> {
  try {
    this.session = await InferenceSession.create(modelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all'
    });
    this.modelLoaded = true;
  } catch (error) {
    console.error('Model loading failed:', error);
    this.modelLoaded = false;
    // Continue with simple processing
  }
}
```

### Audio Chunk Optimization

**Current:** 4096 samples @ 44.1kHz = ~93ms chunks  
**Target:** 1024 samples = ~23ms chunks (for lower latency)

### WebSocket Protocol Enhancements

```json
// Add metadata to audio messages
{
  "type": "audio",
  "audioData": [...],
  "metadata": {
    "sampleRate": 44100,
    "channels": 1,
    "chunkSize": 1024,
    "timestamp": 1234567890
  }
}
```

## Risk Assessment

### High Risk
1. **Model Performance:** ONNX models may not perform well on all hardware
   *Mitigation:* Test on various CPUs, provide fallback options

2. **Latency Issues:** Real-time constraints may be challenging
   *Mitigation:* Implement adaptive chunk sizing, offer quality vs latency tradeoffs

3. **Browser Compatibility:** Web Audio API varies across browsers
   *Mitigation:* Target Chrome/Edge first, add polyfills for others

### Medium Risk
1. **Audio Quality:** Processing may introduce artifacts
   *Mitigation:* Extensive testing with diverse audio samples

2. **Memory Leaks:** Long-running audio processing may leak
   *Mitigation:* Implement proper cleanup, add memory monitoring

## Success Metrics

### Quantitative
- **Latency:** < 150ms end-to-end
- **Noise Reduction:** > 10dB SNR improvement
- **CPU Usage:** < 30% on 4-core CPU
- **Memory Usage:** < 500MB after 1 hour
- **Test Coverage:** > 70%

### Qualitative
- Users can clearly hear target voice in noisy environment
- Interface is intuitive and responsive
- Setup time < 30 seconds for new users
- Positive feedback from test users

## Resource Requirements

### Development
- **Frontend:** 80 hours (UI/UX, visualization)
- **Backend:** 60 hours (audio processing, optimization)
- **Testing:** 40 hours (test suite, validation)
- **Documentation:** 20 hours

### Infrastructure
- **Test Audio Samples:** Various noise environments
- **Hardware:** Multiple test devices (low/mid/high-end)
- **Model Hosting:** Repository for ONNX models

## Timeline

### Week 1-2: Core Audio Processing
- Days 1-3: Model acquisition and integration
- Days 4-7: Audio pipeline testing
- Days 8-10: Error handling implementation

### Week 3-4: User Experience
- Days 11-14: Audio visualization
- Days 15-18: Source selection UI
- Days 19-21: Preset system

### Week 5-6: Performance & Polish
- Days 22-25: Performance optimization
- Days 26-28: Advanced audio features
- Days 29-30: Testing and documentation

## Next Phase Kickoff Checklist

- [ ] Obtain RNNoise ONNX model
- [ ] Set up test audio samples library
- [ ] Configure performance profiling tools
- [ ] Create test harness framework
- [ ] Schedule weekly progress reviews
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Create project board for task tracking

## Conclusion

This plan transforms OpenVox from infrastructure to functional application. By focusing on real audio processing models first, we'll demonstrate actual value before adding advanced features. The phased approach allows for iterative improvement and early validation of the core value proposition: real-time sound isolation for everyday use.