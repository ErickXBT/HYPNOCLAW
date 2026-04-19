// dexscreener.js - Dexscreener Integration

class DexscreenerAPI {
  constructor() {
    this.baseURL = 'https://api.dexscreener.com/latest/dex';
  }

  // Get token data
  async getTokenData(tokenAddress) {
    try {
      const response = await fetch(`${this.baseURL}/tokens/${tokenAddress}`);
      const data = await response.json();

      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0]; // Get first pair
        return {
          price: pair.priceUsd,
          volume24h: pair.volume.h24,
          liquidity: pair.liquidity.usd,
          marketCap: pair.marketCap || (pair.priceUsd * pair.fdv),
          priceChange24h: pair.priceChange.h24,
          dexId: pair.dexId,
          pairAddress: pair.pairAddress,
          baseToken: pair.baseToken,
          quoteToken: pair.quoteToken
        };
      }
    } catch (error) {
      console.error('Dexscreener API error:', error);
    }
    return null;
  }

  // Get trending tokens
  async getTrendingTokens() {
    try {
      const response = await fetch(`${this.baseURL}/search?q=solana`);
      const data = await response.json();

      return data.pairs
        .filter(pair => pair.chainId === 'solana')
        .sort((a, b) => (b.volume.h24 || 0) - (a.volume.h24 || 0))
        .slice(0, 20);
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
}

// Export
window.DexscreenerAPI = DexscreenerAPI;