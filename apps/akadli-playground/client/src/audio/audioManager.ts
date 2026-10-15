/**
 * Client Audio Manager for Voice Calling
 * Handles Web Audio warmup, 16kHz PCM mic streaming, 24kHz PCM / MP3 playback,
 * and live canvas waveform visualization.
 */
export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private nextPlayTime = 0;
  private isMuted = false;
  private animFrameId: number | null = null;

  public getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    return this.audioCtx;
  }

  /**
   * Warmup function triggered by user click on Standby screen
   * Unlocks iOS/Android audio autoplay policies and pre-authorizes microphone permissions.
   */
  public async warmup(): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Request microphone permission ahead of time
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Keep stream warm or stop tracks temporarily
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.warn('Microphone permission / warmup failed:', err);
      return false;
    }
  }

  /**
   * Starts capturing microphone and streaming raw 16kHz PCM audio
   */
  public async startMicrophone(
    onAudioChunk: (base64Pcm: string) => void
  ): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.micSource = ctx.createMediaStreamSource(this.micStream);
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;

    // Use ScriptProcessor for real-time 16kHz PCM conversion
    const bufferSize = 2048;
    this.processorNode = ctx.createScriptProcessor(bufferSize, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (this.isMuted) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const inputSampleRate = ctx.sampleRate;
      const targetSampleRate = 16000;

      // Downsample to 16kHz PCM
      const downsampled = this.downsampleBuffer(
        inputData,
        inputSampleRate,
        targetSampleRate
      );

      // Convert Float32 to 16-bit PCM
      const pcm16 = new Int16Array(downsampled.length);
      for (let i = 0; i < downsampled.length; i++) {
        const s = Math.max(-1, Math.min(1, downsampled[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Convert to base64
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      onAudioChunk(base64);
    };

    this.micSource.connect(this.analyserNode);
    this.micSource.connect(this.processorNode);
    // Connect to destination to keep processor node running (silent)
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0;
    this.processorNode.connect(silentGain);
    silentGain.connect(ctx.destination);
  }

  /**
   * Resamples an audio buffer from inputRate to outputRate
   */
  private downsampleBuffer(
    buffer: Float32Array,
    inputRate: number,
    outputRate: number
  ): Float32Array {
    if (inputRate === outputRate) return buffer;
    if (outputRate > inputRate) return buffer;

    const ratio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i++
      ) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  /**
   * Smoothly plays incoming 16-bit PCM chunks (e.g. 24kHz from Gemini Live)
   */
  public playPcmChunk(base64Pcm: string, sampleRate = 24000) {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);

      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Connect to analyser for output wave rendering too
      if (this.analyserNode) {
        source.connect(this.analyserNode);
      }
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
    } catch (err) {
      console.warn('Error playing PCM chunk:', err);
    }
  }

  /**
   * Plays MP3 audio buffer from ElevenLabs or OpenAI TTS
   */
  public async playMp3Chunk(base64Mp3: string) {
    const ctx = this.getAudioContext();
    try {
      const binary = atob(base64Mp3);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.analyserNode) {
        source.connect(this.analyserNode);
      }
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
    } catch (err) {
      console.warn('Error playing MP3 chunk:', err);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  /**
   * Renders dynamic waveform on HTML canvas
   */
  public startVisualizer(canvas: HTMLCanvasElement) {
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const render = () => {
      this.animFrameId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx2d.clearRect(0, 0, width, height);

      if (!this.analyserNode) {
        // Draw idle line
        ctx2d.strokeStyle = 'rgba(100, 116, 139, 0.4)';
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.moveTo(0, height / 2);
        ctx2d.lineTo(width, height / 2);
        ctx2d.stroke();
        return;
      }

      const bufferLength = this.analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyserNode.getByteTimeDomainData(dataArray);

      // Draw glowing wave
      ctx2d.lineWidth = 3;
      ctx2d.strokeStyle = '#10b981';
      ctx2d.shadowBlur = 8;
      ctx2d.shadowColor = '#10b981';

      ctx2d.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx2d.moveTo(x, y);
        } else {
          ctx2d.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx2d.lineTo(width, height / 2);
      ctx2d.stroke();
      ctx2d.shadowBlur = 0; // Reset
    };

    render();
  }

  public stopVisualizer() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public stopAll() {
    this.stopVisualizer();
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.nextPlayTime = 0;
  }
}
