import nlp from "compromise";
import Fuse from "fuse.js";

// A small dictionary of common tokens (In production, this could be populated from a DB or file)
// Since we only need to map symbols to basic inputs for the graph.
const KNOWN_TOKENS = [
    { symbol: "SUI", name: "sui", address: "0x2::sui::SUI" },
    { symbol: "USDC", name: "usd coin", address: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC" },
    { symbol: "USDT", name: "tether", address: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN" },
    { symbol: "CETUS", name: "cetus", address: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS" },
    { symbol: "KRIYA", name: "kriya", address: "0xa0eba10b173538c8fecca1dff298e488402cc9ff374f8a12ca7758eebe830b66::spot_dex::KRIYA" },
];

// Setup fuzzy search for token resolution to handle typos like "swi" -> "SUI"
const fuse = new Fuse(KNOWN_TOKENS, {
    keys: ["symbol", "name"],
    threshold: 0.3, // strict enough to not match garbage
});

export async function resolveToken(input: string): Promise<{symbol: string, address: string} | null> {
    const inputClean = input.trim().toLowerCase();
    
    // First, try exact symbol match
    const exact = KNOWN_TOKENS.find(t => t.symbol.toLowerCase() === inputClean);
    if (exact) return { symbol: exact.symbol, address: exact.address };

    // Then, try fuzzy search
    const results = fuse.search(inputClean);
    if (results.length > 0) {
        return { symbol: results[0].item.symbol, address: results[0].item.address };
    }

    // Dynamic resolution fallback (DexScreener API) could be called here if needed
    // But for fast static NLP parsing, we can return the raw input and let the Routing layer handle it.
    return { symbol: input.toUpperCase(), address: input }; 
}

export async function parseIntent(prompt: string) {
    // We use compromise.js to process the text
    const doc = nlp(prompt);
    
    // Normalize and prepare
    doc.compute('root');
    
    // Extremely fast regex-based extractor as primary fallback for numbers and basic structure
    const regex = /(?:swap|exchange|convert|trade|sell|buy)\s+([\d.,]+)\s+([a-zA-Z0-9_-]+)\s+(?:to|for|into)\s+([a-zA-Z0-9_-]+)/i;
    const match = prompt.match(regex);
    
    if (match) {
        const amount = match[1].replace(/,/g, '');
        const source_token_raw = match[2];
        const dest_token_raw = match[3];

        const sourceToken = await resolveToken(source_token_raw);
        const destToken = await resolveToken(dest_token_raw);

        // Determine priority mode from constraint analysis using NLP
        let priority_mode = "SAFE";
        if (doc.has('safest') || doc.has('safe') || doc.has('secure')) priority_mode = "SAFE";
        if (doc.has('fast') || doc.has('quick') || doc.has('instant')) priority_mode = "FAST";
        if (doc.has('max') || doc.has('maximum') || doc.has('best rate')) priority_mode = "MAX_OUTPUT";

        return {
            intent: {
                action_type: "SWAP",
                trade_amount: amount,
                source_token_symbol: sourceToken?.symbol || source_token_raw.toUpperCase(),
                source_token_address: sourceToken?.address || source_token_raw,
                destination_token_symbol: destToken?.symbol || dest_token_raw.toUpperCase(),
                destination_token_address: destToken?.address || dest_token_raw,
                priority_mode: priority_mode,
                user_constraints: [],
            },
            confidence_score: 0.98, // Fast regex matched -> High confidence
            validation_status: "VALID"
        };
    }

    // Advanced NLP parsing if regex fails
    const numbers = doc.numbers().out('array');
    const nouns = doc.nouns().out('array');
    
    if (numbers.length > 0 && nouns.length >= 2) {
         return {
             error: "Unstructured intent detected. Please use format: Swap [Amount] [TokenA] to [TokenB]",
             validation_status: "INVALID_FORMAT",
             details: { extracted_numbers: numbers, extracted_nouns: nouns }
         };
    }

    return { error: "Invalid intent format", validation_status: "INVALID_FORMAT" };
}
