import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
    client = new Anthropic({ apiKey, maxRetries: 3 });
  }
  return client;
}

export interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

// ─── Tool-based Agentic Call ──────────────────────────────────────────────────

export type ToolExecutor = (
  name: string,
  input: Record<string, unknown>,
) => Promise<{ result: string; isError?: boolean }>;

/**
 * Single entry point for tool-based agent calls.
 * Handles the full agentic loop: call Claude → execute tools → feed results → repeat.
 * Max iterations prevents runaway loops.
 */
export async function callWithTools(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[],
  toolExecutor?: ToolExecutor,
  maxIterations = 3,
): Promise<Anthropic.Message> {
  const anthropic = getClient();

  // Prompt caching: cache_control on system prompt and tools reduces cost on multi-turn SMS conversations.
  // The cache_control property is available on SDK >=0.50.0. We use type assertions
  // to maintain compatibility during the SDK upgrade transition.
  const systemWithCache = [
    {
      type: 'text' as const,
      text: systemPrompt,
      cache_control: { type: 'ephemeral' },
    },
  ] as unknown as Anthropic.TextBlockParam[];

  const toolsWithCache = tools.map((tool, i) =>
    i === tools.length - 1
      ? { ...tool, cache_control: { type: 'ephemeral' } }
      : tool,
  ) as Anthropic.Tool[];

  const currentMessages = [...messages];

  logger.info('Calling Claude API with tools', {
    messageCount: currentMessages.length,
    toolCount: tools.length,
  });

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemWithCache,
    messages: currentMessages,
    tools: toolsWithCache,
  });

  logger.info('Claude response received', {
    stopReason: response.stop_reason,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  // Agentic loop: if Claude wants to use tools, execute and feed back
  let iterations = 0;
  while (response.stop_reason === 'tool_use' && iterations < maxIterations) {
    iterations++;

    // If no tool executor provided, return the response for caller to handle
    if (!toolExecutor) {
      return response;
    }

    // Execute all tool calls in this response
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        try {
          const { result, isError } = await toolExecutor(
            block.name,
            block.input as Record<string, unknown>,
          );
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
            ...(isError ? { is_error: true } : {}),
          });
        } catch (error) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            is_error: true,
          });
        }
      }
    }

    // Append assistant response + tool results, then call again
    currentMessages.push({ role: 'assistant', content: response.content });
    currentMessages.push({ role: 'user', content: toolResults });

    logger.info('Continuing Claude call with tool results', {
      iteration: iterations,
      toolResultCount: toolResults.length,
    });

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemWithCache,
      messages: currentMessages,
      tools: toolsWithCache,
    });

    logger.info('Claude continuation response', {
      stopReason: response.stop_reason,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      iteration: iterations,
    });
  }

  if (iterations >= maxIterations && response.stop_reason === 'tool_use') {
    logger.warn('Agent loop hit max iterations', { maxIterations });
  }

  return response;
}

// ─── Structured Output (tool use for guaranteed JSON) ──────────────────────────

export async function generateStructured<T>(
  systemPrompt: string,
  userMessage: string,
  schema: { name: string; description: string; input_schema: Record<string, unknown> },
  options?: { maxTokens?: number },
): Promise<{ data: T; inputTokens: number; outputTokens: number }> {
  const anthropic = getClient();

  const tool: Anthropic.Tool = {
    name: schema.name,
    description: schema.description,
    input_schema: schema.input_schema as Anthropic.Tool.InputSchema,
  };

  logger.info('Calling Claude API (structured)', {
    toolName: schema.name,
    systemPromptLength: systemPrompt.length,
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: options?.maxTokens ?? 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    tools: [tool],
    tool_choice: { type: 'tool', name: schema.name },
  });

  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return structured output');
  }

  logger.info('Claude structured response received', {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  return {
    data: toolBlock.input as T,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// ─── Legacy Functions (backward compatibility) ────────────────────────────────

export async function generateResponse(
  systemPrompt: string,
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: { maxTokens?: number },
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
    max_tokens: options?.maxTokens ?? 300,
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
