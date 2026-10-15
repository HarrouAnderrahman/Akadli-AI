import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { config, getLocalIpAddress } from './config.js';
import {
  CallState,
  FinalizeOrderDecision,
  OrderPayload,
  TranscriptTurn,
  VoiceConfig,
  WSMessage,
} from '../../shared/types.js';
import { VoiceEngineAdapter } from './engines/VoiceEngineAdapter.js';
import { ElevenAgentsAdapter } from './engines/ElevenAgentsAdapter.js';
import {
  getAllWilayas,
  getCommunesByWilayaId,
  validateLocation,
} from '../../shared/algeria2026.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Global State
let adminSockets = new Set<WebSocket>();
let phoneSocket: WebSocket | null = null;
let currentCallState: CallState = 'standby';
let currentOrder: OrderPayload | null = null;
let currentConfig: VoiceConfig | null = null;
let activeAdapter: VoiceEngineAdapter | null = null;
let isInitiatingSession = false;

// Helper to broadcast WS messages
function broadcastToAdmins(msg: WSMessage) {
  const data = JSON.stringify({ ...msg, timestamp: Date.now() });
  for (const client of adminSockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function sendToPhone(msg: WSMessage) {
  if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
    phoneSocket.send(JSON.stringify({ ...msg, timestamp: Date.now() }));
  }
}

function broadcastPhoneStatus() {
  const isOnline = phoneSocket !== null && phoneSocket.readyState === WebSocket.OPEN;
  const statusMsg: WSMessage = {
    type: 'PHONE_STATUS',
    data: {
      online: isOnline,
      callState: currentCallState,
      lastSeen: Date.now(),
    },
  };
  broadcastToAdmins(statusMsg);
}

function setCallState(newState: CallState) {
  currentCallState = newState;
  broadcastPhoneStatus();
}

// REST Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    online: true,
    localIp: getLocalIpAddress(),
    serverPort: config.serverPort,
    clientPort: config.port,
    phoneConnected: phoneSocket !== null && phoneSocket.readyState === WebSocket.OPEN,
    callState: currentCallState,
    defaultAgentId: config.elevenLabsAgentId,
  });
});

app.get('/api/lan-ip', (req, res) => {
  const ip = getLocalIpAddress();
  res.json({
    localIp: ip,
    adminUrl: `https://${ip}:${config.port}/admin`,
    phoneUrl: `https://${ip}:${config.port}/phone`,
  });
});

app.post('/api/trigger-call', (req, res) => {
  const { payload, config: vConfig } = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'Missing order payload' });
  }

  if (!phoneSocket || phoneSocket.readyState !== WebSocket.OPEN) {
    return res.status(409).json({
      error: 'No mobile phone receiver is currently connected to the LAN server.',
    });
  }

  initiateCall(payload, vConfig);
  res.json({ success: true, message: 'Call initiated' });
});

app.post('/api/hangup', async (req, res) => {
  await terminateCall('Force hangup by Admin');
  res.json({ success: true });
});

