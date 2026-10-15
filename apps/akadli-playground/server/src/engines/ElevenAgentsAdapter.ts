import { config } from '../config.js';
import {
  EngineCallbacks,
  SessionInitResult,
  VoiceEngineAdapter,
} from './VoiceEngineAdapter.js';
import {
  OrderPayload,
  VoiceConfig,
  orderPayloadToStandardizedDzOrder
} from '../../../shared/types.js';
import { buildElevenAgentsDynamicVariables } from '@akadli/core';

export class ElevenAgentsAdapter implements VoiceEngineAdapter {
  readonly engineType = 'elevenagents';
  private callbacks?: EngineCallbacks;
  private currentOrder?: OrderPayload;

  async initiateSession(
    order: OrderPayload,
    voiceConfig: VoiceConfig,
    callbacks: EngineCallbacks
  ): Promise<SessionInitResult> {
    this.callbacks = callbacks;
    this.currentOrder = order;

    const agentId = (
      voiceConfig.agentId ||
      config.elevenLabsAgentId ||
      ''
    ).trim();

    let signedUrl: string | undefined;

    // If an ElevenLabs API key is configured, request a signed URL for secure client connection
    if (config.elevenLabsApiKey && agentId) {
      try {
        console.log(`[ElevenAgents] Requesting signed URL for agent: ${agentId}`);
        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
          {
            headers: {
              'xi-api-key': config.elevenLabsApiKey,
            },
          }
        );

        if (response.ok) {
          const data = (await response.json()) as { signed_url: string };
          signedUrl = data.signed_url;
          console.log(`[ElevenAgents] Signed URL successfully created for agent: ${agentId}`);
        } else {
          const errText = await response.text();
          console.warn(
            `[ElevenAgents] Failed to obtain signed URL (${response.status} ${response.statusText}): ${errText}`
          );
          callbacks.onError(
            new Error(
              `ElevenLabs Agent error (${response.status}): ${errText || response.statusText}. Check agent ID and API key.`
            )
          );
        }
      } catch (err: any) {
        console.warn(`[ElevenAgents] Error fetching signed URL: ${err.message}`);
        callbacks.onError(err);
      }
    } else {
      console.warn(
        `[ElevenAgents] Missing ELEVENLABS_API_KEY or Agent ID. Configured key present: ${Boolean(
          config.elevenLabsApiKey
        )}, Agent ID: "${agentId}"`
      );
    }

    // Dynamic variables formatted via @akadli/core engine
    const standardized = orderPayloadToStandardizedDzOrder(order);
    const dynamicVariables = buildElevenAgentsDynamicVariables(standardized);

    return {
      engine: this.engineType,
      clientMode: 'client-managed',
      connectionDetails: {
        agentId,
        signedUrl,
        dynamicVariables,
        useAgentDefaults: voiceConfig.useAgentDefaults ?? true,
        voiceId: voiceConfig.useAgentDefaults ? undefined : voiceConfig.voiceId,
      },
    };
  }

  async endSession(): Promise<void> {
    this.callbacks = undefined;
  }
}
