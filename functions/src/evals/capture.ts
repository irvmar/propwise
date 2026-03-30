#!/usr/bin/env node

/**
 * Capture Real Events — Convert Firestore conversations into EvalCase fixtures.
 *
 * Usage:
 *   npx ts-node src/evals/capture.ts <conversationId>
 *
 * This reads a real conversation from Firestore and outputs an EvalCase
 * that can be added to the fixture datasets.
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or Firebase emulator
 */

import * as admin from 'firebase-admin';
import { EvalCase } from './fixtures/types';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function captureConversation(conversationId: string): Promise<EvalCase | null> {
  // 1. Load conversation
  const convDoc = await db.collection('conversations').doc(conversationId).get();
  if (!convDoc.exists) {
    console.error(`Conversation ${conversationId} not found`);
    return null;
  }
  const conv = convDoc.data()!;

  // 2. Load messages (most recent first)
  const messagesSnap = await db
    .collection('messages')
    .where('conversationId', '==', conversationId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  const messages = messagesSnap.docs
    .map((d) => d.data())
    .reverse(); // chronological order

  // 3. Find the last inbound (tenant) message
  const lastTenantMsg = [...messages].reverse().find((m) => m.direction === 'inbound');
  if (!lastTenantMsg) {
    console.error('No inbound messages found in conversation');
    return null;
  }

  // 4. Load tenant
  const tenantDoc = await db.collection('tenants').doc(conv.tenantId).get();
  const tenant = tenantDoc.exists ? tenantDoc.data()! : null;

  // 5. Load organization
  const orgDoc = await db.collection('organizations').doc(conv.organizationId).get();
  const org = orgDoc.exists ? orgDoc.data()! : null;

  // 6. Build conversation history (exclude the last tenant message)
  const history = messages
    .slice(0, -1)
    .map((m) => ({
      role: (m.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.body,
    }));

  // 7. Build the EvalCase
  const evalCase: EvalCase = {
    id: `captured-${conversationId.slice(0, 8)}`,
    description: `Captured from production: "${lastTenantMsg.body.slice(0, 50)}..."`,
    category: 'edge_case', // Default — human should categorize
    tags: ['captured', 'production'],
    input: {
      message: lastTenantMsg.body,
      contextOverrides: {
        ...(history.length > 0 ? { conversationHistory: history } : {}),
      },
    },
    expected: {
      // Leave empty — human fills these in based on domain knowledge
    },
  };

  // Print metadata for context
  console.log('\n--- Captured Event ---');
  console.log(`Conversation: ${conversationId}`);
  console.log(`Tenant: ${tenant?.firstName} ${tenant?.lastName} (${conv.tenantPhone})`);
  console.log(`Org: ${org?.name}`);
  console.log(`Message: "${lastTenantMsg.body}"`);
  console.log(`History: ${history.length} prior messages`);
  console.log('\n--- EvalCase (add to a dataset file) ---\n');
  console.log(JSON.stringify(evalCase, null, 2));

  return evalCase;
}

// ─── CLI ────────────────────────────────────────────────────────────────────

const conversationId = process.argv[2];
if (!conversationId) {
  console.error('Usage: npx ts-node src/evals/capture.ts <conversationId>');
  process.exit(1);
}

captureConversation(conversationId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
