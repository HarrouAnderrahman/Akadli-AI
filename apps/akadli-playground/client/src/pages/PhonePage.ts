import {
  CallState,
  FinalizeOrderDecision,
  OrderPayload,
  TranscriptTurn,
  VoiceConfig,
  WSMessage,
} from '../../../shared/types.js';
import { AudioManager } from '../audio/audioManager.js';
import { RingtonePlayer } from '../audio/ringtone.js';
import { Conversation } from '@elevenlabs/client';
import { validateLocation } from '../../../shared/algeria2026.js';
import {
  iconCheck,
  iconMic,
  iconMicOff,
  iconPhone,
  iconPhoneOff,
  iconVolume2,
} from '../ui/icons.js';

export class PhonePage {
  private container: HTMLElement;
  private ws: WebSocket | null = null;
  private audioManager: AudioManager;
  private ringtonePlayer: RingtonePlayer;
  private currentCallState: CallState = 'standby';
  private currentOrder: OrderPayload | null = null;
  private currentConfig: VoiceConfig | null = null;
  private callDurationSeconds = 0;
  private callTimerInterval: number | null = null;
  private isMuted = false;
  private hasAudioWarmup = false;
  private finalizedDecision: FinalizeOrderDecision | null = null;
  private elevenConversation: any = null;
  private isAnswering = false;
  private isStartingSession = false;
  private activeSessionToken: string | null = null;
  private lastAnswerTimestamp = 0;
  private hasFinalizedOrder = false;
  private hasAgentSpokenGoodbye = false;
  private activeConversationId: string | null = null;
  private goodbyeHangupTimer: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.audioManager = new AudioManager();
    this.ringtonePlayer = new RingtonePlayer(this.audioManager.getAudioContext());
  }

  public mount() {
    this.render();
    this.initWebSocket();
  }

  private initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.ws?.send(
        JSON.stringify({
          type: 'REGISTER',
          data: { role: 'phone' },
        })
      );
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        await this.handleWsMessage(msg);
      } catch (err) {
        console.error('[Phone] WS Message error:', err);
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.initWebSocket(), 2000);
    };
  }

  private async handleWsMessage(msg: WSMessage) {
    switch (msg.type) {
      case 'CALL_RINGING': {
        if (
          this.currentCallState === 'active' ||
          this.isStartingSession ||
          this.elevenConversation
        ) {
          console.warn('[Phone] Already active, ignoring incoming CALL_RINGING.');
          break;
        }
        this.isAnswering = false;
        this.isStartingSession = false;
        this.activeSessionToken = null;
        this.activeConversationId = null;
        this.currentOrder = msg.data.payload;
        this.currentConfig = msg.data.config;
        this.finalizedDecision = null;
        this.transitionToState('ringing');
        break;
      }

      case 'CALL_ANSWERED': {
        if (
          this.currentCallState === 'active' ||
          this.isStartingSession ||
          this.elevenConversation
        ) {
          console.warn('[Phone] Call already active or session starting, ignoring duplicate CALL_ANSWERED.');
          break;
        }
        this.currentOrder = msg.data.payload;
        this.currentConfig = msg.data.config;
        await this.startActiveCall(msg.data.sessionInfo);
        break;
      }

      case 'TRANSCRIPT_UPDATE': {
        if (msg.data?.turn) {
          this.displayTranscript(msg.data.turn);
        }
        break;
      }

      case 'ORDER_FINALIZED': {
        this.finalizedDecision = msg.data.decision;
        this.hasFinalizedOrder = true;
        // Keep call active so agent can speak closing statement
        break;
      }

      case 'CALL_ENDED': {
        this.transitionToState('ended');
        break;
      }
    }
  }

  private transitionToState(state: CallState) {
    this.currentCallState = state;

    if (state !== 'active') {
      this.isAnswering = false;
      this.isStartingSession = false;
      this.activeSessionToken = null;
      if (this.goodbyeHangupTimer !== null) {
        clearTimeout(this.goodbyeHangupTimer);
        this.goodbyeHangupTimer = null;
      }
      this.stopCallTimer();
      this.audioManager.stopAll();
      if (this.elevenConversation) {
        try {
          this.elevenConversation.endSession();
        } catch (e) {}
        this.elevenConversation = null;
      }
    }

    if (state === 'ringing') {
      this.ringtonePlayer.start();
    } else {
      this.ringtonePlayer.stop();
    }

    this.render();

    if (state === 'ended') {
      setTimeout(() => {
        if (this.currentCallState === 'ended') {
          this.transitionToState('standby');
        }
      }, 3500);
    }
  }

  private async startActiveCall(sessionInfo?: any) {
    if (this.currentCallState === 'active' || this.isStartingSession || this.elevenConversation) {
      console.warn('[Phone] Already active or starting session, ignoring duplicate startActiveCall.');
      return;
    }

    this.isStartingSession = true;
    this.isAnswering = true;
    this.hasFinalizedOrder = false;
    this.hasAgentSpokenGoodbye = false;
    this.activeConversationId = null;
    const sessionToken = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.activeSessionToken = sessionToken;

    if (this.elevenConversation) {
      try {
        await this.elevenConversation.endSession();
      } catch (e) {}
      this.elevenConversation = null;
    }
    this.audioManager.stopAll();

    this.transitionToState('active');
    this.startCallTimer();

    try {
      const details = sessionInfo?.connectionDetails;
      const canvas = this.container.querySelector(
        '#audio-waveform-canvas'
      ) as HTMLCanvasElement;
      if (canvas) {
        this.audioManager.startVisualizer(canvas);
      }

      const sessionOptions: any = details?.signedUrl
        ? {
            signedUrl: details.signedUrl,
            dynamicVariables: details?.dynamicVariables,
          }
        : {
            agentId: details?.agentId || 'agent_9001m4xheghje0d8wkdndaak18pc',
            dynamicVariables: details?.dynamicVariables,
          };

      if (!details?.useAgentDefaults && details?.voiceId) {
        sessionOptions.overrides = {
          tts: {
            voiceId: details.voiceId,
          },
        };
      }

      sessionOptions.clientTools = {
        finalize_order_decision: async (parameters: any) => {
          console.log('[Phone] Client Tool finalize_order_decision:', parameters);
          this.hasFinalizedOrder = true;
          if (parameters.final_commune) {
            const locCheck = validateLocation(
              parameters.final_commune,
              parameters.final_wilaya
            );
            if (locCheck.valid && locCheck.matchedWilayaName) {
              parameters.final_wilaya = locCheck.matchedWilayaName;
              parameters.final_commune = locCheck.matchedCommuneName || parameters.final_commune;
            } else if (!locCheck.valid && locCheck.suggestion) {
              parameters.reason_or_notes =
                (parameters.reason_or_notes ? parameters.reason_or_notes + '. ' : '') +
                `[Location Note: ${locCheck.error}]`;
            }
          }

          const conversationId = this.getConversationId();
          this.ws?.send(
            JSON.stringify({
              type: 'ORDER_FINALIZED',
              data: {
                decision: parameters,
                conversationId,
              },
            })
          );
          return 'Order recorded successfully in system.';
        },

        validate_delivery_location: async (parameters: {
          commune: string;
          wilaya?: string;
        }) => {
          console.log('[Phone] Client Tool validate_delivery_location:', parameters);
          const result = validateLocation(parameters.commune, parameters.wilaya);
          if (result.valid) {
            return JSON.stringify({
              valid: true,
              commune: result.matchedCommuneName,
              wilaya: result.matchedWilayaName,
              message: `Commune '${result.matchedCommuneName}' is valid in Wilaya ${result.matchedWilayaName}.`,
            });
          } else {
            return JSON.stringify({
              valid: false,
              commune: parameters.commune,
              error: result.error,
              suggestion: result.suggestion || null,
            });
          }
        },
      };

      sessionOptions.onConnect = (props: any) => {
        const convId = typeof props === 'string' ? props : props?.conversationId;
        if (convId) {
          this.activeConversationId = convId;
        }
      };

      sessionOptions.onMessage = (message: any) => {
        const isAgent = message.source === 'ai' || message.role === 'agent';
        const text = typeof message.message === 'string' ? message.message.trim() : '';
        if (!text) return;

        if (this.hasFinalizedOrder && isAgent) {
          this.hasAgentSpokenGoodbye = true;
        }

        this.ws?.send(
          JSON.stringify({
            type: 'TRANSCRIPT_UPDATE',
            data: {
              conversationId: this.getConversationId(),
              turn: {
                id: `eleven-${Date.now()}`,
                speaker: isAgent ? 'agent' : 'user',
                role: isAgent ? 'agent' : 'user',
                text,
                timestamp: Date.now(),
                isFinal: true,
              },
            },
          })
        );
      };

      sessionOptions.onModeChange = ({ mode }: { mode: 'speaking' | 'listening' }) => {
        if (mode === 'speaking') {
          if (this.hasFinalizedOrder) {
            this.hasAgentSpokenGoodbye = true;
          }
          if (this.goodbyeHangupTimer !== null) {
            clearTimeout(this.goodbyeHangupTimer);
            this.goodbyeHangupTimer = null;
          }
          return;
        }

        if (this.hasFinalizedOrder && this.hasAgentSpokenGoodbye && mode === 'listening') {
          console.log('[Phone] Agent completed goodbye statement. Hanging up call in 2s...');
          if (this.goodbyeHangupTimer !== null) {
            clearTimeout(this.goodbyeHangupTimer);
          }
          this.goodbyeHangupTimer = window.setTimeout(() => {
            this.goodbyeHangupTimer = null;
            if (this.currentCallState === 'active') {
              this.ws?.send(JSON.stringify({ type: 'HANGUP_CALL' }));
            }
          }, 2000);
        }
      };

      sessionOptions.onError = (err: any) => {
        console.error('[ElevenConversation] Error:', err);
        const msg = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
        this.ws?.send(
          JSON.stringify({
            type: 'ERROR',
            data: { message: `ElevenLabs Agent error: ${msg}` },
          })
        );
      };

      sessionOptions.onDisconnect = () => {
        this.ws?.send(JSON.stringify({ type: 'HANGUP_CALL' }));
      };

      const conversation = await Conversation.startSession(sessionOptions);

      if (
        this.activeSessionToken !== sessionToken ||
        (this.currentCallState as string) !== 'active'
      ) {
        console.warn('[Phone] Session token changed, ending duplicate conversation.');
        try {
          await conversation.endSession();
        } catch (e) {}
        return;
      }

      this.elevenConversation = conversation;
      const convId =
        typeof conversation?.getId === 'function'
          ? conversation.getId()
          : (conversation as any)?.conversationId;
      if (convId) {
        this.activeConversationId = convId;
      }
    } catch (err: any) {
      console.error('[Phone] Session start error:', err);
      this.ws?.send(
        JSON.stringify({
          type: 'ERROR',
          data: { message: `Session start failed: ${err.message}` },
        })
      );
    } finally {
      this.isStartingSession = false;
      this.isAnswering = false;
    }
  }

  private getConversationId(): string | undefined {
    if (this.activeConversationId) {
      return this.activeConversationId;
    }
    const convId =
      typeof this.elevenConversation?.getId === 'function'
        ? this.elevenConversation.getId()
        : this.elevenConversation?.conversationId;
    if (convId) {
      this.activeConversationId = convId;
      return convId;
    }
    return undefined;
  }

  private startCallTimer() {
    this.callDurationSeconds = 0;
    this.stopCallTimer();
    this.callTimerInterval = window.setInterval(() => {
      this.callDurationSeconds++;
      const timerEl = this.container.querySelector('#active-call-timer');
      if (timerEl) {
        const mins = Math.floor(this.callDurationSeconds / 60)
          .toString()
          .padStart(2, '0');
        const secs = (this.callDurationSeconds % 60)
          .toString()
          .padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
      }
    }, 1000);
  }

  private stopCallTimer() {
    if (this.callTimerInterval !== null) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
  }

  private displayTranscript(turn: TranscriptTurn) {
    const box = this.container.querySelector('#phone-transcript-bubble');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML = `
      <div class="text-[10px] uppercase font-mono text-zinc-500 mb-0.5">
        ${turn.speaker === 'agent' ? 'Store Assistant' : 'You'}
      </div>
      <div class="text-xs text-zinc-200 leading-snug">
        ${turn.text}
      </div>
    `;
  }

  private render() {
    this.container.innerHTML = `
      <div class="min-h-screen bg-black text-zinc-100 flex flex-col justify-between p-6 max-w-sm mx-auto select-none font-sans">
        <!-- Top Status Bar -->
        <header class="w-full flex items-center justify-between text-xs text-zinc-500 pt-2 pb-4">
          <span class="font-medium text-zinc-400">Akadli-AI Playground (Local Voice & Webhook Sandbox)</span>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full ${
              this.currentCallState === 'standby'
                ? 'bg-emerald-500'
                : this.currentCallState === 'ringing'
                ? 'bg-amber-400 animate-ping'
                : 'bg-emerald-400 animate-pulse'
            }"></span>
            <span class="capitalize font-mono text-[11px] text-zinc-400">${this.currentCallState}</span>
          </div>
        </header>

        <!-- Main Screen -->
        <div class="flex-1 w-full flex flex-col items-center justify-center text-center my-auto">
          ${this.renderCurrentState()}
        </div>

        <!-- Footer -->
        <footer class="w-full text-center text-[10px] text-zinc-600 pb-2">
          Keep screen active during call
        </footer>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderCurrentState(): string {
    switch (this.currentCallState) {
      case 'standby':
        return `
          <div class="flex flex-col items-center gap-5 w-full">
            <div class="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              ${iconPhone('w-6 h-6')}
            </div>

            <div class="space-y-1">
              <h2 class="text-base font-semibold text-white">Receiver Ready</h2>
              <p class="text-xs text-zinc-500 max-w-xs">
                Waiting for an incoming confirmation call from the dashboard...
              </p>
            </div>

            <!-- Audio Warmup Button -->
            <button id="warmup-audio-btn" class="w-full h-11 px-4 rounded-lg border ${
              this.hasAudioWarmup
                ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                : 'bg-white hover:bg-zinc-200 text-zinc-950 font-medium'
            } text-xs flex items-center justify-center gap-2 transition active:scale-[0.99]">
              ${this.hasAudioWarmup ? iconCheck('w-3.5 h-3.5 text-emerald-400') : iconVolume2('w-3.5 h-3.5')}
              <span>${
                this.hasAudioWarmup
                  ? 'Audio & Microphone Ready'
                  : 'Tap to Enable Audio'
              }</span>
            </button>
          </div>
        `;

      case 'ringing':
        return `
          <div class="flex flex-col items-center justify-between h-full py-8 w-full">
            <!-- Caller Details -->
            <div class="space-y-3 pt-6">
              <div class="w-20 h-20 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-lg">
                ${iconPhone('w-8 h-8')}
              </div>

              <div>
                <h2 class="text-2xl font-semibold text-white tracking-tight">
                  ${this.currentOrder?.store_name || 'Store Service'}
                </h2>
                <p class="text-xs text-zinc-400 font-medium mt-1">
                  Incoming Order Confirmation
                </p>
              </div>

              <!-- Order Summary Pill -->
              <div class="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-0.5">
                <div class="font-medium text-white">
                  ${this.currentOrder?.item_name || 'Article'} (${this.currentOrder?.current_variant})
                </div>
                <div class="text-zinc-400 text-[11px]">
                  Qty: ${this.currentOrder?.quantity ?? 1} • Shipping: ${(this.currentOrder?.shipping_fee_da ?? this.currentOrder?.shippingFeeDa ?? 0) > 0 ? `${this.currentOrder?.shipping_fee_da ?? this.currentOrder?.shippingFeeDa} DA` : 'Free'} • Total: ${this.currentOrder?.price_da} DA • ${this.currentOrder?.current_commune}
                </div>
              </div>
            </div>

            <!-- Touch Actions (64x64px touch targets) -->
            <div class="w-full flex items-center justify-around gap-8 pt-12 pb-4">
              <!-- Decline Button -->
              <div class="flex flex-col items-center gap-2">
                <button id="decline-call-btn" aria-label="Decline" class="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg transition">
                  ${iconPhoneOff('w-7 h-7')}
                </button>
                <span class="text-xs text-zinc-400">Decline</span>
              </div>

              <!-- Answer Button -->
              <div class="flex flex-col items-center gap-2">
                <button id="answer-call-btn" aria-label="Answer" ${this.isAnswering ? 'disabled' : ''} class="w-16 h-16 rounded-full ${
                  this.isAnswering
                    ? 'bg-emerald-700 opacity-60 cursor-not-allowed pointer-events-none'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
                } text-white flex items-center justify-center shadow-lg transition">
                  ${iconPhone('w-7 h-7')}
                </button>
                <span class="text-xs ${this.isAnswering ? 'text-zinc-500 animate-pulse' : 'text-zinc-300'}">
                  ${this.isAnswering ? 'Connecting...' : 'Answer'}
                </span>
              </div>
            </div>
          </div>
        `;

      case 'active':
        return `
          <div class="flex flex-col items-center justify-between h-full py-4 w-full">
            <!-- Header & Timer -->
            <div class="space-y-1">
              <h2 class="text-lg font-semibold text-white">
                ${this.currentOrder?.store_name || 'Store Service'}
              </h2>
              <div id="active-call-timer" class="text-xs font-mono font-medium text-zinc-400">
                00:00
              </div>
            </div>

            <!-- Waveform & Transcript -->
            <div class="w-full my-auto space-y-4">
              <div class="relative w-full h-16 bg-zinc-950 rounded-xl border border-zinc-900 flex items-center justify-center overflow-hidden">
                <canvas id="audio-waveform-canvas" width="280" height="64" class="w-full h-full"></canvas>
              </div>

              <!-- Live transcript bubble -->
              <div id="phone-transcript-bubble" class="hidden bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 text-left">
              </div>
            </div>

            <!-- Call Controls -->
            <div class="w-full flex items-center justify-around gap-6 pt-4 pb-2">
              <!-- Mute Button -->
              <div class="flex flex-col items-center gap-1.5">
                <button id="mute-call-btn" aria-label="Toggle mute" class="w-12 h-12 rounded-full ${
                  this.isMuted
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                } border border-zinc-800 flex items-center justify-center transition active:scale-95">
                  ${this.isMuted ? iconMicOff('w-5 h-5') : iconMic('w-5 h-5')}
                </button>
                <span class="text-[10px] text-zinc-500">${this.isMuted ? 'Unmute' : 'Mute'}</span>
              </div>

              <!-- Hangup Button -->
              <div class="flex flex-col items-center gap-1.5">
                <button id="hangup-call-btn" aria-label="End call" class="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-md transition">
                  ${iconPhoneOff('w-6 h-6')}
                </button>
                <span class="text-[10px] text-zinc-500">End</span>
              </div>
            </div>
          </div>
        `;

      case 'finalizing':
      case 'ended': {
        const d = this.finalizedDecision;
        const statusLabel = d?.status || 'Call Ended';
        let badgeColor = 'text-zinc-400 bg-zinc-900 border-zinc-800';
        if (d?.status === 'CONFIRMED') badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (d?.status === 'MODIFIED') badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        if (d?.status === 'REFUSED') badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';

        return `
          <div class="flex flex-col items-center gap-4 w-full">
            <div class="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              ${iconCheck('w-6 h-6')}
            </div>

            <div class="space-y-1.5">
              <span class="text-[11px] font-medium px-2 py-0.5 rounded border inline-block ${badgeColor}">
                ${statusLabel}
              </span>
              <h2 class="text-base font-semibold text-white">Call Ended</h2>
              <p class="text-xs text-zinc-500 max-w-xs">
                ${d?.reason_or_notes || 'Confirmation recorded and synced with dashboard.'}
              </p>
            </div>
          </div>
        `;
      }
      default:
        return '';
    }
  }

  private attachEventListeners() {
    this.container
      .querySelector('#warmup-audio-btn')
      ?.addEventListener('click', async () => {
        const ok = await this.audioManager.warmup();
        this.hasAudioWarmup = ok;
        this.render();
      });

    const answerBtn = this.container.querySelector('#answer-call-btn') as HTMLButtonElement | null;
    const declineBtn = this.container.querySelector('#decline-call-btn') as HTMLButtonElement | null;

    const handleAnswerAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      if (now - this.lastAnswerTimestamp < 2500) {
        return;
      }

      if (
        this.isAnswering ||
        this.isStartingSession ||
        this.currentCallState !== 'ringing' ||
        this.elevenConversation
      ) {
        return;
      }

      this.isAnswering = true;
      this.lastAnswerTimestamp = now;
      this.ringtonePlayer.stop();

      if (answerBtn) {
        answerBtn.disabled = true;
        answerBtn.style.pointerEvents = 'none';
        answerBtn.classList.add('opacity-60', 'cursor-not-allowed');
        const label = answerBtn.parentElement?.querySelector('span');
        if (label) {
          label.textContent = 'Connecting...';
          label.classList.add('animate-pulse');
        }
      }

      this.ws?.send(JSON.stringify({ type: 'ANSWER_CALL' }));
    };

    answerBtn?.addEventListener('click', handleAnswerAction);
    answerBtn?.addEventListener('touchend', handleAnswerAction);

    declineBtn?.addEventListener('click', () => {
      this.ringtonePlayer.stop();
      this.ws?.send(JSON.stringify({ type: 'DECLINE_CALL' }));
    });

    this.container
      .querySelector('#hangup-call-btn')
      ?.addEventListener('click', () => {
        this.ws?.send(JSON.stringify({ type: 'HANGUP_CALL' }));
      });

    this.container
      .querySelector('#mute-call-btn')
      ?.addEventListener('click', () => {
        this.isMuted = !this.isMuted;
        this.audioManager.setMute(this.isMuted);
        const muteBtn = this.container.querySelector('#mute-call-btn');
        if (muteBtn) {
          muteBtn.className = `w-12 h-12 rounded-full ${
            this.isMuted
              ? 'bg-zinc-700 text-white'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          } border border-zinc-800 flex items-center justify-center transition active:scale-95`;
          muteBtn.innerHTML = this.isMuted ? iconMicOff('w-5 h-5') : iconMic('w-5 h-5');
          const label = muteBtn.parentElement?.querySelector('span');
          if (label) {
            label.textContent = this.isMuted ? 'Unmute' : 'Mute';
          }
        }
      });
  }
}
