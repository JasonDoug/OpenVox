# One-Pager: "Targeted Super-Hearing" — Real-time Sound Isolation App

Purpose
- Build a mobile app that goes beyond simple amplification and EQ. It analyzes the incoming audio stream and isolates target sounds (for example: a deep male voice in another room) while suppressing competing noise (traffic, crowd, HVAC). The goal is practical, low-latency, privacy-preserving real-time "bionic hearing" that helps users clearly hear focus sources in noisy environments.

Problem Statement
- Existing "super hearing" apps amplify sound or provide static equalizers, but users struggle to extract a specific target sound from complex environments. Users need an intuitive, reliable way to isolate and listen to one voice or sound source in real time without manual trial-and-error EQ fiddling.

Target Audience
- Primary: People with mild-to-moderate hearing difficulty who want situational amplification and source isolation (not full hearing-aid replacement).
- Secondary: Students, journalists, caregivers, field researchers, security personnel, and hobbyists who need to listen to a particular voice or sound (e.g., lecture across a hall, interview in a busy street).
- Regulatory/Enterprise users: Assisted-living providers, court reporters, broadcast engineers (later stage).

Ideal Customer Persona
- "Anna, 48, caregiver": Mild hearing difficulty in noisy environments (e.g., crowded dining hall). Wants to clearly hear a resident's voice without asking the whole room to be quiet. Uses smartphone + Bluetooth buds. Values privacy, simple UX, short setup.
- Key needs: fast configuration, reliable isolation, minimal battery drain, transparent privacy controls.

Product Goals
- End-user: Hear a chosen source clearly in real time with minimal latency and intuitive controls.
- Product: Deliver an MVP with a high success rate in common real-world scenarios (restaurants, street noise, car traffic).
- Engineering: Run primarily on-device if possible; fall back to cloud for complex models with explicit consent.

Platform & Hardware
- Primary platforms: iOS and Android (native), with shared model layer.
- Input sources: phone built-in mic(s), Bluetooth headphones/microphones, external USB/Lightning mics, multi-mic earbuds (preferred for beamforming).
- Output: phone speaker, wired headphones, Bluetooth earbuds. Provide option to record processed audio.
- Recommended baseline hardware: modern mid-to-high-end phones (ARM Cortex A75+ or Apple A-series) for on-device ML; graceful degradation for lower-end devices.

Core User Flow (MVP)
1. Launch app → Quick permissions (mic, optionally Bluetooth).
2. Choose mode:
   - Auto-Focus: app analyzes environment and suggests the strongest distinct sources.
   - Manual Target: user selects a profile (e.g., "deep male voice", "female voice", "child", "instrument") or records a short target sample.
3. Visual assist: live spectrogram/waveform with clickable regions (tap frequency band or visual source to “focus”).
4. Engage Focus: app enhances target source and suppresses background. Real-time slider for Focus Strength (tradeoff: isolation vs naturalness).
5. Monitoring & adjustments: EQ sliders, "Depth" (low boost for deep voices), "Clarity" (mid/high emphasis), Noise Reduction toggle.
6. Save profile: persist custom presets for locations/people.
7. Optional: record session (processed audio), export/share, or turn on temporary “listen only” mode for low-power continuous monitoring.

MVP Feature Set
- Real-time directional & source-aware noise suppression.
- Target selection: presets (gender/pitch/instrument) + short-sample enrollment for "voice fingerprint" (x-vector).
- Spectrogram UI for visual selection and feedback.
- Focus Strength slider and basic EQ (low/mid/high).
- Record processed audio; save/load presets.
- On-device inference path with fallback cloud processing for unsupported devices.

Roadmap (Post-MVP)
- Multi-speaker separation with user-selectable "mix-and-match" focus.
- Support for beamforming with multi-mic earbuds and external arrays.
- Spatial audio / binaural rendering for improved localization.
- Integration/compatibility with hearing aids (via MFi, ASHA, LE Audio).
- Adaptive personalization: learns user preferences over time.
- Offline training for user-specific speaker models.
- Compliance and enterprise features: consent capture, logging, admin controls.

High-Level Technical Architecture
- Audio Capture: phone mic / Bluetooth / external mic → low-latency audio pipeline.
- Preprocessing: automatic gain control, resampling, dereverberation.
- Front-end: Voice Activity Detection (VAD), segmentation, feature extraction (STFT, Mel).
- Source Identification:
  - Option A (enrollment): compute speaker embedding (x-vector) from user-provided sample.
  - Option B (preset): select pre-trained specialty model or heuristic (gender/pitch/instrument).
- Separation/Enhancement:
  - Real-time source separation model (Conv-TasNet / DPRNN / SepFormer or smaller distilled models).
  - Beamforming module if multi-mic available (MVDR or neural beamformer).
  - Noise suppression (RNNoise / WebRTC NS) + dereverberation.
- Post-processing: EQ, limiter, dynamic range compression, binaural rendering.
- Output: real-time playback + optional record/stream.
- Model hosting: primary on-device via Core ML / TFLite with quantized models. Cloud inference option under consent for heavier models.

Model & Algorithm Suggestions
- Source separation: Conv-TasNet / DPRNN for low-latency single-channel separation; SepFormer variants for higher quality but heavier compute.
- Speaker identification: x-vector / ECAPA-TDNN for enrollment & target extraction.
- Noise suppression: RNNoise, WebRTC AEC/NS, or learned DNN suppression.
- Beamforming: Neural beamformer or classical MVDR when multi-mic data present.
- Optimization: quantization-aware training, pruning, knowledge distillation to fit mobile constraints.

