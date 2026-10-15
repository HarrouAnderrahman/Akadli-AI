import {
  FinalizeOrderDecision,
  OrderPayload,
  TranscriptTurn,
  VoiceConfig,
} from '../../../shared/types.js';

export interface EngineCallbacks {
  onTranscript: (turn: TranscriptTurn) => void;
  onAudioOutput?: (audioData: Buffer | string, sampleRate?: number, format?: 'pcm16' | 'mp3') => void;
  onOrderFinalized: (decision: FinalizeOrderDecision) => void;
  onError: (error: Error) => void;
  onCallEnd: (reason?: string) => void;
}

export interface SessionInitResult {
  engine: string;
  clientMode: 'client-managed' | 'server-streamed';
  connectionDetails?: {
    signedUrl?: string;
    agentId?: string;
    dynamicVariables?: Record<string, any>;
    customGreeting?: string;
    instructions?: string;
    useAgentDefaults?: boolean;
    voiceId?: string;
  };
}

export interface VoiceEngineAdapter {
  readonly engineType: string;
  initiateSession(
    order: OrderPayload,
    config: VoiceConfig,
    callbacks: EngineCallbacks
  ): Promise<SessionInitResult>;

  processAudioInput?(chunk: Buffer): Promise<void>;
  processAudioUtterance?(audioBuffer: Buffer): Promise<void>;
  processTextInput?(text: string): Promise<void>;
  endSession(): Promise<void>;
}
