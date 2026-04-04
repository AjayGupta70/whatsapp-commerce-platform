// ============================================
// Application Configuration
// Centralized config using @nestjs/config
// ============================================

export default () => ({
  app: {
    name: process.env.APP_NAME || 'whatsapp-automation',
    port: parseInt(process.env.APP_PORT || '3000', 10) || 3000,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
    apiVersion: process.env.API_VERSION || 'v1',
  },

  // MongoDB — Messages, Chats, Logs
  mongodb: {
    uri:
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/whatsapp_automation',
  },

  // PostgreSQL (via Prisma) — Users, Tenants, Orders, Payments
  database: {
    url: process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/whatsapp_automation',
  },

  // Redis — Sessions, Cache, Conversation State
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // RabbitMQ — Event Bus
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // OpenAI — LLM Provider
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1024', 10) || 1024,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3') || 0.3,
  },

  // Razorpay — Payments
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  // WhatsApp — Baileys
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH || './sessions',
  },
});
