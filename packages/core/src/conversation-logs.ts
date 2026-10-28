export interface ElevenLabsTranscriptTurn {
  role: "user" | "agent";
  message: string;
  timeInCallSecs?: number;
}

export interface ElevenLabsConversationTranscript {
  conversationId: string;
  status: string;
  transcript: ElevenLabsTranscriptTurn[];
  durationSecs?: number;
  hasAudio?: boolean;
}

/**
 * Fetches the STT transcript and status for an ElevenLabs Conversational AI session.
 * Uses Node 20+ native fetch with zero external dependencies.
 */
export async function fetchElevenLabsConversationTranscript(
  conversationId: string,
  apiKey: string,
  baseUrl = "https://api.elevenlabs.io"
): Promise<ElevenLabsConversationTranscript> {
  const id = conversationId.trim();
  const key = apiKey.trim();
  if (!id || !key) {
    throw new Error("conversationId and apiKey are required.");
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/v1/convai/conversations/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": key,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch ElevenLabs conversation transcript (${response.status}): ${errorText || response.statusText}`
    );
  }

  const raw = (await response.json()) as Record<string, any>;
  const rawTurns = Array.isArray(raw.transcript) ? raw.transcript : [];

  const transcript: ElevenLabsTranscriptTurn[] = rawTurns
    .map((turn: Record<string, any>) => {
      const role: "user" | "agent" =
        turn.role === "user" || turn.source === "user" ? "user" : "agent";
      const message = String(turn.message ?? turn.text ?? "").trim();
      const timeInCallSecs =
        typeof turn.time_in_call_secs === "number"
          ? turn.time_in_call_secs
          : typeof turn.timeInCallSecs === "number"
            ? turn.timeInCallSecs
            : undefined;

      return {
        role,
        message,
        ...(timeInCallSecs !== undefined ? { timeInCallSecs } : {})
      };
    })
    .filter((turn) => turn.message.length > 0);

  const durationSecs =
    typeof raw.metadata?.call_duration_secs === "number"
      ? raw.metadata.call_duration_secs
      : typeof raw.call_duration_secs === "number"
        ? raw.call_duration_secs
        : typeof raw.durationSecs === "number"
          ? raw.durationSecs
          : undefined;

  return {
    conversationId: typeof raw.conversation_id === "string" ? raw.conversation_id : id,
    status: typeof raw.status === "string" ? raw.status : "done",
    transcript,
    ...(durationSecs !== undefined ? { durationSecs } : {}),
    ...(typeof raw.has_audio === "boolean" ? { hasAudio: raw.has_audio } : {})
  };
}

/**
 * Fetches the MP3 audio recording for an ElevenLabs Conversational AI session.
 * Uses Node 20+ native fetch with zero external dependencies.
 */
export async function fetchElevenLabsConversationAudio(
  conversationId: string,
  apiKey: string,
  baseUrl = "https://api.elevenlabs.io"
): Promise<Uint8Array> {
  const id = conversationId.trim();
  const key = apiKey.trim();
  if (!id || !key) {
    throw new Error("conversationId and apiKey are required.");
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/v1/convai/conversations/${encodeURIComponent(id)}/audio`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": key
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch ElevenLabs conversation audio (${response.status}): ${errorText || response.statusText}`
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}