Constraints, Risks & Considerations
- Latency: target end-to-end latency <= 50–150 ms for natural listening. Balance with separation quality.
- Battery / CPU: heavy ML models drain battery — must support low-power modes and offload options.
- Bluetooth latency/codecs: consumer Bluetooth can add latency (aptX/LE-Audio better). Warn users and recommend compatible hardware.
- Privacy & Legal: risk of enabling covert eavesdropping. Must include clear UX for consent and usage policies, regional legal review, and possibly features to prevent surreptitious recording of third parties.
- Failure modes: indistinguishable similar voices, heavily reverberant spaces, extreme noise levels — must fail gracefully with user-visible indicators.
- Accessibility & Ethical: design for assistive use; consider opt-in explicit disclaimers. Add guardrails for misuse.

Success Metrics
- Objective:
  - SNR improvement (dB) for target source vs baseline.
  - SI-SDR / SDR gains for separated target.
  - Real-time latency (ms).
  - CPU/GPU usage and battery impact per hour.
- Subjective:
  - Mean Opinion Score (MOS) for clarity/naturalness.
  - User task success rate (e.g., correct comprehension of sentences in noisy tests).
  - Retention and frequency of use.
- Safety/Compliance:
  - Incidents of misuse reported.
  - Consent capture rate.

Data & Privacy
- On-device user enrollment samples stored securely, optionally encrypted.
- Training data: synthetic mixtures and labeled multi-speaker corpora (LibriMix, WHAM!, VCTK, CHiME, FSD50K for non-speech).
- Anonymization and opt-in for any cloud collection; transparent privacy policy.
- Provide "local-only" mode that disables cloud entirely.

Engineering & Integration Notes
- Native audio APIs: Android (AudioRecord, AAudio, NDK), iOS (AVAudioEngine, Core Audio) for low-latency paths.
- ML runtimes: Core ML with Core ML Tools for iOS; TFLite/NNAPI for Android; consider ONNX for cross-platform model portability.
- Use hardware DSP or NN accelerators where available (Apple Neural Engine, Android NNAPI).
- Consider leveraging open-source tools: WebRTC AEC/NS, RNNoise, Librosa/torchaudio for offline tools and evaluation.
- Bluetooth support: handle clock drift, latency compensation, and codec detection.

UX Considerations & Guardrails
- Simple onboarding: explain limitation and ethical use.
- Visual feedback: spectrogram and “target lock” indicator.
- Quick presets for common contexts: Restaurant, Street, Lecture, Meeting, One-on-One.
- Consent flow: encourage users to get consent before using in other people's private conversations; provide warnings.
- Fail-safe: if confidence in target isolation drops, notify user and allow quick toggling to full amplification or mute.

Next Steps & Recommended Plan
1. Discovery (1–2 weeks): technical feasibility spike — test on-device low-latency inference with candidate models and sample hardware.
2. Data & Privacy Review (1–2 weeks): legal check for eavesdropping laws and in-app consent requirements.
3. Prototype MVP (6–10 weeks):
   - Capture pipeline, VAD, simple pretrained separation, basic spectrogram UI, presets, enrollment flow.
   - Evaluate on benchmark mixes and lab user tests.
4. Pilot & Usability Testing (2–4 weeks): recruit real users (hearing-impaired and target personas) for listening tests; iterate UX.
5. Production Hardening (6–8 weeks): optimization, packaging, background mode, battery improvements, add cloud fallback if needed.
6. Launch & Monitoring: gather metrics, track misuse reports, iterate.

Team & Stakeholders to Engage
- Product Manager: prioritize features, acceptance criteria, and persona requirements.
- ML Engineers: model selection, on-device optimization, benchmark testing.
- Mobile Engineers (iOS/Android): audio pipeline, native integration, UX.
- Audio Engineers: tuning, perceptual testing, beamforming.
- Legal & Compliance: privacy, consent, regional laws.
- UX/Design: accessibility, spectrogram and consent UI.
- QA & User Research: controlled tests and pilot feedback.

Acceptance Criteria for Initial Stakeholder Conversation
- Demonstrable prototype that separates and enhances a target voice in common real-world scenarios with <150 ms latency and measurable SNR improvement.
- Clear plan for on-device-first inference with cloud fallback and documented privacy/legal strategy.
- Defined MVP scope, resource estimates, and timeline for prototype and pilot.

Appendix — Example User Scenarios
- Restaurant: Anna selects "Auto-Focus" → app suggests two distinct voices; she taps the deeper voice region → Focus Strength 70% → hears target clearly without raising volume.
- Street interview: Reporter enrolls subject's voice for 5 seconds → app uses x-vector to prioritize that voice in subsequent recording while traffic is suppressed.
- Lecture Hall: Student saves a preset for "lecturer voice" and reuses it across classes; app adapts to room noise.

Contact / Decision Points for Product & Eng
- Approve MVP scope and privacy guardrails.
- Decide on on-device-only vs hybrid cloud approach.
- Allocate budget for dataset curation and user testing.
- Select priority hardware targets (iPhone recent gen, top Android models).

End of One-Pager — ready for product & engineering discussion.