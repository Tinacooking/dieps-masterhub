/**
 * IntentParserService — NLP Intent Parser via OpenRouter
 *
 * Uses a free model endpoint (google/gemma-3-27b-it:free) to convert
 * plain-English user intents into structured JSON swap parameters.
 * Enforces SUI-only chain policy.
 */

import dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ParsedIntent {
  sourceTokenSymbol: string;
  targetTokenSymbol: string;
  amountIn: number;
  maxSlippage: number;
  unsupportedChain: boolean;
  rawResponse?: string;
}

export interface IntentParseResult {
  success: boolean;
  intent?: ParsedIntent;
  error?: string;
}

// ---------------------------------------------------------------------------
// Non-SUI chain/asset keywords for local validation fallback
// ---------------------------------------------------------------------------
const NON_SUI_KEYWORDS = [
  'ethereum', 'eth', 'solana', 'sol', 'bitcoin', 'btc', 'avalanche', 'avax',
  'polygon', 'matic', 'arbitrum', 'arb', 'optimism', 'op', 'bsc', 'bnb',
  'binance', 'cosmos', 'atom', 'cardano', 'ada', 'polkadot', 'dot',
  'fantom', 'ftm', 'tron', 'trx', 'near', 'aptos', 'apt',
  'erc20', 'erc-20', 'bep20', 'bep-20', 'spl', 'trc20',
  'metamask', 'phantom', 'uniswap', 'pancakeswap', 'sushiswap',
];

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------
export class IntentParserService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'google/gemma-4-31b-it:free';
  }

  // -----------------------------------------------------------------------
  // Local SUI-only chain check (fast pre-filter)
  // -----------------------------------------------------------------------
  private detectNonSuiChain(text: string): boolean {
    const lower = text.toLowerCase();
    return NON_SUI_KEYWORDS.some((kw) => {
      // Word-boundary check to avoid false positives
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(lower);
    });
  }

  // -----------------------------------------------------------------------
  // Parse intent via OpenRouter LLM
  // -----------------------------------------------------------------------
  async parseIntent(text: string): Promise<IntentParseResult> {
    // Fast local check first
    if (this.detectNonSuiChain(text)) {
      return {
        success: false,
        error: 'Error: This engine exclusively supports SUI Network transactions.',
        intent: {
          sourceTokenSymbol: '',
          targetTokenSymbol: '',
          amountIn: 0,
          maxSlippage: 0,
          unsupportedChain: true,
        },
      };
    }

    // If no API key, fall back to regex parsing
    if (!this.apiKey || this.apiKey === 'your_free_openrouter_key') {
      return this.regexFallback(text);
    }

    try {
      const systemPrompt = `You are a SUI blockchain swap intent parser. Extract swap parameters from user messages.

RULES:
1. You ONLY support tokens on the SUI blockchain (SUI, USDC, USDT, CETUS, DEEP, NAVX, TURBOS, MMT).
2. If the user mentions ANY non-SUI blockchain, token, or protocol (e.g., Ethereum, Solana, BSC, ERC20, Uniswap, etc.), set "unsupportedChain": true.
3. Extract the source token symbol, target token symbol, amount, and optional slippage.
4. Default slippage to 0.5% if not specified.
5. Output ONLY valid JSON, no markdown wrapping.

Output format:
{
  "sourceTokenSymbol": "SUI",
  "targetTokenSymbol": "USDC",
  "amountIn": 1000,
  "maxSlippage": 0.5,
  "unsupportedChain": false
}`;

      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
          ],
          temperature: 0.1,
          max_tokens: 256,
        }),
      });

      const data = (await res.json()) as any;

      if (data.error) {
        console.error('OpenRouter API error:', data.error);
        // Fall back to regex if LLM fails
        return this.regexFallback(text);
      }

      let rawText =
        data.choices?.[0]?.message?.content?.trim() ?? '';

      // Strip markdown code fences
      if (rawText.startsWith('```json')) rawText = rawText.slice(7);
      if (rawText.startsWith('```')) rawText = rawText.slice(3);
      if (rawText.endsWith('```')) rawText = rawText.slice(0, -3);
      rawText = rawText.trim();

      const parsed: ParsedIntent = JSON.parse(rawText);
      parsed.rawResponse = rawText;

      // Enforce SUI-only even if LLM misses it
      if (parsed.unsupportedChain) {
        return {
          success: false,
          error: 'Error: This engine exclusively supports SUI Network transactions.',
          intent: parsed,
        };
      }

      // Validate required fields
      if (
        !parsed.sourceTokenSymbol ||
        !parsed.targetTokenSymbol ||
        !parsed.amountIn ||
        parsed.amountIn <= 0
      ) {
        return this.regexFallback(text);
      }

      return { success: true, intent: parsed };
    } catch (err: any) {
      console.error('Intent parsing error, falling back to regex:', err.message);
      return this.regexFallback(text);
    }
  }

  // -----------------------------------------------------------------------
  // Regex fallback parser (works without API key)
  // -----------------------------------------------------------------------
  private regexFallback(text: string): IntentParseResult {
    // Match: "swap/exchange/convert 1000 SUI to/for/into USDC"
    const regex =
      /(?:swap|exchange|convert|trade|buy|sell)\s+([\d.,]+)\s+([a-zA-Z0-9_-]+)\s+(?:to|for|into|->)\s+([a-zA-Z0-9_-]+)/i;
    const match = text.match(regex);

    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const sourceSymbol = match[2].toUpperCase();
      const targetSymbol = match[3].toUpperCase();

      // Extract slippage if mentioned
      let slippage = 0.5; // default 0.5%
      const slippageMatch = text.match(
        /(?:slippage|slip)\s*(?:of|:)?\s*([\d.]+)\s*%?/i
      );
      if (slippageMatch) {
        slippage = parseFloat(slippageMatch[1]);
      }

      return {
        success: true,
        intent: {
          sourceTokenSymbol: sourceSymbol,
          targetTokenSymbol: targetSymbol,
          amountIn: parseFloat(amountStr),
          maxSlippage: slippage,
          unsupportedChain: false,
        },
      };
    }

    return {
      success: false,
      error:
        'Could not parse intent. Please use format: "Swap [amount] [SOURCE] to [TARGET]"',
    };
  }
}

export const intentParserService = new IntentParserService();
