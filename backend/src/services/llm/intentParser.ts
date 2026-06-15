/**
 * DIEPS Intent Engine — Intent Parser
 * Parses natural language swap commands into structured intents.
 * Uses OpenRouter LLM parsing exclusively.
 */

import { OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_BASE_URL } from '../../config/index.js';
import { resolveToken } from '../coin/tokenResolver.js';
import { logger, createTimer } from '../../utils/logger.js';
import type { ParsedIntent, IntentParseResult, PriorityMode, UserConstraint } from '../../types/index.js';



/**
 * Parse a natural language prompt into a structured swap intent.
 * Uses OpenRouter LLM exclusively for processing intents.
 */
export async function parseIntent(prompt: string): Promise<IntentParseResult> {
  const timer = createTimer('parseIntent');

  if (!OPENROUTER_API_KEY) {
    timer.end({ method: 'failed' });
    throw new Error('OPENROUTER_API_KEY is not configured. Cannot parse intent.');
  }

  try {
    const llmResult = await parseWithLLM(prompt);
    if (llmResult) {
      timer.end({ method: 'llm', confidence: llmResult.confidence_score });
      return llmResult;
    }
  } catch (err: any) {
    logger.error('LLM parsing failed', { error: err.message });
    timer.end({ method: 'failed' });
    throw new Error(`Failed to parse intent: ${err.message}`);
  }

  timer.end({ method: 'failed' });
  throw new Error('Could not parse intent from prompt');
}


/**
 * Parse intent using OpenRouter LLM (google/gemma-4-31b-it:free).
 * Called when regex parsing fails for complex intents.
 */
async function parseWithLLM(prompt: string): Promise<IntentParseResult | null> {
  logger.info('Attempting LLM parsing via OpenRouter', { model: OPENROUTER_MODEL });

  const systemPrompt = `You are a DeFi intent parser for the Sui blockchain. Parse the user's trading intent into a structured JSON response.

You MUST respond with ONLY valid JSON, no other text. The JSON must have this exact structure:
{
  "action_type": "SWAP",
  "trade_amount": "1000",
  "source_token_symbol": "SUI",
  "destination_token_symbol": "USDC",
  "priority_mode": "SAFE",
  "constraints": []
}

Rules:
- action_type is always "SWAP" for trading intents
- trade_amount is a number string (no commas)
- Token symbols should be uppercase. The Sui ecosystem has many coins including meme coins (e.g. SUI, USDC, USDT, ETH, BTC, CETUS, TURBOS, BLUB, FUD, NAVX, SCA, etc). Accept ANY word as a valid token symbol.
- IMPORTANT: If the user provides a FULL CONTRACT ADDRESS (e.g. 0x...::pepe::PEPE), you MUST output the EXACT FULL ADDRESS as the symbol. DO NOT shorten it.
- priority_mode: "SAFE" (default/low slippage), "FAST" (quick execution), "MAX_OUTPUT" (best rate)
- constraints: array of objects with {type, value} for slippage, deadline, etc.

If the intent is completely unrelated to trading, respond with:
{"error": "unclear_intent"}`;

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://dieps-intent-engine.app',
      'X-Title': 'DIEPS Intent Engine',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty LLM response');
  }

  try {
    // Extract JSON from the response (in case there's surrounding text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in LLM response');

    const parsed = JSON.parse(jsonMatch[0]);

    logger.info('LLM raw parsed response', { parsed });

    if (parsed.error) {
      logger.warn('LLM returned unclear_intent error', { error: parsed.error });
      return null;
    }

    // Resolve tokens
    const sourceToken = resolveToken(parsed.source_token_symbol);
    const destToken = resolveToken(parsed.destination_token_symbol);

    return {
      intent: {
        action_type: parsed.action_type || 'SWAP',
        trade_amount: String(parsed.trade_amount).replace(/,/g, ''),
        source_token_symbol: sourceToken?.symbol || parsed.source_token_symbol,
        source_token_address: sourceToken?.address || parsed.source_token_symbol,
        destination_token_symbol: destToken?.symbol || parsed.destination_token_symbol,
        destination_token_address: destToken?.address || parsed.destination_token_symbol,
        priority_mode: parsed.priority_mode || 'SAFE',
        user_constraints: (parsed.constraints || []).map((c: any) => ({
          type: c.type,
          value: String(c.value),
          raw: `${c.type}: ${c.value}`,
        })),
      },
      confidence_score: 0.90,
      validation_status: 'VALID',
    };
  } catch (parseErr: any) {
    logger.warn('Failed to parse LLM JSON response', { content, error: parseErr.message });
    return null;
  }
}