app.get('/api/elevenlabs/signed-url', async (req, res) => {
  if (!config.elevenLabsApiKey || !config.elevenLabsAgentId) {
    return res.status(400).json({ error: 'ElevenLabs credentials not configured' });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${config.elevenLabsAgentId}`,
      {
        headers: {
          'xi-api-key': config.elevenLabsApiKey,
        },
      }
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to get signed url' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Algeria 2026 Administrative Locations API (69 Wilayas & 1,708 Communes)
app.get('/api/locations/wilayas', (req, res) => {
  res.json(getAllWilayas());
});

app.get('/api/locations/communes', (req, res) => {
  const wilayaId = req.query.wilaya_id as string;
  if (!wilayaId) {
    return res.status(400).json({ error: 'Missing wilaya_id query parameter' });
  }
  res.json(getCommunesByWilayaId(wilayaId));
});

app.get('/api/locations/validate', (req, res) => {
  const commune = req.query.commune as string;
  const wilaya = req.query.wilaya as string | undefined;
  if (!commune) {
    return res.status(400).json({ error: 'Missing commune parameter' });
  }
  res.json(validateLocation(commune, wilaya));
});

// Call Lifecycle Management
function initiateCall(payload: OrderPayload, vConfig?: VoiceConfig) {
  currentOrder = payload;
  currentConfig = vConfig || {
    engine: 'elevenagents',
    useAgentDefaults: true,
  };

  setCallState('ringing');

  const ringingMsg: WSMessage = {
    type: 'CALL_RINGING',
    data: {
      payload: currentOrder,
      config: currentConfig,
    },
  };

  sendToPhone(ringingMsg);
  broadcastToAdmins(ringingMsg);
}

async function handleCallAnswered() {
  if (!currentOrder || !currentConfig) return;

  // Prevent multiple instances if user presses answer repeatedly or session is already initiating
  if (currentCallState !== 'ringing' || isInitiatingSession) {
    console.warn(
      `[Server] Call is not in ringing state (${currentCallState}) or session is already initiating (${isInitiatingSession}), ignoring duplicate ANSWER_CALL.`
    );
    return;
  }

  isInitiatingSession = true;
  setCallState('active');

  // Terminate any previous adapter instance if still around
  if (activeAdapter) {
    try {
      await activeAdapter.endSession();
    } catch (e) {}
    activeAdapter = null;
  }

  // Pure Mode A: ElevenAgents Conversational AI
  activeAdapter = new ElevenAgentsAdapter();

  try {
    const sessionResult = await activeAdapter.initiateSession(
      currentOrder,
      currentConfig,
      {
        onTranscript: (turn: TranscriptTurn) => {
          const msg: WSMessage = { type: 'TRANSCRIPT_UPDATE', data: { turn } };
          broadcastToAdmins(msg);
          sendToPhone(msg);
        },
        onAudioOutput: (audioData, sampleRate, format) => {
          const base64 =
            typeof audioData === 'string'
              ? audioData
              : audioData.toString('base64');
          sendToPhone({
            type: 'AUDIO_CHUNK',
            data: { audio: base64, sampleRate, format },
          });
        },
        onOrderFinalized: (decision: FinalizeOrderDecision) => {
          handleOrderFinalized(decision);
        },
        onError: (error: Error) => {
          console.error('[Engine Error]:', error);
          broadcastToAdmins({ type: 'ERROR', data: { message: error.message } });
        },
        onCallEnd: (reason?: string) => {
          terminateCall(reason);
        },
      }
    );

    const answeredMsg: WSMessage = {
      type: 'CALL_ANSWERED',
      data: {
        payload: currentOrder,
        config: currentConfig,
        sessionInfo: sessionResult,
      },
    };

    sendToPhone(answeredMsg);
    broadcastToAdmins(answeredMsg);
  } catch (err: any) {
    console.error('[Server] Failed to initiate voice session:', err);
    broadcastToAdmins({
      type: 'ERROR',
      data: { message: `Session initiation failed: ${err.message}` },
    });
    terminateCall('Initialization error');
  } finally {
    isInitiatingSession = false;
  }
}

function handleOrderFinalized(decision: FinalizeOrderDecision) {
  setCallState('finalizing');

  const finalizedMsg: WSMessage = {
    type: 'ORDER_FINALIZED',
    data: {
      decision,
      originalOrder: currentOrder,
    },
  };

  broadcastToAdmins(finalizedMsg);
  sendToPhone(finalizedMsg);

  // Auto hangup after 2.5 seconds per spec
  setTimeout(() => {
    terminateCall('Order finalized successfully');
  }, 2500);
}

async function terminateCall(reason = 'Call ended') {
  isInitiatingSession = false;
  if (activeAdapter) {
    try {
      await activeAdapter.endSession();
    } catch (e) {}
    activeAdapter = null;
  }

  setCallState('ended');

  const endedMsg: WSMessage = {
    type: 'CALL_ENDED',
    data: { reason },
  };

  sendToPhone(endedMsg);
  broadcastToAdmins(endedMsg);

  // Return to standby after 2 seconds
  setTimeout(() => {
    setCallState('standby');
  }, 2000);
}

// WebSocket Server Handshake
wss.on('connection', (ws: WebSocket, req) => {
  let role: 'admin' | 'phone' | 'unknown' = 'unknown';

  ws.on('message', async (data) => {
    try {
      const msg: WSMessage = JSON.parse(data.toString());

      switch (msg.type) {
        case 'REGISTER': {
          role = msg.data?.role;
          if (role === 'admin') {
            adminSockets.add(ws);
            broadcastPhoneStatus();
          } else if (role === 'phone') {
            phoneSocket = ws;
            setCallState(currentCallState === 'ringing' || currentCallState === 'active' ? currentCallState : 'standby');
            broadcastPhoneStatus();
            console.log('[WS] Mobile phone client registered on LAN.');
          }
          break;
        }

        case 'TRIGGER_CALL': {
          if (msg.data?.payload) {
            initiateCall(msg.data.payload, msg.data.config);
          }
          break;
        }

        case 'ANSWER_CALL': {
          if (currentCallState !== 'ringing' || isInitiatingSession) {
            console.warn(
              `[Server] Received ANSWER_CALL but current state is "${currentCallState}" (initiating: ${isInitiatingSession}), ignoring.`
            );
            break;
          }
          await handleCallAnswered();
          break;
        }

        case 'DECLINE_CALL': {
          await terminateCall('Declined by receiver');
          break;
        }

        case 'HANGUP_CALL': {
          await terminateCall('Hangup by user');
          break;
        }

        case 'AUDIO_CHUNK': {
          // Inbound audio from phone client
          if (activeAdapter && msg.data?.audio) {
            const buffer = Buffer.from(msg.data.audio, 'base64');
            if (activeAdapter.processAudioInput) {
              await activeAdapter.processAudioInput(buffer);
            }
          }
          break;
        }

        case 'TRANSCRIPT_UPDATE': {
          // Client tool / speech relayed from Mode A
          broadcastToAdmins(msg);
          break;
        }

        case 'ORDER_FINALIZED': {
          if (msg.data?.decision) {
            handleOrderFinalized(msg.data.decision);
          }
          break;
        }

        case 'PING': {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          break;
        }
      }
    } catch (err) {
      console.error('[WS] Error processing message:', err);
    }
  });

  ws.on('close', () => {
    if (role === 'admin') {
      adminSockets.delete(ws);
    } else if (role === 'phone' && phoneSocket === ws) {
      phoneSocket = null;
      console.log('[WS] Phone client disconnected.');
      broadcastPhoneStatus();
      if (currentCallState === 'active' || currentCallState === 'ringing') {
        terminateCall('Phone client disconnected');
      }
    }
  });
});

// Serve static client assets if built
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = config.serverPort;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIpAddress();
  console.log(`=======================================================`);
  console.log(`🚀 Akadli-Playground Sandbox Server Running!`);
  console.log(`📡 Local LAN IP:    ${ip}`);
  console.log(`🔌 Backend API/WS:  http://${ip}:${PORT}`);
  console.log(`💻 Admin Dashboard: https://${ip}:${config.port}/admin`);
  console.log(`📱 Mobile Receiver: https://${ip}:${config.port}/phone`);
  console.log(`=======================================================`);
});
