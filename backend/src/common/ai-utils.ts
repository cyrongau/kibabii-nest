import { Logger } from '@nestjs/common';
import axios from 'axios';

const logger = new Logger('AiUtils');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';
const DEFAULT_TIMEOUT = 30000;
const RETRY_DELAY_MS = 3000;

/**
 * Call OpenRouter AI with automatic retry on transient errors (429, 503).
 */
export async function callOpenRouter(
  messages: any[],
  options: {
    model?: string;
    responseFormat?: 'json_object' | 'text';
    timeout?: number;
    maxRetries?: number;
  } = {},
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    responseFormat = 'text',
    timeout = DEFAULT_TIMEOUT,
    maxRetries = 1,
  } = options;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const payload: any = {
    model,
    messages,
  };
  if (responseFormat === 'json_object') {
    payload.response_format = { type: 'json_object' };
  }

  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(OPENROUTER_URL, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://kibabiinest.com',
          'X-Title': 'Kibabii Nest',
        },
        timeout,
      });
      return response.data.choices[0].message.content as string;
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      const isRetryable = status === 429 || status === 503;
      if (isRetryable && attempt < maxRetries) {
        logger.warn(`OpenRouter rate limited (${status}), retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

/**
 * Robustly extract a JSON object from an AI text response.
 * Handles markdown code fences, extra prose, etc.
 */
export function parseAIJson<T = Record<string, any>>(content: string): T | null {
  try {
    // Strip markdown code fences if present
    const stripped = content.replace(/```(?:json)?\n?([\s\S]*?)```/g, '$1').trim();
    // Find the first JSON object in the text
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch (e) {
    logger.warn('Failed to parse AI JSON response', { content });
    return null;
  }
}
