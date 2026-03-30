# AI Powered Superhearing App
**Name Suggestions**
- MetaVox
- UberVox
- Vocce
- Dipthong


**Concept**
===========
There are plenty of "superhearing" mobile apps, that can use the phone's mic or bluetooth mic, boost/amplify the sound, record/transcribe and even provide an equalizer with presets and sliders. However, most of the presets don't perfectly match the desired sound to be isolated/amplified and using the manual equalizer isn't much better. Having an AI automatically detect different sounds within the wave form and prompt the user to select what they want isolated/amplified would be ideal. For example, a deep male voice on the other side of a wall, or a female voice across the table but with lots of traffic noise, the app could isolate only the deep male voice or  remove/deaden only the traffic noise to make the female speaker  more easily understood. Several add-ons should be developed after core app is done. The killer app would be to pair this softwaqre with AR glasses and display real-time "closed captions"

**Elevator Pitch**
==================
Real-time speech enhancement with AI powered adaptive noise suppression and voice amplification and isolation so users can hear conversations in noisy environements or in the distant separated by walls. User adjustable Equalizer with presets and savable new settings. Ability to record, transcribe and provide searchable logs.  


## Requirements
**MODES / EDITIONS**
Regular Edition

Users are situational without a diagnosed hearing condition for use to hear conversations in the distance, while traveling, at converts, while shopping for those seeking "super hearing" without medical issues.

**Use Case**
- Watching TV, Boost dialog without increasing volume
- One on One Conversations
- Listen in on distant or wall occluded conversations without being noticed
- Outdoor listening for personal safety and increase of situational awareness

**Professional**
Professional mode for field professionals, journalists, private investigators, researchers, birdwatchers and security professions with directional pickup and lossless recording. Voicc Acivtation and bluetooth connection to a single ear fob for a makeshit "bug"


Medical
Attempt to replicate medical hearing aid functionality as close as possible with the features from the regular edition for AI frequency isolation.
or those hard of hearing persons to use as a makeshit or backup hearing


or make same features more granular and availble via extensions:
**Extensions*
- Birdwatcher  - AI can recognize, record and learn birdsong/birdcalls to identify species
- OSINT
- Lecture/Meetingrecording, transcriptions, notes, insights, diarization
- Interviews
- Field Recording
- Note Taking
- Directional Pickup Microphone Support
- Record audio/speech in noisy environments

Users:
- Situational listeners with normal hearing who need on-demand amplification in noisy environments—commuters, travelers, restaurant-goers, concert attendees—seeking temporary ‘super hearing’ without medical claims.
- Field professionals who require discreet, high-fidelity live listening and recording—journalists, researchers, birdwatchers, and security personnel—prioritizing directional pickup and lossless recording.
- Students and business professionals who want meeting/lecture amplification plus reliable recording and transcription for note-taking and review.
- Older adults (60+) with mild-to-moderate age-related hearing loss who want simple, everyday amplification for conversations at home, on the phone, and in public.


The app should let a user identify the “target” sound to isolate in multiple ways, depending on usage configuration and UI settings. For example, by default it should be automatic. Initially develop Automatic Ident for Phase 1/MVP

- Automatic multi-source detection with selectable source cards: the app runs realtime source separation, displays 2-4 detected sources as labeled cards or meters (e.g., Source A: voice, Source B: music), and the user taps the card for the source they want isolated.

Other methods could be:
- Point the phone camera at a person or object and tap them in the camera view: use audio-visual source separation to link the selected visible source to the audio stream and isolate their sound.

- Tap a live spectrogram/waveform: user taps or draws over the part of the visual audio representation where the target sound appears to "capture" its spectral fingerprint; app then boosts and isolates matching spectral features.

- Pick a sound category preset from a short list (e.g., Soeech — Male/Female, Music, Baby/Child, Siren): the app applies a tuned ML model and EQ/filters for that category to isolate and amplify the target.

- Record a short sample (3-10 seconds) of the target sound or voice as a reference: the user taps a "Sample" button near the source and the app uses that clip as a template to match and isolate the same source in the live stream.

Provide various latency settings based on Edition or Tier. Target 150 to 300ms for MVP

<60 ms — very low latency; excellent for natural, real-time conversation and most live listening use cases; achievable with optimized DSP and modern Bluetooth LE audio ———

<150 ms — moderate latency; a small echo or lip-sync lag may be noticeable but acceptable for many speech-only listening scenarios

<300 ms — noticeable delay; tolerable for non-interactive monitoring (e.g., distant environmental amplification) but suboptimal for conversational use

<500 ms — high latency; only acceptable when interaction isn't required (e.g., delayed monitoring or heavy processing for advanced noise reduction)





