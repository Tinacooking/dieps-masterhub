import React, { useMemo, useState, useEffect } from 'react';
import { TOKEN_LOGOS, TOKEN_ADDRESSES } from '../constants';

interface TokenLogoProps {
  symbol: string;
  className?: string;
}

const logoCache: Record<string, string | null> = {};
const pendingRequests: Record<string, Promise<string | null>> = {};

export function TokenLogo({ symbol: inputSymbol, className = "w-8 h-8" }: TokenLogoProps) {
  // If input is an address (e.g., 0x2::sui::SUI), extract the symbol. Otherwise, it's just the symbol.
  const isAddress = inputSymbol.startsWith("0x") && inputSymbol.includes("::");
  const symbol = isAddress ? inputSymbol.split("::")[2] : inputSymbol;
  
  // Use input address if provided, otherwise look it up
  const knownAddress = isAddress ? inputSymbol : TOKEN_ADDRESSES[symbol?.toUpperCase()];

  const [logoUrl, setLogoUrl] = useState<string | null>(TOKEN_LOGOS[symbol] || logoCache[symbol] || null);
  const [imageError, setImageError] = useState(false);
  const [triedDexscreener, setTriedDexscreener] = useState(false);

  useEffect(() => {
    setImageError(false);
    setTriedDexscreener(false);
    
    // If it's cached from Dexscreener, use it
    if (logoCache[symbol]) {
      setLogoUrl(logoCache[symbol]);
      return;
    }

    // Otherwise use default TOKEN_LOGOS
    if (TOKEN_LOGOS[symbol]) {
      setLogoUrl(TOKEN_LOGOS[symbol]);
    } else {
      // If we don't have it, fetch from Dexscreener immediately
      fetchFromDexscreener();
    }
  }, [symbol]);

  const fetchFromDexscreener = async () => {
    setTriedDexscreener(true);
    let isMounted = true;
    
    try {
      if (!pendingRequests[symbol]) {
        // SUI token addresses don't work directly in DexScreener search query, so search by symbol
        pendingRequests[symbol] = fetch(`https://api.dexscreener.com/latest/dex/search?q=${symbol}`)
          .then(r => r.json())
          .then(data => {
            if (data && data.pairs && data.pairs.length > 0) {
              const pair = data.pairs.find((p: any) => {
                if (p.chainId !== "sui") return false;
                
                // If we have a hardcoded address or inputted address, enforce strict match
                if (knownAddress) {
                    return p.baseToken.address === knownAddress || p.quoteToken.address === knownAddress;
                }
                
                // Otherwise fall back to strict symbol match
                return p.baseToken.symbol.toUpperCase() === symbol.toUpperCase() || 
                       p.quoteToken.symbol.toUpperCase() === symbol.toUpperCase();
              });
              if (pair && pair.info && pair.info.imageUrl) {
                 return pair.info.imageUrl;
              }
            }
            return null;
          })
          .catch(() => null);
      }
      
      const url = await pendingRequests[symbol];
      if (url) {
        logoCache[symbol] = url;
        if (isMounted) {
          setImageError(false);
          setLogoUrl(url);
        }
      } else {
        if (isMounted) {
          logoCache[symbol] = null;
          setImageError(true);
        }
      }
    } catch (err) {
      if (isMounted) setImageError(true);
    }
    
    return () => { isMounted = false; };
  };

  const handleImageError = () => {
    // If image fails and we haven't tried DexScreener yet (e.g. coingecko link failed), try it now
    if (!triedDexscreener) {
      fetchFromDexscreener();
    } else {
      // If it fails again, fallback to gradient
      setImageError(true);
    }
  };

  const gradientStyle = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash) % 360;
    const hue2 = (hue1 + 40) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 80%, 40%))`
    };
  }, [symbol]);

  if (logoUrl && !imageError) {
    return (
      <img 
        src={logoUrl} 
        alt={symbol} 
        className={`object-contain ${className} rounded-full`} 
        onError={handleImageError}
      />
    );
  }

  // Fallback avatar
  return (
    <div 
      className={`flex items-center justify-center rounded-full text-white font-display font-medium shadow-inner ${className}`}
      style={gradientStyle}
    >
      <span className="opacity-90" style={{ fontSize: '45%' }}>
        {symbol.slice(0, 3)}
      </span>
    </div>
  );
}
