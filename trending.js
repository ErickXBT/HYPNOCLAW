// trending.js - Trending Tokens Discovery System

class TrendingSystem {
  constructor() {
    this.dexService = window.globalDexService || new DexService();
    this.autoRefreshInterval = null;
  }

  // Get trending tokens using ranking algorithm
  async getTrending() {
    // Get tokens from global state manager
    if (window.globalTokenStateManager) {
      return window.globalTokenStateManager.getTrendingTokens(10);
    }

    // Fallback to Dexscreener
    const dexTrending = await this.dexService.getTrendingTokens();
    return dexTrending.slice(0, 10);
  }

  // Get new launches
  getNewLaunches() {
    if (!window.globalTokenStateManager) return [];

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return window.globalTokenStateManager.getAllStates()
      .filter(state => state.lastUpdate > oneDayAgo)
      .sort((a, b) => b.lastUpdate - a.lastUpdate)
      .slice(0, 10);
  }

  // Get top volume
  getTopVolume() {
    if (!window.globalTokenStateManager) return [];

    return window.globalTokenStateManager.getAllStates()
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 10);
  }

  // Get top market cap
  getTopMarketCap() {
    if (!window.globalTokenStateManager) return [];

    return window.globalTokenStateManager.getAllStates()
      .filter(state => state.marketCap)
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 10);
  }

  // Render trending UI
  async renderTrending(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const trending = await this.getTrending();
    const newLaunches = this.getNewLaunches();
    const topVolume = this.getTopVolume();
    const topMC = this.getTopMarketCap();

    container.innerHTML = `
      <div class="trending-section">
        <h3>🔥 Trending</h3>
        <div class="token-list">
          ${trending.map(token => this.renderTokenCard(token)).join('')}
        </div>
      </div>

      <div class="trending-section">
        <h3>🆕 New Launches</h3>
        <div class="token-list">
          ${newLaunches.map(token => this.renderTokenCard(token)).join('')}
        </div>
      </div>

      <div class="trending-section">
        <h3>📈 Top Volume</h3>
        <div class="token-list">
          ${topVolume.map(token => this.renderTokenCard(token)).join('')}
        </div>
      </div>

      <div class="trending-section">
        <h3>💎 Top Market Cap</h3>
        <div class="token-list">
          ${topMC.map(token => this.renderTokenCard(token)).join('')}
        </div>
      </div>
    `;
  }

  renderTokenCard(token) {
    const name = token.name || 'Unknown Token';
    const symbol = token.symbol || 'TOKEN';
    const price = token.price ? `$${token.price.toFixed(6)}` : 'N/A';
    const mc = token.marketCap ? `$${token.marketCap.toLocaleString()}` : 'N/A';
    const vol = token.volume ? `$${token.volume.toLocaleString()}` : 'N/A';
    const mint = token.mint || token.tokenMint;

    return `
      <div class="token-card" onclick="goToToken('${mint}')">
        <div class="token-header">
          <span class="token-name">${name}</span>
          <span class="token-symbol">$${symbol}</span>
        </div>
        <div class="token-stats">
          <span>Price: ${price}</span>
          <span>MC: ${mc}</span>
          <span>Vol: ${vol}</span>
        </div>
      </div>
    `;
  }

  // Start auto refresh
  startAutoRefresh(containerId) {
    this.stopAutoRefresh(); // Stop any existing
    this.autoRefreshInterval = setInterval(() => {
      this.renderTrending(containerId);
    }, 5000); // Refresh every 5 seconds
  }

  // Stop auto refresh
  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
}

// Export
window.TrendingSystem = TrendingSystem;