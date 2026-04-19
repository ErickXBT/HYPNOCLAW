// js/tokenState.js - Global Token State Manager

class TokenState {
  constructor(mint) {
    this.mint = mint;
    this.creator = null;
    this.price = 0;
    this.marketCap = 0;
    this.liquidity = 0;
    this.volume = 0;
    this.holders = 0;
    this.tokensSold = 0;
    this.tradeCount = 0;
    this.dexListed = false;
    this.lastUpdate = Date.now();
  }

  // Update state with new data
  update(data) {
    Object.assign(this, data, { lastUpdate: Date.now() });
  }

  // Calculate trending score
  getTrendingScore() {
    return (
      (this.volume * 0.4) +
      (this.tokensSold * 0.3) + // Using tokensSold as proxy for trades
      (this.liquidity * 0.2) +
      (this.marketCap * 0.1)
    );
  }
}

// Global token states map
const tokenStates = new Map();

// TokenStateManager class
class TokenStateManager {
  constructor() {
    this.states = tokenStates;
  }

  // Get or create token state
  getTokenState(mint) {
    if (!this.states.has(mint)) {
      this.states.set(mint, new TokenState(mint));
    }
    return this.states.get(mint);
  }

  // Update token state
  updateTokenState(mint, data) {
    const state = this.getTokenState(mint);
    state.update(data);
  }

  // Get all token states
  getAllStates() {
    return Array.from(this.states.values());
  }

  // Get trending tokens
  getTrendingTokens(limit = 10) {
    return this.getAllStates()
      .sort((a, b) => b.getTrendingScore() - a.getTrendingScore())
      .slice(0, limit);
  }

  // Clean old states (optional)
  cleanOldStates(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    for (const [mint, state] of this.states) {
      if (now - state.lastUpdate > maxAge) {
        this.states.delete(mint);
      }
    }
  }
}

// Global instance
window.tokenStateManager = new TokenStateManager();

// Export
window.TokenState = TokenState;
window.TokenStateManager = TokenStateManager;