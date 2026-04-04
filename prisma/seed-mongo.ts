// ============================================
// Database Seed — MongoDB
// Run: npx ts-node src/database/seeds/seed-mongo.ts
// ============================================

import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── Message Schema (for seed) ──────────────
const messageSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'video', 'audio', 'document'], default: 'text' },
    whatsappMessageId: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'messages' },
);

// ─── Conversation State Schema (for seed) ───
const conversationStateSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    phone: { type: String, required: true },
    state: { type: String, enum: ['NEW', 'GREETING', 'BROWSING', 'ORDERING', 'CONFIRMING', 'PAYING', 'COMPLETED'], default: 'NEW' },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'conversation_states' },
);

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp_automation';
  console.log('🌱 Seeding MongoDB database...');

  await mongoose.connect(uri);

  const Message = mongoose.model('Message', messageSchema);
  const ConversationState = mongoose.model('ConversationState', conversationStateSchema);

  // Clear existing seed data
  await Message.deleteMany({ tenantId: 'seed-demo' });
  await ConversationState.deleteMany({ tenantId: 'seed-demo' });

  // ─── Seed sample messages ─────────────────
  const messages = [
    { tenantId: 'seed-demo', userId: 'demo-user-1', phone: '+919876543210', direction: 'incoming', content: 'Hi', messageType: 'text' },
    { tenantId: 'seed-demo', userId: 'demo-user-1', phone: '+919876543210', direction: 'outgoing', content: 'Hey 👋 Welcome to Demo Store! What would you like to order?', messageType: 'text' },
    { tenantId: 'seed-demo', userId: 'demo-user-1', phone: '+919876543210', direction: 'incoming', content: 'I want 2 burgers', messageType: 'text' },
    { tenantId: 'seed-demo', userId: 'demo-user-1', phone: '+919876543210', direction: 'outgoing', content: 'Got it! 2x Classic Burger 🍔 = ₹300. Proceed to payment?', messageType: 'text' },
  ];

  await Message.insertMany(messages);
  console.log(`  ✅ Messages: ${messages.length} sample messages created`);

  // ─── Seed sample conversation state ───────
  await ConversationState.create({
    tenantId: 'seed-demo',
    userId: 'demo-user-1',
    phone: '+919876543210',
    state: 'ORDERING',
    context: { currentItems: [{ item: 'Classic Burger', quantity: 2 }] },
  });

  console.log('  ✅ Conversation state: 1 sample state created');
  console.log('\n🎉 MongoDB seed completed!');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌ MongoDB seed failed:', e);
  process.exit(1);
});
