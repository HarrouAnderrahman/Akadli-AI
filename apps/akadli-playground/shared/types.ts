import type {
  StandardizedDzOrder,
  FinalizedOrderDecision as StandardizedFinalizedOrderDecision,
  WilayaCode,
  OrderConstraints as StandardizedOrderConstraints
} from "@akadli/adapter-contract";
import type { ElevenAgentsDynamicVariables } from "@akadli/core";

export type {
  StandardizedDzOrder,
  StandardizedFinalizedOrderDecision,
  WilayaCode,
  StandardizedOrderConstraints,
  ElevenAgentsDynamicVariables
};

export interface OrderConstraints {
  allowed_sizes: string[];
  allowed_wilayas: string[];
  allowed_communes: string[];
}

export interface OrderPayload {
  order_id: string;
  store_name: string;
  customer_name: string;
  customer_phone: string;
  item_name: string;
  price_da: number;
  current_size: string;
  current_wilaya: string;
  current_commune: string;
  current_address_note: string;
  constraints: OrderConstraints;
  source?: 'manual' | 'shopify' | 'youcan' | string;
  raw_order?: unknown;
}

export function orderPayloadToStandardizedDzOrder(order: OrderPayload): StandardizedDzOrder {
  return {
    orderId: order.order_id,
    storeName: order.store_name,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    itemName: order.item_name,
    priceDa: order.price_da,
    currentSize: order.current_size,
    currentWilaya: order.current_wilaya as WilayaCode,
    currentCommune: order.current_commune,
    currentAddressNote: order.current_address_note || "",
    constraints: {
      allowedSizes: order.constraints.allowed_sizes,
      allowedWilayas: order.constraints.allowed_wilayas as WilayaCode[],
      allowedCommunes: order.constraints.allowed_communes
    }
  };
}

export function standardizedDzOrderToOrderPayload(
  stdOrder: StandardizedDzOrder,
  source: string = 'shopify'
): OrderPayload {
  return {
    order_id: stdOrder.orderId,
    store_name: stdOrder.storeName,
    customer_name: stdOrder.customerName,
    customer_phone: stdOrder.customerPhone,
    item_name: stdOrder.itemName,
    price_da: stdOrder.priceDa,
    current_size: stdOrder.currentSize,
    current_wilaya: stdOrder.currentWilaya,
    current_commune: stdOrder.currentCommune,
    current_address_note: stdOrder.currentAddressNote || '',
    constraints: {
      allowed_sizes: stdOrder.constraints.allowedSizes,
      allowed_wilayas: stdOrder.constraints.allowedWilayas,
      allowed_communes: stdOrder.constraints.allowedCommunes
    },
    source
  };
}

export type OrderDecisionStatus = 'CONFIRMED' | 'REFUSED' | 'MODIFIED';

export type ModificationField = 'size' | 'wilaya' | 'commune' | 'address_note';

export interface FinalizeOrderDecision {
  order_id: string;
  status: OrderDecisionStatus;
  final_size: string;
  final_wilaya: string;
  final_commune: string;
  final_address_note: string;
  modification_fields: ModificationField[];
  reason_or_notes: string;
}

export type VoiceEngineType = 'elevenagents';
export type TTSModel =
  | 'agent-default'
  | 'eleven_turbo_v2_5'
  | 'eleven_turbo_v2'
  | 'eleven_flash_v2_5'
  | 'eleven_multilingual_v2';

export interface VoiceConfig {
  engine: VoiceEngineType;
  agentId?: string;
  useAgentDefaults?: boolean;
  voiceId?: string;
  ttsModel?: TTSModel;
}

export type CallState = 'standby' | 'ringing' | 'active' | 'finalizing' | 'ended';

export interface TranscriptTurn {
  id: string;
  speaker: 'agent' | 'user' | 'system';
  text: string;
  timestamp: number;
  latencyMs?: number;
  isFinal?: boolean;
}

export interface PhoneClientStatus {
  online: boolean;
  callState: CallState;
  batteryLevel?: number;
  lastSeen: number;
}

export type WSMessageType =
  | 'REGISTER'
  | 'PHONE_STATUS'
  | 'TRIGGER_CALL'
  | 'CALL_RINGING'
  | 'ANSWER_CALL'
  | 'CALL_ANSWERED'
  | 'DECLINE_CALL'
  | 'HANGUP_CALL'
  | 'CALL_ENDED'
  | 'AUDIO_CHUNK'
  | 'TRANSCRIPT_UPDATE'
  | 'ORDER_FINALIZED'
  | 'SHOPIFY_WEBHOOK_RECEIVED'
  | 'SHOPIFY_MUTATION_RESULT'
  | 'YOUCAN_WEBHOOK_RECEIVED'
  | 'YOUCAN_MUTATION_RESULT'
  | 'ERROR'
  | 'PING'
  | 'PONG';

export interface ShopifyMutationData {
  orderId: string;
  decision: StandardizedFinalizedOrderDecision;
  mutationResult: {
    success: boolean;
    externalStatus: string;
    rawResponse?: unknown;
  };
  liveStore?: string;
  provider?: 'shopify' | 'youcan';
  timestamp: number;
}

export interface WSMessage<T = any> {
  type: WSMessageType;
  data?: T;
  timestamp?: number;
}
