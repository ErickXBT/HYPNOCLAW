// systems/registry.js - Persistent token registry (localStorage)

class TokenRegistry {
  constructor() {
    this.tokens = new Map();
    this.loadTokens();
  }

  addToken(tokenData) {
    if (!tokenData || !tokenData.mint) return;
    this.tokens.set(tokenData.mint, tokenData);
    localStorage.setItem('hypnoclaw_tokens', JSON.stringify([...this.tokens]));
  }

  loadTokens() {
    const stored = localStorage.getItem('hypnoclaw_tokens');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      parsed.forEach(([mint, data]) => {
        this.tokens.set(mint, data);
      });
    } catch (error) {
      console.warn('Failed to load token registry:', error);
    }
  }

  getAllTokens() {
    return [...this.tokens.values()];
  }

  getToken(mint) {
    return this.tokens.get(mint);
  }
}

window.tokenRegistry = new TokenRegistry();
window.TokenRegistry = TokenRegistry;
