import {
  CallState,
  FinalizeOrderDecision,
  OrderPayload,
  TranscriptTurn,
  VoiceConfig,
  WSMessage,
  ShopifyMutationData,
} from '../../../shared/types.js';
import {
  getAllWilayas,
  getCommunesByWilayaId,
  validateLocation,
  Wilaya2026,
  Commune2026,
} from '../../../shared/algeria2026.js';
import {
  iconCheck,
  iconCopy,
  iconExternalLink,
  iconPhone,
  iconPhoneOff,
  iconRefresh,
} from '../ui/icons.js';

const DEFAULT_ORDER: OrderPayload = {
  order_id: 'DZ-1049',
  store_name: 'Atlas Streetwear',
  customer_name: 'Abderrahman',
  customer_phone: '0550123456',
  item_name: 'Oversized Hoodie Black',
  price_da: 4500,
  current_variant: 'M',
  current_wilaya: '13 - Tlemcen',
  current_commune: 'Mansourah',
  current_address_note: 'Cite Imama',
  constraints: {
    allowed_variants: ['S', 'M', 'L', 'XL'],
    allowed_wilayas: ['13 - Tlemcen', '16 - Alger', '31 - Oran', '68 - Bou Saada'],
    allowed_communes: [
      'Mansourah',
      'Chetouane',
      'Tlemcen',
      'Beni Mester',
      'Remchi',
      'Bou Saada',
    ],
  },
};

