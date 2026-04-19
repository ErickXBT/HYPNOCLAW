// pages.js - Page Routing and UI Management

class PageManager {
  constructor() {
    this.currentPage = 'home';
    this.pages = {
      home: 'page-home',
      launchpad: 'page-launchpad',
      trending: 'page-trending',
      tokens: 'page-tokens',
      token: 'page-token',
      trade: 'page-trade'
    };

    this.trendingSystem = new TrendingSystem();
    this.bondingCurves = new Map(); // tokenMint -> BondingCurve instance
    this.tradingUIs = new Map();

    this.init();
  }

  init() {
    // Setup hash routing
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.substring(1);
    const [page, param] = hash.split('/');

    switch (page) {
      case 'trending':
        this.showPage('trending');
        this.renderTrending();
        break;
      case 'tokens':
        this.showPage('tokens');
        this.renderTokens();
        break;
      case 'token':
        this.showPage('token');
        this.renderTokenPage(param);
        break;
      case 'trade':
        this.showPage('trade');
        this.renderTradePage();
        break;
      case 'launch':
        this.showPage('launchpad');
        break;
      default:
        this.showPage('home');
        this.renderHomeMarketplace();
        break;
    }
  }

  showPage(pageKey) {
    // Hide all pages
    Object.values(this.pages).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    // Show target page
    const targetId = this.pages[pageKey];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.classList.remove('hidden');
        el.classList.add('slide-in');
        setTimeout(() => el.classList.remove('slide-in'), 600);
      }
    }

    this.currentPage = pageKey;
  }

  renderTrending() {
    this.trendingSystem.renderTrending('trending-container');
    this.trendingSystem.startAutoRefresh('trending-container');
  }

  renderTokenPage(tokenMint) {
    if (!tokenMint) return;

    // Ensure bonding curve exists for this token via trading engine
    const bondingCurve = window.globalTradingEngine.getBondingCurve(tokenMint);
    window.globalBondingCurve = bondingCurve;

    // Ensure token state exists
    if (window.globalTokenStateManager) {
      window.globalTokenStateManager.getTokenState(tokenMint);
    }

    // Create trading UI (uses global trading engine / token state)
    const tradingUI = new TradingUI(tokenMint);
    tradingUI.render('token-trading-container');
    this.tradingUIs.set(tokenMint, tradingUI);
  }

  renderTokens() {
    const container = document.getElementById('tokens-container');
    if (!container) return;

    const tokens = window.globalTokenRegistry ? window.globalTokenRegistry.getAllTokens() : [];

    if (!tokens.length) {
      container.innerHTML = `
        <div class="token-table-wrap">
          <div class="empty-state">No tokens deployed yet. Deploy one on the Launchpad.</div>
        </div>
      `;
      return;
    }

    const rows = tokens.map(token => {
      const state = window.globalTokenStateManager ? window.globalTokenStateManager.getTokenState(token.mint) : null;
      const price = state?.price ? `$${state.price.toFixed(6)}` : '—';
      const marketCap = state?.marketCap ? `$${Number(state.marketCap).toLocaleString()}` : '—';
      const volume = state?.volume ? `$${Number(state.volume).toLocaleString()}` : '—';
      const launchTime = token.launchedAt ? new Date(token.launchedAt).toLocaleString() : '—';

      return `
        <tr>
          <td>${token.name || 'Unknown'}</td>
          <td>${token.symbol || '—'}</td>
          <td>${price}</td>
          <td>${marketCap}</td>
          <td>${volume}</td>
          <td>${launchTime}</td>
          <td><button class="btn-small" onclick="goToToken('${token.mint}')">Trade</button></td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="token-table-wrap">
        <h2 class="section-title" style="margin-bottom:16px;">Token Registry</h2>
        <div class="token-table-scroll">
          <table class="token-table">
            <thead>
              <tr>
                <th>Token Name</th>
                <th>Symbol</th>
                <th>Price</th>
                <th>Market Cap</th>
                <th>Volume</th>
                <th>Launch Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Prime Dex data for improved accuracy
    tokens.forEach(async token => {
      if (window.globalDexService) {
        await window.globalDexService.fetchDexData(token.mint);
      }
    });
  }

  renderHomeMarketplace() {
    this.renderTrendingTokens();
    this.renderNewLaunches();
    this.renderTopVolume();
    this.renderTopLiquidity();

    // Set up auto-refresh every 10 seconds
    if (this.marketplaceRefreshInterval) {
      clearInterval(this.marketplaceRefreshInterval);
    }
    this.marketplaceRefreshInterval = setInterval(() => {
      this.renderHomeMarketplace();
    }, 10000);
  }

  renderTrendingTokens() {
    const container = document.getElementById('trending-tokens');
    if (!container) return;

    const tokens = window.globalTokenStateManager ? window.globalTokenStateManager.getTrendingTokens(8) : [];

    if (!tokens.length) {
      container.innerHTML = '<div class="empty-state">No trending tokens yet.</div>';
      return;
    }

    const cards = tokens.map(token => {
      const registryData = window.globalTokenRegistry ? window.globalTokenRegistry.getToken(token.mint) : {};
      return this.createTokenCard({ ...registryData, ...token });
    }).join('');
    container.innerHTML = cards;
  }

  renderNewLaunches() {
    const container = document.getElementById('new-launches');
    if (!container) return;

    const tokens = window.globalTokenRegistry ? window.globalTokenRegistry.getAllTokens()
      .sort((a, b) => new Date(b.launchedAt || 0) - new Date(a.launchedAt || 0))
      .slice(0, 8) : [];

    if (!tokens.length) {
      container.innerHTML = '<div class="empty-state">No new launches yet.</div>';
      return;
    }

    const cards = tokens.map(token => {
      const state = window.globalTokenStateManager ? window.globalTokenStateManager.getTokenState(token.mint) : {};
      return this.createTokenCard({ ...token, ...state });
    }).join('');
    container.innerHTML = cards;
  }

  renderTopVolume() {
    const container = document.getElementById('top-volume');
    if (!container) return;

    const tokens = window.globalTokenStateManager ? window.globalTokenStateManager.getAllStates()
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 8) : [];

    if (!tokens.length) {
      container.innerHTML = '<div class="empty-state">No volume data yet.</div>';
      return;
    }

    const cards = tokens.map(token => {
      const registryData = window.globalTokenRegistry ? window.globalTokenRegistry.getToken(token.mint) : {};
      return this.createTokenCard({ ...registryData, ...token });
    }).join('');
    container.innerHTML = cards;
  }

  renderTopLiquidity() {
    const container = document.getElementById('top-liquidity');
    if (!container) return;

    const tokens = window.globalTokenStateManager ? window.globalTokenStateManager.getAllStates()
      .sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
      .slice(0, 8) : [];

    if (!tokens.length) {
      container.innerHTML = '<div class="empty-state">No liquidity data yet.</div>';
      return;
    }

    const cards = tokens.map(token => {
      const registryData = window.globalTokenRegistry ? window.globalTokenRegistry.getToken(token.mint) : {};
      return this.createTokenCard({ ...registryData, ...token });
    }).join('');
    container.innerHTML = cards;
  }

  createTokenCard(token) {
    const name = token.name || 'Unknown Token';
    const symbol = token.symbol || '—';
    const price = token.price ? `$${token.price.toFixed(6)}` : '—';
    const marketCap = token.marketCap ? `$${Number(token.marketCap).toLocaleString()}` : '—';
    const volume = token.volume ? `$${Number(token.volume).toLocaleString()}` : '—';
    const mint = token.mint || '';

    return `
      <div class="token-card" onclick="goToToken('${mint}')">
        <div class="token-name">${name} (${symbol})</div>
        <div class="token-price">${price}</div>
        <div class="token-stats">
          MC: ${marketCap} | Vol: ${volume}
        </div>
        <button class="token-trade-btn" onclick="event.stopPropagation(); goToToken('${mint}')">Trade</button>
      </div>
    `;
  }

  renderTradePage() {
    // Similar to token page but for general trading
    // Implementation depends on specific requirements
  }

  // Navigation helpers
  goToTrending() {
    window.location.hash = 'trending';
  }

  goToTokens() {
    window.location.hash = 'tokens';
  }

  goToToken(tokenMint) {
    window.location.hash = `token/${tokenMint}`;
  }

  goToTrade() {
    window.location.hash = 'trade';
  }

  goToLaunch() {
    window.location.hash = 'launch';
  }
}

// Global functions for onclick handlers
function goToTrending() {
  window.pageManager.goToTrending();
}

function goToTokens() {
  window.pageManager.goToTokens();
}

function goToToken(tokenMint) {
  window.pageManager.goToToken(tokenMint);
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.pageManager = new PageManager();
});

// Export
window.PageManager = PageManager;