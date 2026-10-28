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
  hasUserAudio?: boolean;
  hasResponseAudio?: boolean;
}

interface RawElevenLabsTranscriptTurn {
  role?: string;
  source?: string;
  message?: string;
  text?: string;
  time_in_call_secs?: number;
  timeInCallSecs?: number;
}

interface RawElevenLabsConversationResponse {
  conversation_id?: string;
  conversationId?: string;
  status?: string;
  has_audio?: boolean;
  has_user_audio?: boolean;
  has_response_audio?: boolean;
  transcript?: RawElevenLabsTranscriptTurn[];
  call_duration_secs?: number;
  duration_secs?: number;
  durationSecs?: number;
  metadata?: {
    call_duration_secs?: number;
  };
}

/**
 * Fetches the post-call STT transcript and metadata for an ElevenLabs Conversational AI session.
 * Uses Node 20+ native fetch with zero external dependencies.
 */
export async function fetchElevenLabsConversationTranscript(
  conversationId: string,
  apiKey: string,
  baseUrl = "https://api.elevenlabs.io"
): Promise<ElevenLabsConversationTranscript> {
  if (!conversationId || !conversationId.trim()) {
    throw new Error("conversationId is required to fetch ElevenLabs conversation transcript.");
  }
  if (!apiKey || !apiKey.trim()) {
    throw new Error("apiKey is required to fetch ElevenLabs conversation transcript.");
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const url = `${normalizedBaseUrl}/v1/convai/conversations/${encodeURIComponent(conversationId.trim())}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey.trim(),
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch ElevenLabs conversation transcript (${response.status}): ${errorText || response.statusText}`
    );
  }

  const raw = (await response.json()) as RawElevenLabsConversationResponse;

  const rawTurns = Array.isArray(raw.transcript) ? raw.transcript : [];
  const transcript: ElevenLabsTranscriptTurn[] = rawTurns.map((turn) => {
    const role: "user" | "agent" =
      turn.role === "user" || turn.source === "user" ? "user" : "agent";
    const message =
      typeof turn.message === "string"
        ? turn.message
        : typeof turn.text === "string"
          ? turn.text
          : "";
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
  });

  const durationSecs =
    typeof raw.metadata?.call_duration_secs === "number"
      ? raw.metadata.call_duration_secs
      : typeof raw.call_duration_secs === "number"
        ? raw.call_duration_secs
        : typeof raw.duration_secs === "number"
          ? raw.duration_secs
          : typeof raw.durationSecs === "number"
            ? raw.durationSecs
            : undefined;

  return {
    conversationId:
      typeof raw.conversation_id === "string"
        ? raw.conversation_id
        : typeof raw.conversationId === "string"
          ? raw.conversationId
          : conversationId.trim(),
    status: typeof raw.status === "string" ? raw.status : "done",
    transcript,
    ...(durationSecs !== undefined ? { durationSecs } : {}),
    ...(typeof raw.has_audio === "boolean" ? { hasAudio: raw.has_audio } : {}),
    ...(typeof raw.has_user_audio === "boolean" ? { hasUserAudio: raw.has_user_audio } : {}),
    ...(typeof raw.has_response_audio === "boolean"
      ? { hasResponseAudio: raw.has_response_audio }
      : {})
  };
}

/**
 * Fetches the full MP3 audio recording for an ElevenLabs Conversational AI session.
 * Uses Node 20+ native fetch with zero external dependencies and returns raw MP3 bytes as Uint8Array.
 */
export async function fetchElevenLabsConversationAudio(
  conversationId: string,
  apiKey: string,
  baseUrl = "https://api.elevenlabs.io"
): Promise<Uint8Array> {
  if (!conversationId || !conversationId.trim()) {
    throw new Error("conversationId is required to fetch ElevenLabs conversation audio.");
  }
  if (!apiKey || !apiKey.trim()) {
    throw new Error("apiKey is required to fetch ElevenLabs conversation audio.");
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const url = `${normalizedBaseUrl}/v1/convai/conversations/${encodeURIComponent(conversationId.trim())}/audio`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey.trim()
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch ElevenLabs conversation audio (${response.status}): ${errorText || response.statusText}`
    );
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
