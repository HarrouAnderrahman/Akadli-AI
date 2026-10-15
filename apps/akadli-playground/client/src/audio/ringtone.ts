/**
 * Web Audio API synthesized telephone ringtone
 * Generates classic dual-tone multi-frequency ring pattern (440Hz + 480Hz)
 * without needing external MP3 asset files.
 */
export class RingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalTimer: number | null = null;
  private isPlaying = false;

  constructor(audioContext?: AudioContext) {
    if (audioContext) {
      this.audioCtx = audioContext;
    }
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public start() {
    if (this.isPlaying) return;
    this.initContext();
    if (!this.audioCtx) return;

    this.isPlaying = true;

    // Start cadence: 1.5s ringing, 2s silence
    this.playCadenceBurst();
    this.intervalTimer = window.setInterval(() => {
      if (this.isPlaying) {
        this.playCadenceBurst();
      }
    }, 3500);

    // Trigger mobile vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 300, 500, 2200]);
      } catch (e) {}
    }
  }

  private playCadenceBurst() {
    if (!this.audioCtx || !this.isPlaying) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Standard North African / European telephone cadence frequencies
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.setValueAtTime(0.15, now + 1.4);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);

      // Trigger periodic vibration with burst
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([400, 200, 400]);
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Ringtone play error:', err);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }
}
