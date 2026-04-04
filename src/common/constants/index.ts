// ============================================
// Constants — Queue Names, Events, and App-wide Constants
// ============================================

// ─── RabbitMQ Queues ────────────────────────
export const QUEUES = {
  WHATSAPP_INCOMING: 'whatsapp.incoming',
  WHATSAPP_OUTGOING: 'whatsapp.outgoing',
  AI_PROCESSING: 'ai.processing',
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  PAYMENT_PROCESS: 'payment.process',
  NOTIFICATION_SEND: 'notification.send',
} as const;

// ─── AI Intents ─────────────────────────────
export const INTENTS = {
  GREETING: 'GREETING',
  GET_MENU: 'GET_MENU',
  CREATE_ORDER: 'CREATE_ORDER',
  CONFIRM_ORDER: 'CONFIRM_ORDER',
  TRACK_ORDER: 'TRACK_ORDER',
  CANCEL_ORDER: 'CANCEL_ORDER',
  PAYMENT_STATUS: 'PAYMENT_STATUS',
  FAQ: 'FAQ',
  UNKNOWN: 'UNKNOWN',
} as const;

// ─── Conversation States ────────────────────
export const CONVERSATION_STATES = {
  NEW: 'NEW',
  GREETING: 'GREETING',
  BROWSING: 'BROWSING',
  ORDERING: 'ORDERING',
  CONFIRMING: 'CONFIRMING',
  PAYING: 'PAYING',
  COMPLETED: 'COMPLETED',
} as const;

// ─── Pagination Defaults ────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
