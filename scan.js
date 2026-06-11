import fs from 'fs';
import readline from 'readline';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });

async function scan() {
    const fileStream = fs.createReadStream('pool_related_ids.txt');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let chunk = [];
    let found = [];
    
    for await (const line of rl) {
        if (line.trim()) chunk.push(line.trim());
        
        if (chunk.length >= 50) {
            console.log("Fetching chunk...");
            try {
                const res = await suiClient.multiGetObjects({
                    ids: chunk,
                    options: { showType: true, showContent: true }
                });
                
                for (const obj of res) {
                    if (obj.data && obj.data.type) {
                        const typeStr = obj.data.type.toLowerCase();
                        if (typeStr.includes('cetus') || typeStr.includes('turbos') || typeStr.includes('kriya')) {
                            // Check if it has SUI and USDC
                            if (typeStr.includes('sui') && typeStr.includes('usdc')) {
                                console.log("Found SUI-USDC pool:", obj.data.objectId);
                                found.push(obj.data.objectId);
                            }
                            // Check if it has SUI and CETUS
                            if (typeStr.includes('sui') && typeStr.includes('cetus')) {
                                console.log("Found SUI-CETUS pool:", obj.data.objectId);
                                found.push(obj.data.objectId);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
            chunk = [];
            
            if (found.length >= 5) {
                console.log("Found enough pools:", found);
                process.exit(0);
            }
        }
    }
}

scan();
