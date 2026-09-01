/**
 * SprintForge WebRTC Architecture & Audio Analysis Utilities
 * 100% Free Open Web Technologies (Native WebRTC + Web Audio API)
 */

export interface RTCConfigurationWithFallback {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
}

/**
 * Returns resilient STUN/TURN configuration.
 * Uses public Google & Cloudflare STUN servers by default.
 * Optionally incorporates TURN servers if configured in environment.
 */
export const getWebRTCConfig = (): RTCConfigurationWithFallback => {
  const iceServers: RTCIceServer[] = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
    {
      urls: ['stun:stun.cloudflare.com:3478'],
    },
  ];

  // Optional TURN support via public env variables
  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL?.trim();
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME?.trim();
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim();

  if (turnUrl) {
    const turnServer: RTCIceServer = {
      urls: turnUrl.split(',').map((u) => u.trim()),
    };
    if (turnUsername) turnServer.username = turnUsername;
    if (turnCredential) turnServer.credential = turnCredential;
    iceServers.push(turnServer);
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
  };
};

/**
 * Check if the current browser environment supports WebRTC
 */
export const isWebRTCSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    window.RTCPeerConnection &&
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

export type ConnectionQualityStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface QualityMetrics {
  quality: ConnectionQualityStatus;
  rttMs: number;
  packetsLost: number;
  packetsTotal: number;
  packetLossPercent: number;
  bitrateKbps: number;
}

/**
 * Analyzes WebRTC RTCPeerConnection stats to determine network quality
 */
export const getPeerConnectionQuality = async (
  pc: RTCPeerConnection | null
): Promise<QualityMetrics> => {
  if (!pc || pc.connectionState !== 'connected') {
    return {
      quality: 'unknown',
      rttMs: 0,
      packetsLost: 0,
      packetsTotal: 0,
      packetLossPercent: 0,
      bitrateKbps: 0,
    };
  }

  try {
    const stats = await pc.getStats();
    let rttMs = 0;
    let packetsLost = 0;
    let packetsReceived = 0;
    let bytesReceived = 0;

    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rttMs = Math.round((report.currentRoundTripTime || report.totalRoundTripTime || 0) * 1000);
      }
      if (report.type === 'inbound-rtp') {
        packetsLost += report.packetsLost || 0;
        packetsReceived += report.packetsReceived || 0;
        bytesReceived += report.bytesReceived || 0;
      }
    });

    const packetsTotal = packetsLost + packetsReceived;
    const packetLossPercent = packetsTotal > 0 ? (packetsLost / packetsTotal) * 100 : 0;
    const bitrateKbps = Math.round((bytesReceived * 8) / 1000);

    let quality: ConnectionQualityStatus = 'excellent';

    if (rttMs > 450 || packetLossPercent > 8) {
      quality = 'poor';
    } else if (rttMs > 250 || packetLossPercent > 3) {
      quality = 'fair';
    } else if (rttMs > 120 || packetLossPercent > 1) {
      quality = 'good';
    } else {
      quality = 'excellent';
    }

    return {
      quality,
      rttMs,
      packetsLost,
      packetsTotal,
      packetLossPercent: Math.round(packetLossPercent * 10) / 10,
      bitrateKbps,
    };
  } catch (err) {
    return {
      quality: 'unknown',
      rttMs: 0,
      packetsLost: 0,
      packetsTotal: 0,
      packetLossPercent: 0,
      bitrateKbps: 0,
    };
  }
};

/**
 * Web Audio API based Microphone Level & Volume Analyzer
 * Measures real-time audio energy without recording or saving data.
 */
export class AudioMeter {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private onLevelCallback: (level: number) => void;
  private isRunning: boolean = false;

  constructor(stream: MediaStream, onLevel: (level: number) => void) {
    this.onLevelCallback = onLevel;
    this.init(stream);
  }

  private init(stream: MediaStream) {
    try {
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.isRunning = true;
      this.tick();
    } catch (err) {
      console.warn('Audio meter initialization error:', err);
    }
  }

  private tick = () => {
    if (!this.isRunning || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    // Map average amplitude (0-255) to 0-100%
    const normalized = Math.min(100, Math.round((avg / 128) * 100));

    this.onLevelCallback(normalized);
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch {}
      this.source = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.onLevelCallback(0);
  }
}

/**
 * Web Audio Synthesized Ringtones & Notification Chimes
 * Respects browser autoplay restrictions and plays pleasant non-annoying tones.
 */
export class SoundEffects {
  private static ringIntervalId: NodeJS.Timeout | null = null;

  /**
   * Play an outgoing or incoming call soft melody chime
   */
  public static playCallingChime() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Soft marimba-like harmony (440Hz A4 + 554.37Hz C#5)
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(554.37, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch {}
  }

  /**
   * Start periodic incoming call ringtone (plays every 2.8 seconds)
   */
  public static startIncomingRingtone() {
    this.stopIncomingRingtone();
    this.playCallingChime();
    this.ringIntervalId = setInterval(() => {
      this.playCallingChime();
    }, 2800);
  }

  /**
   * Stop ringtone immediately
   */
  public static stopIncomingRingtone() {
    if (this.ringIntervalId) {
      clearInterval(this.ringIntervalId);
      this.ringIntervalId = null;
    }
  }

  /**
   * Short pleasant "Connected" audio feedback
   */
  public static playCallConnectedSound() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.24); // G5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Short gentle "Call Ended" audio feedback
   */
  public static playCallEndedSound() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.18); // A4

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }
}