export class AdminPage {
  private container: HTMLElement;
  private ws: WebSocket | null = null;
  private isPhoneOnline = false;
  private currentCallState: CallState = 'standby';
  private transcripts: TranscriptTurn[] = [];
  private finalizedDecision: FinalizeOrderDecision | null = null;
  private order: OrderPayload = { ...DEFAULT_ORDER };
  private localIpInfo: { localIp: string; phoneUrl: string } | null = null;
  private defaultAgentId = '';
  private wilayas: Wilaya2026[] = [];
  private activeTab: 'form' | 'json' = 'form';
  private callDurationSeconds = 0;
  private callTimerInterval: number | null = null;
  private shopifyConfigured = false;
  private shopifyDomain: string | null = null;
  private shopifyMutationResult: ShopifyMutationData | null = null;
  private youcanConfigured = false;
  private youcanApiBaseUrl: string | null = null;
  private youcanMutationResult: ShopifyMutationData | null = null;
  private woocommerceConfigured = false;
  private woocommerceSiteUrl: string | null = null;
  private woocommerceMutationResult: ShopifyMutationData | null = null;
  private gsheetsConfigured = false;
  private gsheetsMode: string | null = null;
  private gsheetsSpreadsheetId: string | null = null;
  private gsheetsMutationResult: ShopifyMutationData | null = null;
  private tassyirConfigured = false;
  private tassyirApiBaseUrl: string | null = null;
  private tassyirMutationResult: ShopifyMutationData | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.wilayas = getAllWilayas();
  }

  public async mount() {
    this.render();
    await this.fetchLanInfo();
    this.initWebSocket();
  }

  private async fetchLanInfo() {
    try {
      const res = await fetch('/api/lan-ip');
      if (res.ok) {
        this.localIpInfo = await res.json();
        this.updateLanInfoUi();
      }
      const statusRes = await fetch('/api/status');
      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.defaultAgentId) {
          this.defaultAgentId = data.defaultAgentId;
          const agentInput = this.container.querySelector(
            '#agent-id-input'
          ) as HTMLInputElement;
          if (agentInput && !agentInput.value) {
            agentInput.value = this.defaultAgentId;
          }
        }
        this.shopifyConfigured = Boolean(data.shopifyConfigured);
        this.shopifyDomain = data.shopifyDomain || null;
        this.youcanConfigured = Boolean(data.youcanConfigured);
        this.youcanApiBaseUrl = data.youcanApiBaseUrl || null;
        this.woocommerceConfigured = Boolean(data.woocommerceConfigured);
        this.woocommerceSiteUrl = data.woocommerceSiteUrl || null;
        this.gsheetsConfigured = Boolean(data.gsheetsConfigured);
        this.gsheetsMode = data.gsheetsMode || null;
        this.gsheetsSpreadsheetId = data.gsheetsSpreadsheetId || null;
        this.tassyirConfigured = Boolean(data.tassyirConfigured);
        this.tassyirApiBaseUrl = data.tassyirApiBaseUrl || null;
        this.updateShopifyStatusUi();
        this.updateYouCanStatusUi();
        this.updateWooCommerceStatusUi();
        this.updateGSheetsStatusUi();
        this.updateTassyirStatusUi();
      }
    } catch (e) {}
  }

  private initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.ws?.send(
        JSON.stringify({
          type: 'REGISTER',
          data: { role: 'admin' },
        })
      );
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.handleWsMessage(msg);
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.initWebSocket(), 2000);
    };
  }

  private handleWsMessage(msg: WSMessage) {
    switch (msg.type) {
      case 'PHONE_STATUS': {
        this.isPhoneOnline = msg.data.online;
        this.currentCallState = msg.data.callState;
        this.updateStatusBadge();
        break;
      }

      case 'CALL_RINGING': {
        this.currentCallState = 'ringing';
        this.transcripts = [];
        this.finalizedDecision = null;
        this.shopifyMutationResult = null;
        this.youcanMutationResult = null;
        this.woocommerceMutationResult = null;
        this.gsheetsMutationResult = null;
        this.tassyirMutationResult = null;
        this.stopTimer();
        this.updateStatusBadge();
        this.renderTranscripts();
        this.renderDecisionSummary();
        break;
      }

      case 'CALL_ANSWERED': {
        this.currentCallState = 'active';
        this.startTimer();
        this.updateStatusBadge();
        break;
      }

      case 'TRANSCRIPT_UPDATE': {
        if (msg.data?.turn) {
          this.transcripts.push(msg.data.turn);
          this.renderTranscripts();
        }
        break;
      }

      case 'ORDER_FINALIZED': {
        this.currentCallState = 'finalizing';
        this.finalizedDecision = msg.data.decision;
        if (msg.data.originalOrder) {
          this.order = msg.data.originalOrder;
        }
        this.stopTimer();
        this.updateStatusBadge();
        this.renderDecisionSummary();
        break;
      }

      case 'SHOPIFY_WEBHOOK_RECEIVED': {
        if (msg.data?.order) {
          this.order = msg.data.order;
          this.updateFormFieldsFromOrder();
          this.updateOrderSyncBadge();
        }
        break;
      }

      case 'SHOPIFY_MUTATION_RESULT': {
        this.shopifyMutationResult = msg.data;
        this.renderDecisionSummary();
        break;
      }

      case 'YOUCAN_WEBHOOK_RECEIVED': {
        if (msg.data?.order) {
          this.order = msg.data.order;
          this.updateFormFieldsFromOrder();
          this.updateOrderSyncBadge();
        }
        break;
      }

      case 'YOUCAN_MUTATION_RESULT': {
        this.youcanMutationResult = msg.data;
        this.renderDecisionSummary();
        break;
      }

      case 'WOOCOMMERCE_WEBHOOK_RECEIVED': {
        if (msg.data?.order) {
          this.order = msg.data.order;
          this.updateFormFieldsFromOrder();
          this.updateOrderSyncBadge();
        }
        break;
      }

      case 'WOOCOMMERCE_MUTATION_RESULT': {
        this.woocommerceMutationResult = msg.data;
        this.renderDecisionSummary();
        break;
      }

      case 'GSHEETS_WEBHOOK_RECEIVED': {
        if (msg.data?.order) {
          this.order = msg.data.order;
          this.updateFormFieldsFromOrder();
          this.updateOrderSyncBadge();
        }
        break;
      }

      case 'GSHEETS_MUTATION_RESULT': {
        this.gsheetsMutationResult = msg.data;
        this.renderDecisionSummary();
        break;
      }

      case 'TASSYIR_WEBHOOK_RECEIVED': {
        if (msg.data?.order) {
          this.order = msg.data.order;
          this.updateFormFieldsFromOrder();
          this.updateOrderSyncBadge();
        }
        break;
      }

      case 'TASSYIR_MUTATION_RESULT': {
        this.tassyirMutationResult = msg.data;
        this.renderDecisionSummary();
        break;
      }

      case 'CALL_ENDED': {
        this.currentCallState = 'ended';
        this.stopTimer();
        this.updateStatusBadge();
        setTimeout(() => {
          if (this.currentCallState === 'ended') {
            this.currentCallState = 'standby';
            this.updateStatusBadge();
          }
        }, 2000);
        break;
      }

      case 'ERROR': {
        alert(msg.data?.message || 'Server error occurred');
        break;
      }
    }
  }

  private startTimer() {
    this.callDurationSeconds = 0;
    this.stopTimer();
    this.callTimerInterval = window.setInterval(() => {
      this.callDurationSeconds++;
      const timerEl = this.container.querySelector('#call-timer');
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

  private stopTimer() {
    if (this.callTimerInterval !== null) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
  }

  private render() {
    this.container.innerHTML = `
      <div class="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
        <!-- Top Bar: Minimal, quiet, high utility -->
        <header class="h-12 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-zinc-950">
          <div class="flex items-center gap-3">
            <span class="text-xs font-semibold tracking-tight text-white">Akadli-AI Playground</span>
            <span class="text-zinc-600 text-xs font-mono">/</span>
            <span class="text-xs text-zinc-400">Local Voice & Webhook Sandbox</span>
          </div>

          <div class="flex items-center gap-3">
            <!-- Shopify Connection Status -->
            <div id="shopify-status-pill" class="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              <span class="text-[11px] text-zinc-400">Shopify Sandbox</span>
            </div>

            <!-- YouCan Connection Status -->
            <div id="youcan-status-pill" class="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              <span class="text-[11px] text-zinc-400">YouCan Sandbox</span>
            </div>

            <!-- WooCommerce Connection Status -->
            <div id="woocommerce-status-pill" class="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              <span class="text-[11px] text-zinc-400">WooCommerce Sandbox</span>
            </div>

            <!-- Google Sheets Connection Status -->
            <div id="gsheets-status-pill" class="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              <span class="text-[11px] text-zinc-400">GSheets Sandbox</span>
            </div>

            <!-- Tassyir Connection Status -->
            <div id="tassyir-status-pill" class="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              <span class="text-[11px] text-zinc-400">Tassyir Sandbox</span>
            </div>

            <!-- Connection Status -->
            <div id="phone-status-pill" class="flex items-center gap-2 text-xs text-zinc-400">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              <span>Receiver offline</span>
            </div>

            <!-- LAN URL Copy -->
            <button id="copy-lan-btn" class="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-md border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 transition" title="Copy Mobile Phone URL">
              ${iconCopy('w-3.5 h-3.5')}
              <span id="copy-btn-label">Copy Phone URL</span>
            </button>

            <!-- Open Receiver -->
            <a href="/phone" target="_blank" class="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition">
              <span>Phone Tab</span>
              ${iconExternalLink('w-3 h-3')}
            </a>
          </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
          
          <!-- LEFT: Order Setup & Trigger (5 cols) -->
          <div class="lg:col-span-5 flex flex-col gap-5">
            
            <!-- Call Action Card -->
            <div class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
              <div class="flex items-center justify-between text-xs">
                <span class="text-zinc-400">Call Dispatch</span>
                <span id="call-state-label" class="text-zinc-500 font-mono text-[11px] capitalize">Standby</span>
              </div>

              <div class="flex items-center gap-2">
                <button id="trigger-call-btn" disabled class="flex-1 h-10 px-4 bg-white text-zinc-950 font-medium text-xs rounded-lg hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-sm">
                  ${iconPhone('w-4 h-4')}
                  <span id="trigger-btn-text">Start Call</span>
                </button>

                <button id="hangup-call-btn" disabled class="h-10 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-rose-400 border border-zinc-800 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition text-xs flex items-center justify-center gap-1.5" title="End Active Call">
                  ${iconPhoneOff('w-3.5 h-3.5')}
                  <span>End</span>
                </button>
              </div>

              <!-- Webhook Simulations -->
              <div class="pt-3 border-t border-zinc-800/60 space-y-2">
                <div class="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Simulate Shopify Webhook</span>
                  <span class="font-mono text-[10px] text-zinc-500">Shopify fixtures</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button id="simulate-shopify-standard-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate standard Shopify order created webhook">
                    <span>Standard Order</span>
                  </button>
                  <button id="simulate-shopify-codform-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate Shopify COD form note attributes webhook">
                    <span>COD Form Note</span>
                  </button>
                </div>

                <div class="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Simulate YouCan Webhook</span>
                  <span class="font-mono text-[10px] text-zinc-500">YouCan (.shop) fixtures</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button id="simulate-youcan-standard-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate standard YouCan order created webhook">
                    <span>YouCan: Standard Order</span>
                  </button>
                  <button id="simulate-youcan-extrafields-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate YouCan 1-Page COD form extra_fields webhook">
                    <span>YouCan: 1-Page COD Form</span>
                  </button>
                </div>

                <div class="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Simulate WooCommerce Webhook</span>
                  <span class="font-mono text-[10px] text-zinc-500">WooCommerce REST fixtures</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button id="simulate-woocommerce-standard-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate standard WooCommerce order created webhook">
                    <span>WooCommerce: Standard</span>
                  </button>
                  <button id="simulate-woocommerce-metacod-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate WooCommerce COD plugin meta_data webhook">
                    <span>WooCommerce: COD Meta</span>
                  </button>
                </div>

                <div class="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Simulate Google Sheets Webhook</span>
                  <span class="font-mono text-[10px] text-zinc-500">COD Sheet Row fixtures</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button id="simulate-gsheets-setshop-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate SetShop / JustSell Google Sheet row webhook">
                    <span>GSheets: SetShop/JustSell Row</span>
                  </button>
                  <button id="simulate-gsheets-arabic-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate Arabic COD Google Sheet row webhook">
                    <span>GSheets: Arabic COD Sheet</span>
                  </button>
                </div>

                <div class="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Simulate Tassyir Webhook</span>
                  <span class="font-mono text-[10px] text-zinc-500">COD ERP & Dispatch fixtures</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button id="simulate-tassyir-standard-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate standard Tassyir order created webhook">
                    <span>Tassyir: Standard ERP</span>
                  </button>
                  <button id="simulate-tassyir-stopdesk-btn" class="h-8 px-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition flex items-center justify-center gap-1.5" title="Simulate Tassyir Stop-Desk Wilaya 59 Aflou webhook">
                    <span>Tassyir: Stop-Desk 59</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Order Configuration Card -->
            <div class="flex-1 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col gap-4">
              <div class="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-zinc-200">Order Information</span>
                  <span id="order-sync-badge" class="text-[10px] px-1.5 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-950 text-zinc-400">Local Order</span>
                </div>
                
                <div class="flex items-center gap-2">
                  <!-- Mode Switcher: Form vs JSON -->
                  <div class="flex items-center bg-zinc-950 border border-zinc-800 rounded-md p-0.5 text-[11px]">
                    <button id="tab-form-btn" class="px-2.5 py-0.5 rounded text-white bg-zinc-800 font-medium transition">Form</button>
                    <button id="tab-json-btn" class="px-2.5 py-0.5 rounded text-zinc-400 hover:text-white transition">JSON</button>
                  </div>

                  <button id="reset-order-btn" class="p-1 text-zinc-500 hover:text-zinc-300 transition" title="Reset Default Order">
                    ${iconRefresh('w-3.5 h-3.5')}
                  </button>
                </div>
              </div>

              <!-- Form View -->
              <div id="order-form-view" class="space-y-3.5">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-1">Customer Name</label>
                    <input id="field-customer-name" type="text" value="${this.order.customer_name}" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600" />
                  </div>
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-1">Phone Number</label>
                    <input id="field-customer-phone" type="text" value="${this.order.customer_phone}" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600" />
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div class="col-span-2">
                    <label class="block text-[11px] text-zinc-400 mb-1">Item Ordered</label>
                    <input id="field-item-name" type="text" value="${this.order.item_name}" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600" />
                  </div>
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-1">Variant</label>
                    <input id="field-item-variant" type="text" value="${this.order.current_variant}" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 uppercase focus:outline-none focus:border-zinc-600" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-1">Price (DA)</label>
                    <input id="field-price" type="number" value="${this.order.price_da}" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-600" />
                  </div>
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-1">Store Name</label>
                    <input id="field-store-name" type="text" value="${this.order.store_name}" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600" />
                  </div>
                </div>

                <!-- 2026 Cascading Wilaya / Commune Select -->
                <div class="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-1">Wilaya (69 official)</label>
                    <select id="field-wilaya-select" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600">
                      ${this.renderWilayaOptions()}
                    </select>
                  </div>
                  <div>
                    <label class="block text-[11px] text-zinc-400 mb-1">Commune</label>
                    <select id="field-commune-select" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600">
                      ${this.renderCommuneOptions()}
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] text-zinc-400 mb-1">Address Note / Landmark</label>
                  <input id="field-address-note" type="text" value="${this.order.current_address_note || ''}" placeholder="e.g. Cite Imama, batiment 4" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600" />
                </div>
              </div>

              <!-- JSON Editor View -->
              <div id="order-json-view" class="hidden flex-1 flex flex-col gap-2">
                <textarea id="payload-editor" spellcheck="false" class="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-600 resize-y leading-relaxed">${JSON.stringify(
                  this.order,
                  null,
                  2
                )}</textarea>
                <div id="payload-error" class="hidden text-[11px] text-rose-400 font-mono"></div>
              </div>

              <!-- Collapsible Agent Config -->
              <div class="pt-2 border-t border-zinc-800/60">
                <details class="text-xs text-zinc-400 cursor-pointer">
                  <summary class="hover:text-zinc-200 select-none text-[11px]">ElevenLabs Agent Settings</summary>
                  <div class="pt-2.5 space-y-2">
                    <div>
                      <label class="block text-[10px] text-zinc-500 mb-1">Agent ID</label>
                      <input id="agent-id-input" type="text" value="${this.defaultAgentId || ''}" placeholder="agent_..." class="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1 text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-600" />
                    </div>
                  </div>
                </details>
              </div>

            </div>

          </div>

          <!-- RIGHT: Live Conversation & Order Decision (7 cols) -->
          <div class="lg:col-span-7 flex flex-col gap-5">
            
            <!-- Live Conversation Card -->
            <div class="flex-1 min-h-[380px] p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col">
              <div class="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-zinc-200">Conversation Feed</span>
                  <span id="call-timer" class="text-[11px] font-mono text-zinc-500">00:00</span>
                </div>
                <span class="text-[11px] text-zinc-500">Darja & French</span>
              </div>

              <!-- Message Stream -->
              <div id="transcript-feed" class="flex-1 overflow-y-auto space-y-2.5 pr-1">
                <div class="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                  Waiting for active call...
                </div>
              </div>
            </div>

            <!-- Decision Contract Outcome Card -->
            <div id="decision-card" class="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
              <div class="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                <span class="text-xs font-semibold text-zinc-200">Order Decision</span>
                <div id="decision-status-pill" class="text-[11px] font-medium px-2 py-0.5 rounded text-zinc-500 bg-zinc-900 border border-zinc-800">
                  Pending call
                </div>
              </div>

              <div id="decision-body" class="text-xs text-zinc-500 italic py-2">
                Order confirmation outcome and delivery location validation will appear here once the call is concluded.
              </div>
            </div>

          </div>

        </main>
      </div>
    `;

    this.attachEventListeners();
    this.updateStatusBadge();
    this.updateShopifyStatusUi();
    this.updateYouCanStatusUi();
    this.updateWooCommerceStatusUi();
    this.updateGSheetsStatusUi();
    this.updateTassyirStatusUi();
    this.updateOrderSyncBadge();
  }

  private renderWilayaOptions(): string {
    const currentNorm = this.order.current_wilaya.trim();
    return this.wilayas
      .map((w) => {
        const val = `${w.code} - ${w.name}`;
        const isSelected =
          currentNorm === val ||
          currentNorm.startsWith(w.code) ||
          currentNorm.toLowerCase().includes(w.name.toLowerCase());
        return `<option value="${w.id}" data-formatted="${val}" ${isSelected ? 'selected' : ''}>${w.code} · ${w.name}</option>`;
      })
      .join('');
  }

  private renderCommuneOptions(): string {
    const wilayaSelect = this.container.querySelector('#field-wilaya-select') as HTMLSelectElement | null;
    let selectedWilayaId = '13';
    if (wilayaSelect) {
      selectedWilayaId = wilayaSelect.value;
    } else {
      const match = this.wilayas.find(
        (w) =>
          this.order.current_wilaya.includes(w.code) ||
          this.order.current_wilaya.toLowerCase().includes(w.name.toLowerCase())
      );
      if (match) selectedWilayaId = match.id;
    }

    const communes = getCommunesByWilayaId(selectedWilayaId);
    return communes
      .map((c) => {
        const isSelected =
          this.order.current_commune.toLowerCase() === c.name.toLowerCase();
        return `<option value="${c.name}" ${isSelected ? 'selected' : ''}>${c.name}</option>`;
      })
      .join('');
  }

  private attachEventListeners() {
    // Tab switching (Form vs JSON)
    const formBtn = this.container.querySelector('#tab-form-btn');
    const jsonBtn = this.container.querySelector('#tab-json-btn');
    const formView = this.container.querySelector('#order-form-view');
    const jsonView = this.container.querySelector('#order-json-view');
    const editor = this.container.querySelector('#payload-editor') as HTMLTextAreaElement;

    formBtn?.addEventListener('click', () => {
      this.activeTab = 'form';
      formBtn.className = 'px-2.5 py-0.5 rounded text-white bg-zinc-800 font-medium transition';
      jsonBtn!.className = 'px-2.5 py-0.5 rounded text-zinc-400 hover:text-white transition';
      formView?.classList.remove('hidden');
      jsonView?.classList.add('hidden');
      this.syncJsonToForm();
    });

    jsonBtn?.addEventListener('click', () => {
      this.activeTab = 'json';
      jsonBtn.className = 'px-2.5 py-0.5 rounded text-white bg-zinc-800 font-medium transition';
      formBtn!.className = 'px-2.5 py-0.5 rounded text-zinc-400 hover:text-white transition';
      formView?.classList.add('hidden');
      jsonView?.classList.remove('hidden');
      this.syncFormToJson();
    });

    // Form inputs change handlers
    const syncForm = () => {
      const name = (this.container.querySelector('#field-customer-name') as HTMLInputElement)?.value;
      const phone = (this.container.querySelector('#field-customer-phone') as HTMLInputElement)?.value;
      const item = (this.container.querySelector('#field-item-name') as HTMLInputElement)?.value;
      const variant = (this.container.querySelector('#field-item-variant') as HTMLInputElement)?.value;
      const price = parseFloat((this.container.querySelector('#field-price') as HTMLInputElement)?.value || '0');
      const store = (this.container.querySelector('#field-store-name') as HTMLInputElement)?.value;
      const note = (this.container.querySelector('#field-address-note') as HTMLInputElement)?.value;

      const wilayaEl = this.container.querySelector('#field-wilaya-select') as HTMLSelectElement;
      const communeEl = this.container.querySelector('#field-commune-select') as HTMLSelectElement;
      const selectedOption = wilayaEl?.options[wilayaEl.selectedIndex];
      const formattedWilaya = selectedOption?.getAttribute('data-formatted') || this.order.current_wilaya;
      const commune = communeEl?.value || this.order.current_commune;

      this.order = {
        ...this.order,
        customer_name: name,
        customer_phone: phone,
        item_name: item,
        current_variant: variant,
        price_da: price,
        store_name: store,
        current_address_note: note,
        current_wilaya: formattedWilaya,
        current_commune: commune,
      };

      if (editor) {
        editor.value = JSON.stringify(this.order, null, 2);
      }
    };

    this.container.querySelectorAll('#order-form-view input').forEach((inp) => {
      inp.addEventListener('input', syncForm);
    });

    // Wilaya change -> update communes
    const wilayaSelect = this.container.querySelector('#field-wilaya-select') as HTMLSelectElement;
    const communeSelect = this.container.querySelector('#field-commune-select') as HTMLSelectElement;

    wilayaSelect?.addEventListener('change', () => {
      if (communeSelect) {
        communeSelect.innerHTML = this.renderCommuneOptions();
      }
      syncForm();
    });

    communeSelect?.addEventListener('change', () => {
      syncForm();
    });

    // JSON editor change
    editor?.addEventListener('input', () => {
      try {
        const parsed = JSON.parse(editor.value);
        this.order = parsed;
        const errEl = this.container.querySelector('#payload-error');
        errEl?.classList.add('hidden');
      } catch (err: any) {
        const errEl = this.container.querySelector('#payload-error');
        if (errEl) {
          errEl.textContent = `JSON Error: ${err.message}`;
          errEl.classList.remove('hidden');
        }
      }
    });

    // Reset default
    this.container.querySelector('#reset-order-btn')?.addEventListener('click', () => {
      this.order = { ...DEFAULT_ORDER };
      this.render();
    });

    // Copy LAN URL button
    this.container.querySelector('#copy-lan-btn')?.addEventListener('click', () => {
      if (this.localIpInfo?.phoneUrl) {
        navigator.clipboard.writeText(this.localIpInfo.phoneUrl);
        const label = this.container.querySelector('#copy-btn-label');
        if (label) {
          label.textContent = 'Copied!';
          setTimeout(() => {
            label.textContent = 'Copy Phone URL';
          }, 1500);
        }
      }
    });

    // Start / Trigger call
    this.container.querySelector('#trigger-call-btn')?.addEventListener('click', () => {
      this.handleTriggerCall();
    });

    // Hangup
    this.container.querySelector('#hangup-call-btn')?.addEventListener('click', () => {
      fetch('/api/hangup', { method: 'POST' });
    });

    // Shopify webhook simulations
    this.container.querySelector('#simulate-shopify-standard-btn')?.addEventListener('click', () => {
      this.handleSimulateShopifyWebhook('standard');
    });

    this.container.querySelector('#simulate-shopify-codform-btn')?.addEventListener('click', () => {
      this.handleSimulateShopifyWebhook('cod-form');
    });

    // YouCan webhook simulations
    this.container.querySelector('#simulate-youcan-standard-btn')?.addEventListener('click', () => {
      this.handleSimulateYouCanWebhook('standard');
    });

    this.container.querySelector('#simulate-youcan-extrafields-btn')?.addEventListener('click', () => {
      this.handleSimulateYouCanWebhook('extra-fields');
    });

    // WooCommerce webhook simulations
    this.container.querySelector('#simulate-woocommerce-standard-btn')?.addEventListener('click', () => {
      this.handleSimulateWooCommerceWebhook('standard');
    });

    this.container.querySelector('#simulate-woocommerce-metacod-btn')?.addEventListener('click', () => {
      this.handleSimulateWooCommerceWebhook('meta-cod');
    });

    // Google Sheets webhook simulations
    this.container.querySelector('#simulate-gsheets-setshop-btn')?.addEventListener('click', () => {
      this.handleSimulateGSheetsWebhook('setshop');
    });

    this.container.querySelector('#simulate-gsheets-arabic-btn')?.addEventListener('click', () => {
      this.handleSimulateGSheetsWebhook('arabic');
    });

    // Tassyir webhook simulations
    this.container.querySelector('#simulate-tassyir-standard-btn')?.addEventListener('click', () => {
      this.handleSimulateTassyirWebhook('standard');
    });

    this.container.querySelector('#simulate-tassyir-stopdesk-btn')?.addEventListener('click', () => {
      this.handleSimulateTassyirWebhook('stopdesk');
    });
  }

  private syncFormToJson() {
    const editor = this.container.querySelector('#payload-editor') as HTMLTextAreaElement;
    if (editor) {
      editor.value = JSON.stringify(this.order, null, 2);
    }
  }

  private syncJsonToForm() {
    const editor = this.container.querySelector('#payload-editor') as HTMLTextAreaElement;
    if (editor) {
      try {
        this.order = JSON.parse(editor.value);
        // Update input values
        (this.container.querySelector('#field-customer-name') as HTMLInputElement).value = this.order.customer_name;
        (this.container.querySelector('#field-customer-phone') as HTMLInputElement).value = this.order.customer_phone;
        (this.container.querySelector('#field-item-name') as HTMLInputElement).value = this.order.item_name;
        (this.container.querySelector('#field-item-variant') as HTMLInputElement).value = this.order.current_variant;
        (this.container.querySelector('#field-price') as HTMLInputElement).value = String(this.order.price_da);
        (this.container.querySelector('#field-store-name') as HTMLInputElement).value = this.order.store_name;
        (this.container.querySelector('#field-address-note') as HTMLInputElement).value = this.order.current_address_note || '';

        const wilayaSelect = this.container.querySelector('#field-wilaya-select') as HTMLSelectElement;
        if (wilayaSelect) {
          wilayaSelect.innerHTML = this.renderWilayaOptions();
        }
        const communeSelect = this.container.querySelector('#field-commune-select') as HTMLSelectElement;
        if (communeSelect) {
          communeSelect.innerHTML = this.renderCommuneOptions();
        }
      } catch (e) {}
    }
  }

  private handleTriggerCall() {
    const agentIdInput = this.container.querySelector('#agent-id-input') as HTMLInputElement;
    const agentId = agentIdInput ? agentIdInput.value.trim() : this.defaultAgentId;

    const voiceConfig: VoiceConfig = {
      engine: 'elevenagents',
      agentId,
      useAgentDefaults: true,
      ttsModel: 'agent-default',
    };

    fetch('/api/trigger-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: this.order, config: voiceConfig }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => {
            throw new Error(d.error || 'Failed to trigger call');
          });
        }
      })
      .catch((err) => {
        alert(err.message);
      });
  }

  private updateStatusBadge() {
    const pill = this.container.querySelector('#phone-status-pill');
    const triggerBtn = this.container.querySelector('#trigger-call-btn') as HTMLButtonElement;
    const triggerText = this.container.querySelector('#trigger-btn-text');
    const hangupBtn = this.container.querySelector('#hangup-call-btn') as HTMLButtonElement;
    const stateLabel = this.container.querySelector('#call-state-label');

    if (!pill) return;

    if (stateLabel) {
      stateLabel.textContent = this.currentCallState;
    }

    if (!this.isPhoneOnline) {
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-600"></span><span>Receiver offline</span>`;
      if (triggerBtn) triggerBtn.disabled = true;
      if (hangupBtn) hangupBtn.disabled = true;
      return;
    }

    if (this.currentCallState === 'standby') {
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span class="text-zinc-300">Receiver ready</span>`;
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.className =
          'flex-1 h-10 px-4 bg-white text-zinc-950 font-medium text-xs rounded-lg hover:bg-zinc-200 active:scale-[0.99] transition flex items-center justify-center gap-2 shadow-sm';
        if (triggerText) triggerText.textContent = 'Start Call';
      }
      if (hangupBtn) hangupBtn.disabled = true;
    } else if (this.currentCallState === 'ringing') {
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span><span class="text-zinc-200">Phone ringing...</span>`;
      if (triggerBtn) {
        triggerBtn.disabled = true;
        if (triggerText) triggerText.textContent = 'Ringing...';
      }
      if (hangupBtn) hangupBtn.disabled = false;
    } else if (this.currentCallState === 'active') {
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span class="text-zinc-200">In conversation</span>`;
      if (triggerBtn) {
        triggerBtn.disabled = true;
        if (triggerText) triggerText.textContent = 'Call in Progress';
      }
      if (hangupBtn) hangupBtn.disabled = false;
    } else if (this.currentCallState === 'finalizing') {
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span><span class="text-zinc-200">Recording decision...</span>`;
      if (triggerBtn) triggerBtn.disabled = true;
      if (hangupBtn) hangupBtn.disabled = true;
    } else if (this.currentCallState === 'ended') {
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span><span class="text-zinc-400">Call concluded</span>`;
      if (triggerBtn) triggerBtn.disabled = true;
      if (hangupBtn) hangupBtn.disabled = true;
    }
  }

  private updateLanInfoUi() {
    if (!this.localIpInfo) return;
    const copyBtn = this.container.querySelector('#copy-lan-btn');
    if (copyBtn) {
      copyBtn.classList.remove('hidden');
    }
  }

  private renderTranscripts() {
    const feed = this.container.querySelector('#transcript-feed');
    if (!feed) return;

    if (this.transcripts.length === 0) {
      feed.innerHTML = `
        <div class="h-full flex items-center justify-center text-zinc-600 text-xs italic">
          Waiting for active call...
        </div>
      `;
      return;
    }

    feed.innerHTML = this.transcripts
      .map((t) => {
        const isAgent = t.speaker === 'agent';
        const align = isAgent ? 'mr-auto' : 'ml-auto';
        const bg = isAgent
          ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
          : 'bg-zinc-800 text-zinc-100';
        const speaker = isAgent ? 'Agent' : 'Customer';
        const time = new Date(t.timestamp).toLocaleTimeString([], {
          minute: '2-digit',
          second: '2-digit',
        });

        return `
          <div class="max-w-[85%] rounded-lg p-2.5 text-xs ${align} ${bg} shadow-sm space-y-1">
            <div class="flex items-center justify-between gap-3 text-[10px] text-zinc-400">
              <span class="font-medium ${isAgent ? 'text-zinc-300' : 'text-zinc-200'}">${speaker}</span>
              <span class="font-mono">${time}</span>
            </div>
            <div class="leading-relaxed font-sans whitespace-pre-wrap">${t.text}</div>
          </div>
        `;
      })
      .join('');

    feed.scrollTop = feed.scrollHeight;
  }

  private renderDecisionSummary() {
    const body = this.container.querySelector('#decision-body');
    const pill = this.container.querySelector('#decision-status-pill');

    if (!body || !pill) return;

    if (!this.finalizedDecision) {
      pill.className = 'text-[11px] font-medium px-2 py-0.5 rounded text-zinc-500 bg-zinc-900 border border-zinc-800';
      pill.textContent = 'Pending call';
      body.innerHTML = `
        <div class="text-xs text-zinc-500 italic py-2">
          Order confirmation outcome and delivery location validation will appear here once the call is concluded.
        </div>
      `;
      return;
    }

    const d = this.finalizedDecision;
    let pillStyle = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (d.status === 'REFUSED') {
      pillStyle = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    } else if (d.status === 'MODIFIED') {
      pillStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }

    pill.className = `text-[11px] font-medium px-2 py-0.5 rounded border ${pillStyle}`;
    pill.textContent = d.status;

    // Validate finalized commune in official 2026 divisions
    const loc = validateLocation(d.final_commune, d.final_wilaya);
    const locBadge = loc.valid
      ? `<span class="text-zinc-300 text-[11px] flex items-center gap-1">${iconCheck('w-3 h-3 text-emerald-400')} ${loc.matchedCommuneName} (${loc.matchedWilayaName})</span>`
      : `<span class="text-rose-400 text-[11px]">${loc.error || 'Location Warning'}</span>`;

    let shopifyMutationHtml = '';
    if (this.shopifyMutationResult) {
      const res = this.shopifyMutationResult;
      const mut = res.mutationResult;
      const isSuccess = mut.success;
      const statusBadge = isSuccess
        ? '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">UPDATED</span>'
        : '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400">MUTATION FAILED</span>';

      const storeLabel = res.liveStore ? `${res.liveStore} (#${res.orderId})` : `#${res.orderId}`;

      shopifyMutationHtml = `
        <div class="mt-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <span class="font-medium text-zinc-200">Shopify Admin API</span>
              <span class="text-zinc-500 font-mono text-[11px]">${storeLabel}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>External Status: <code class="text-zinc-200">${mut.externalStatus}</code></span>
            <span class="text-zinc-500 font-mono text-[10px]">${new Date(res.timestamp).toLocaleTimeString()}</span>
          </div>
          <details class="cursor-pointer pt-0.5">
            <summary class="text-[10px] text-zinc-500 hover:text-zinc-400 font-mono select-none">API Mutation Details</summary>
            <pre class="mt-1 p-2 rounded bg-zinc-900 border border-zinc-800/80 text-[10px] font-mono text-zinc-400 overflow-x-auto">${JSON.stringify(
              mut.rawResponse ?? mut,
              null,
              2
            )}</pre>
          </details>
        </div>
      `;
    }

    let youcanMutationHtml = '';
    if (this.youcanMutationResult) {
      const res = this.youcanMutationResult;
      const mut = res.mutationResult;
      const isSuccess = mut.success;
      const statusBadge = isSuccess
        ? '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">UPDATED</span>'
        : '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400">MUTATION FAILED</span>';

      const storeLabel = res.liveStore ? `${res.liveStore} (#${res.orderId})` : `#${res.orderId}`;

      youcanMutationHtml = `
        <div class="mt-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <span class="font-medium text-zinc-200">YouCan REST API</span>
              <span class="text-zinc-500 font-mono text-[11px]">${storeLabel}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>External Status: <code class="text-zinc-200">${mut.externalStatus}</code></span>
            <span class="text-zinc-500 font-mono text-[10px]">${new Date(res.timestamp).toLocaleTimeString()}</span>
          </div>
          <details class="cursor-pointer pt-0.5">
            <summary class="text-[10px] text-zinc-500 hover:text-zinc-400 font-mono select-none">API Mutation Details</summary>
            <pre class="mt-1 p-2 rounded bg-zinc-900 border border-zinc-800/80 text-[10px] font-mono text-zinc-400 overflow-x-auto">${JSON.stringify(
              mut.rawResponse ?? mut,
              null,
              2
            )}</pre>
          </details>
        </div>
      `;
    }

    let woocommerceMutationHtml = '';
    if (this.woocommerceMutationResult) {
      const res = this.woocommerceMutationResult;
      const mut = res.mutationResult;
      const isSuccess = mut.success;
      const statusBadge = isSuccess
        ? '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400">UPDATED</span>'
        : '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400">MUTATION FAILED</span>';

      const storeLabel = res.liveStore ? `${res.liveStore} (#${res.orderId})` : `#${res.orderId}`;

      woocommerceMutationHtml = `
        <div class="mt-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <span class="font-medium text-zinc-200">WooCommerce REST API</span>
              <span class="text-zinc-500 font-mono text-[11px]">${storeLabel}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>External Status: <code class="text-zinc-200">${mut.externalStatus}</code></span>
            <span class="text-zinc-500 font-mono text-[10px]">${new Date(res.timestamp).toLocaleTimeString()}</span>
          </div>
          <details class="cursor-pointer pt-0.5">
            <summary class="text-[10px] text-zinc-500 hover:text-zinc-400 font-mono select-none">API Mutation Details</summary>
            <pre class="mt-1 p-2 rounded bg-zinc-900 border border-zinc-800/80 text-[10px] font-mono text-zinc-400 overflow-x-auto">${JSON.stringify(
              mut.rawResponse ?? mut,
              null,
              2
            )}</pre>
          </details>
        </div>
      `;
    }

    let gsheetsMutationHtml = '';
    if (this.gsheetsMutationResult) {
      const res = this.gsheetsMutationResult;
      const mut = res.mutationResult;
      const isSuccess = mut.success;
      const statusBadge = isSuccess
        ? '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">UPDATED</span>'
        : '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400">MUTATION FAILED</span>';

      const storeLabel = res.liveStore ? `${res.liveStore} (#${res.orderId})` : `#${res.orderId}`;

      gsheetsMutationHtml = `
        <div class="mt-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <span class="font-medium text-zinc-200">Google Sheets COD Mutation</span>
              <span class="text-zinc-500 font-mono text-[11px]">${storeLabel}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>External Status: <code class="text-zinc-200">${mut.externalStatus}</code></span>
            <span class="text-zinc-500 font-mono text-[10px]">${new Date(res.timestamp).toLocaleTimeString()}</span>
          </div>
          <details class="cursor-pointer pt-0.5">
            <summary class="text-[10px] text-zinc-500 hover:text-zinc-400 font-mono select-none">API Mutation Details</summary>
            <pre class="mt-1 p-2 rounded bg-zinc-900 border border-zinc-800/80 text-[10px] font-mono text-zinc-400 overflow-x-auto">${JSON.stringify(
              mut.rawResponse ?? mut,
              null,
              2
            )}</pre>
          </details>
        </div>
      `;
    }

    let tassyirMutationHtml = '';
    if (this.tassyirMutationResult) {
      const res = this.tassyirMutationResult;
      const mut = res.mutationResult;
      const isSuccess = mut.success;
      const statusBadge = isSuccess
        ? '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400">UPDATED</span>'
        : '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400">MUTATION FAILED</span>';

      const storeLabel = res.liveStore ? `${res.liveStore} (#${res.orderId})` : `#${res.orderId}`;

      tassyirMutationHtml = `
        <div class="mt-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <span class="font-medium text-zinc-200">Tassyir Algerian COD ERP</span>
              <span class="text-zinc-500 font-mono text-[11px]">${storeLabel}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>External Status: <code class="text-zinc-200">${mut.externalStatus}</code></span>
            <span class="text-zinc-500 font-mono text-[10px]">${new Date(res.timestamp).toLocaleTimeString()}</span>
          </div>
          <details class="cursor-pointer pt-0.5">
            <summary class="text-[10px] text-zinc-500 hover:text-zinc-400 font-mono select-none">API Mutation Details</summary>
            <pre class="mt-1 p-2 rounded bg-zinc-900 border border-zinc-800/80 text-[10px] font-mono text-zinc-400 overflow-x-auto">${JSON.stringify(
              mut.rawResponse ?? mut,
              null,
              2
            )}</pre>
          </details>
        </div>
      `;
    }

    body.innerHTML = `
      <div class="space-y-3 pt-1 text-xs">
        <div class="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
          <div>
            <span class="text-[10px] text-zinc-500 uppercase tracking-wider block">Final Variant</span>
            <span class="text-zinc-200 font-medium">${d.final_variant}</span>
          </div>
          <div>
            <span class="text-[10px] text-zinc-500 uppercase tracking-wider block">Verified Location</span>
            ${locBadge}
          </div>
        </div>

        ${
          d.final_address_note
            ? `<div>
                <span class="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Address Note</span>
                <span class="text-zinc-300">${d.final_address_note}</span>
              </div>`
            : ''
        }

        ${
          d.reason_or_notes
            ? `<div class="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span class="text-[10px] text-zinc-500 uppercase tracking-wider block mb-0.5">Call Notes</span>
                <p class="text-zinc-300 leading-relaxed">${d.reason_or_notes}</p>
              </div>`
            : ''
        }

        ${shopifyMutationHtml}
        ${youcanMutationHtml}
        ${woocommerceMutationHtml}
        ${gsheetsMutationHtml}
        ${tassyirMutationHtml}

        <details class="cursor-pointer pt-1">
          <summary class="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono select-none">Raw JSON Contract</summary>
          <pre class="mt-1.5 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">${JSON.stringify(
            d,
            null,
            2
          )}</pre>
        </details>
      </div>
    `;
  }

  private updateShopifyStatusUi() {
    const pill = this.container.querySelector('#shopify-status-pill') as HTMLElement | null;
    if (!pill) return;
    if (this.shopifyConfigured && this.shopifyDomain) {
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/10';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span class="font-mono text-[11px]">${this.shopifyDomain}</span>`;
      pill.title = 'Live Shopify Admin API Connected';
    } else {
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span><span class="text-[11px]">Shopify Sandbox</span>`;
      pill.title = 'Shopify credentials not configured (Webhook test & local sandbox mode)';
    }
  }

  private updateYouCanStatusUi() {
    const pill = this.container.querySelector('#youcan-status-pill') as HTMLElement | null;
    if (!pill) return;
    if (this.youcanConfigured && this.youcanApiBaseUrl) {
      const cleanUrl = this.youcanApiBaseUrl.replace(/^https?:\/\//, '');
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20 bg-indigo-500/10';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span><span class="font-mono text-[11px]">${cleanUrl}</span>`;
      pill.title = 'Live YouCan REST API Connected';
    } else {
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span><span class="text-[11px]">YouCan Sandbox</span>`;
      pill.title = 'YouCan credentials not configured (Webhook test & local sandbox mode)';
    }
  }

  private updateWooCommerceStatusUi() {
    const pill = this.container.querySelector('#woocommerce-status-pill') as HTMLElement | null;
    if (!pill) return;
    if (this.woocommerceConfigured && this.woocommerceSiteUrl) {
      const cleanUrl = this.woocommerceSiteUrl.replace(/^https?:\/\//, '');
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-purple-400 px-2.5 py-1 rounded-md border border-purple-500/20 bg-purple-500/10';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span><span class="font-mono text-[11px]">${cleanUrl}</span>`;
      pill.title = 'Live WooCommerce REST API Connected';
    } else {
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span><span class="text-[11px]">WooCommerce Sandbox</span>`;
      pill.title = 'WooCommerce credentials not configured (Webhook test & local sandbox mode)';
    }
  }

  private updateGSheetsStatusUi() {
    const pill = this.container.querySelector('#gsheets-status-pill') as HTMLElement | null;
    if (!pill) return;
    if (this.gsheetsConfigured) {
      const modeLabel = this.gsheetsMode === 'api_v4' ? 'API v4' : 'Apps Script';
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/10';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span class="font-mono text-[11px]">GSheets (${modeLabel})</span>`;
      pill.title = 'Live Google Sheets Integration Connected';
    } else {
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span><span class="text-[11px]">GSheets Sandbox</span>`;
      pill.title = 'Google Sheets credentials not configured (Webhook test & local sandbox mode)';
    }
  }

  private updateTassyirStatusUi() {
    const pill = this.container.querySelector('#tassyir-status-pill') as HTMLElement | null;
    if (!pill) return;
    if (this.tassyirConfigured && this.tassyirApiBaseUrl) {
      const cleanUrl = this.tassyirApiBaseUrl.replace(/^https?:\/\//, '');
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/20 bg-amber-500/10';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span class="font-mono text-[11px]">${cleanUrl}</span>`;
      pill.title = 'Live Tassyir COD ERP Connected';
    } else {
      pill.className =
        'hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/50';
      pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span><span class="text-[11px]">Tassyir Sandbox</span>`;
      pill.title = 'Tassyir credentials not configured (Webhook test & local sandbox mode)';
    }
  }

  private updateOrderSyncBadge() {
    const badge = this.container.querySelector('#order-sync-badge');
    if (!badge) return;
    if (this.order.source === 'shopify') {
      badge.className =
        'text-[10px] px-1.5 py-0.5 rounded font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
      badge.textContent = `Shopify: #${this.order.order_id}`;
    } else if (this.order.source === 'youcan') {
      badge.className =
        'text-[10px] px-1.5 py-0.5 rounded font-mono border border-indigo-500/20 bg-indigo-500/10 text-indigo-400';
      badge.textContent = `YouCan: #${this.order.order_id}`;
    } else if (this.order.source === 'woocommerce') {
      badge.className =
        'text-[10px] px-1.5 py-0.5 rounded font-mono border border-purple-500/20 bg-purple-500/10 text-purple-400';
      badge.textContent = `WooCommerce: #${this.order.order_id}`;
    } else if (this.order.source === 'gsheets') {
      badge.className =
        'text-[10px] px-1.5 py-0.5 rounded font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
      badge.textContent = `GSheets: #${this.order.order_id}`;
    } else if (this.order.source === 'tassyir') {
      badge.className =
        'text-[10px] px-1.5 py-0.5 rounded font-mono border border-amber-500/20 bg-amber-500/10 text-amber-400';
      badge.textContent = `Tassyir: #${this.order.order_id}`;
    } else {
      badge.className =
        'text-[10px] px-1.5 py-0.5 rounded font-mono border border-zinc-800 bg-zinc-950 text-zinc-400';
      badge.textContent = 'Local Order';
    }
  }

  private updateFormFieldsFromOrder() {
    const nameInp = this.container.querySelector('#field-customer-name') as HTMLInputElement | null;
    const phoneInp = this.container.querySelector('#field-customer-phone') as HTMLInputElement | null;
    const itemInp = this.container.querySelector('#field-item-name') as HTMLInputElement | null;
    const variantInp = this.container.querySelector('#field-item-variant') as HTMLInputElement | null;
    const priceInp = this.container.querySelector('#field-price') as HTMLInputElement | null;
    const storeInp = this.container.querySelector('#field-store-name') as HTMLInputElement | null;
    const noteInp = this.container.querySelector('#field-address-note') as HTMLInputElement | null;
    const wilayaSelect = this.container.querySelector('#field-wilaya-select') as HTMLSelectElement | null;
    const communeSelect = this.container.querySelector('#field-commune-select') as HTMLSelectElement | null;

    if (nameInp) nameInp.value = this.order.customer_name;
    if (phoneInp) phoneInp.value = this.order.customer_phone;
    if (itemInp) itemInp.value = this.order.item_name;
    if (variantInp) variantInp.value = this.order.current_variant;
    if (priceInp) priceInp.value = String(this.order.price_da);
    if (storeInp) storeInp.value = this.order.store_name;
    if (noteInp) noteInp.value = this.order.current_address_note || '';

    if (wilayaSelect) {
      wilayaSelect.innerHTML = this.renderWilayaOptions();
    }
    if (communeSelect) {
      communeSelect.innerHTML = this.renderCommuneOptions();
    }

    this.syncFormToJson();
  }

  private async handleSimulateShopifyWebhook(fixture: 'standard' | 'cod-form') {
    try {
      const res = await fetch('/api/webhooks/shopify/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to simulate Shopify webhook');
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  private async handleSimulateYouCanWebhook(fixture: 'standard' | 'extra-fields') {
    try {
      const res = await fetch('/api/webhooks/youcan/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to simulate YouCan webhook');
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  private async handleSimulateWooCommerceWebhook(fixture: 'standard' | 'meta-cod') {
    try {
      const res = await fetch('/api/webhooks/woocommerce/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to simulate WooCommerce webhook');
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  private async handleSimulateGSheetsWebhook(fixture: 'setshop' | 'arabic') {
    try {
      const res = await fetch('/api/webhooks/gsheets/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to simulate Google Sheets webhook');
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  private async handleSimulateTassyirWebhook(fixture: 'standard' | 'stopdesk') {
    try {
      const res = await fetch('/api/webhooks/tassyir/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to simulate Tassyir webhook');
      }
    } catch (err: any) {
      alert(err.message);
    }
  }
}

