// js/dexService.js - Dexscreener Data Integration

class DexService {
  constructor() {
    this.baseURL = 'https://api.dexscreener.com/latest/dex';
    this.cache = new Map(); // Cache for responses
    this.cacheExpiry = 30000; // 30 seconds cache
  }

  // Fetch token data from Dexscreener
  async fetchDexData(tokenMint) {
    // Check cache first
    const cached = this.cache.get(tokenMint);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseURL}/tokens/${tokenMint}`);
      const data = await response.json();

      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0]; // Get first pair
        const result = {
          price: parseFloat(pair.priceUsd) || 0,
          volume24h: parseFloat(pair.volume?.h24) || 0,
          liquidity: parseFloat(pair.liquidity?.usd) || 0,
          marketCap: parseFloat(pair.marketCap) || (parseFloat(pair.priceUsd) * parseFloat(pair.fdv)) || 0,
          priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
          dexId: pair.dexId,
          pairAddress: pair.pairAddress,
          baseToken: pair.baseToken,
          quoteToken: pair.quoteToken
        };

        // Cache the result
        this.cache.set(tokenMint, {
          data: result,
          timestamp: Date.now()
        });

        // Update global token state
        if (window.tokenStateManager) {
          window.tokenStateManager.updateTokenState(tokenMint, result);
        }

        return result;
      }
    } catch (error) {
      console.error('Dexscreener API error:', error);
    }

    return null;
  }

  // Get trending tokens from Dexscreener
  async getTrendingTokens() {
    try {
      const response = await fetch(`${this.baseURL}/search?q=solana`);
      const data = await response.json();

      const trending = data.pairs
        .filter(pair => pair.chainId === 'solana')
        .sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
        .slice(0, 20);

      return trending;
    } catch (error) {
      console.error('Dexscreener trending error:', error);
    }
    return [];
  }

  // Search tokens
  async searchTokens(query) {
    try {
      const response = await fetch(`${this.baseURL}/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.pairs || [];
    } catch (error) {
      console.error('Dexscreener search error:', error);
    }
    return [];
  }

  // Clear cache for specific token
  clearCache(tokenMint) {
    this.cache.delete(tokenMint);
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
  }
}

// Global instance
window.dexService = new DexService();

// Export
window.DexService = DexService;