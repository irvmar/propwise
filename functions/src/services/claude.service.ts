import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export async function generateResponse(
  systemPrompt: string,
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<ClaudeResponse> {
  const anthropic = getClient();

  const messages: Anthropic.MessageParam[] = [];

  if (conversationHistory) {
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({ role: 'user', content: userMessage });

  logger.info('Calling Claude API', {
    messageCount: messages.length,
    systemPromptLength: systemPrompt.length,
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const text = textBlock?.type === 'text' ? textBlock.text : '';

  logger.info('Claude response received', {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export async function classifyIntent(
  message: string,
  categories: string[],
): Promise<{ intent: string; confidence: number }> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 100,
    system: `You are an intent classifier for a property management AI. Classify the tenant's message into exactly one category. Respond with JSON only: {"intent": "<category>", "confidence": <0-1>}

Categories: ${categories.join(', ')}`,
    messages: [{ role: 'user', content: message }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const text = textBlock?.type === 'text' ? textBlock.text : '{}';

  try {
    return JSON.parse(text);
  } catch {
    return { intent: 'unknown', confidence: 0 };
  }
}
