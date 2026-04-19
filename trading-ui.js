// trading-ui.js - Trading Interface for Token Pages

class TradingUI {
  constructor(tokenMint) {
    this.tokenMint = tokenMint;
  }

  // Render trading interface
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = globalBondingCurve.getState();

    container.innerHTML = `
      <div class="trading-ui">
        <div class="token-info">
          <h2 id="tokenName">Loading...</h2>
          <div class="analytics-cards">
            <div class="analytics-card">
              <div class="card-title">Price</div>
              <div class="card-value" id="analyticsPrice">$${state.currentPrice.toFixed(6)}</div>
            </div>
            <div class="analytics-card">
              <div class="card-title">Market Cap</div>
              <div class="card-value" id="analyticsMarketCap">$${state.marketCap.toLocaleString()}</div>
            </div>
            <div class="analytics-card">
              <div class="card-title">Liquidity</div>
              <div class="card-value" id="analyticsLiquidity">$${state.solLiquidity.toFixed(4)}</div>
            </div>
            <div class="analytics-card">
              <div class="card-title">Volume</div>
              <div class="card-value" id="analyticsVolume">$0</div>
            </div>
          </div>
        </div>

        <div class="trading-panel">
          <div class="trade-section">
            <h3>Buy Tokens</h3>
            <input type="number" id="buyAmount" placeholder="SOL amount" min="0.01" step="0.01">
            <button id="buyBtn" onclick="executeBuy()">BUY</button>
            <div id="buyEstimate">Est. tokens: 0</div>
            <div id="slippage">Slippage: 0%</div>
          </div>

          <div class="trade-section">
            <h3>Sell Tokens</h3>
            <input type="number" id="sellAmount" placeholder="Token amount" min="1" step="1">
            <button id="sellBtn" onclick="executeSell()">SELL</button>
            <div id="sellEstimate">Est. SOL: 0</div>
          </div>
        </div>

        <div class="trade-history">
          <h3>Recent Trades</h3>
          <div id="tradeHistoryTable" class="trade-history-table">Loading trades...</div>
        </div>

        <div class="dex-chart">
          <iframe id="dexChart" src="https://dexscreener.com/solana/${this.tokenMint}?embed=1&theme=dark" width="100%" height="450" frameborder="0"></iframe>
        </div>
      </div>
    `;

    this.loadTokenData();
    this.setupEventListeners();
    this.loadTradeHistory();

    // Auto-refresh recent trades every 5 seconds
    if (this.tradeHistoryInterval) {
      clearInterval(this.tradeHistoryInterval);
    }
    this.tradeHistoryInterval = setInterval(() => {
      this.loadTradeHistory();
    }, 5000);

    // Auto-refresh market analytics every 10 seconds
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
    }
    this.marketDataInterval = setInterval(() => {
      this.loadTokenData();
      this.reloadDexChart();
    }, 10000);
  }

  async loadTokenData() {
    try {
      // Load from Dexscreener using global dexService
      const dexData = await globalDexService.getTokenData(this.tokenMint);
      if (dexData) {
        document.getElementById('analyticsPrice').textContent = `$${dexData.price?.toFixed(6) || 'N/A'}`;
        document.getElementById('analyticsMarketCap').textContent = `$${dexData.marketCap?.toLocaleString() || 'N/A'}`;
        document.getElementById('analyticsLiquidity').textContent = `$${dexData.liquidity?.toLocaleString() || '0'}`;
        document.getElementById('analyticsVolume').textContent = `$${dexData.volume24h?.toLocaleString() || '0'}`;
        document.getElementById('tokenName').textContent = dexData.name || 'Unknown Token';
      } else {
        // Fallback to bonding curve data
        const state = globalBondingCurve.getState();
        document.getElementById('analyticsPrice').textContent = `$${state.currentPrice.toFixed(6)}`;
        document.getElementById('analyticsMarketCap').textContent = `$${state.marketCap.toLocaleString()}`;
        document.getElementById('analyticsLiquidity').textContent = `$${state.solLiquidity.toFixed(4)}`;
        document.getElementById('analyticsVolume').textContent = '—';
        document.getElementById('tokenName').textContent = 'Token Name';
      }
    } catch (error) {
      console.error('Error loading token data:', error);
      // Fallback to bonding curve data
      const state = globalBondingCurve.getState();
      document.getElementById('analyticsPrice').textContent = `$${state.currentPrice.toFixed(6)}`;
      document.getElementById('analyticsMarketCap').textContent = `$${state.marketCap.toLocaleString()}`;
      document.getElementById('analyticsLiquidity').textContent = `$${state.solLiquidity.toFixed(4)}`;
      document.getElementById('analyticsVolume').textContent = '—';
      document.getElementById('tokenName').textContent = 'Token Name';
    }
  }

  setupEventListeners() {
    const buyInput = document.getElementById('buyAmount');
    const sellInput = document.getElementById('sellAmount');

    buyInput.addEventListener('input', () => {
      const sol = parseFloat(buyInput.value) || 0;
      const currentPrice = globalBondingCurve.calculatePrice();
      const tokens = sol / currentPrice;
      const newPrice = globalBondingCurve.calculatePrice(globalBondingCurve.tokensSold + tokens);
      const slippage = currentPrice ? ((newPrice - currentPrice) / currentPrice) * 100 : 0;

      document.getElementById('buyEstimate').textContent = `Est. tokens: ${tokens.toFixed(0)}`;
      document.getElementById('slippage').textContent = `Slippage: ${slippage.toFixed(2)}%`;
    });

    sellInput.addEventListener('input', () => {
      const tokens = parseFloat(sellInput.value) || 0;
      const currentPrice = globalBondingCurve.calculatePrice();
      const sol = globalBondingCurve.calculateSellPrice(tokens);
      const newPrice = globalBondingCurve.calculatePrice(globalBondingCurve.tokensSold - tokens);
      const slippage = currentPrice ? ((currentPrice - newPrice) / currentPrice) * 100 : 0;

      document.getElementById('sellEstimate').textContent = `Est. SOL: ${sol.toFixed(4)}`;
      document.getElementById('slippage').textContent = `Slippage: ${slippage.toFixed(2)}%`;
    });
  }

  async executeBuy() {
    const solAmount = parseFloat(document.getElementById('buyAmount').value);
    if (!solAmount || solAmount <= 0) return;

    try {
      const result = await globalTradingEngine.executeBuy(this.tokenMint, solAmount, walletPK);
      toast('success', 'Buy Successful', `Received ${result.tokensReceived} tokens`);
      this.updateUI();
      this.addTradeHistory('buy', solAmount, result.tokensReceived);
    } catch (error) {
      toast('error', 'Buy Failed', error.message);
    }
  }

  async executeSell() {
    const tokenAmount = parseFloat(document.getElementById('sellAmount').value);
    if (!tokenAmount || tokenAmount <= 0) return;

    try {
      const result = await globalTradingEngine.executeSell(this.tokenMint, tokenAmount, walletPK);
      toast('success', 'Sell Successful', `Received ${result.solReceived.toFixed(4)} SOL`);
      this.updateUI();
      this.addTradeHistory('sell', tokenAmount, result.solReceived);
    } catch (error) {
      toast('error', 'Sell Failed', error.message);
    }
  }

  updateUI() {
    const state = globalBondingCurve.getState();
    document.getElementById('currentPrice').textContent = `$${state.currentPrice.toFixed(6)}`;
    document.getElementById('marketCap').textContent = `$${state.marketCap.toLocaleString()}`;
    document.getElementById('solLiquidity').textContent = state.solLiquidity.toFixed(4);

    // Update Dex data if available
    this.loadTokenData();
    this.loadTradeHistory();
  }

  loadTradeHistory() {
    const container = document.getElementById('tradeHistoryTable');
    if (!container) return;

    if (!window.tradeLogger) {
      container.innerHTML = '<div class="empty-state">Trade history unavailable</div>';
      return;
    }

    const trades = (window.tradeLogger.getTrades(this.tokenMint) || []).slice();
    if (!trades.length) {
      container.innerHTML = '<div class="empty-state">No trades yet</div>';
      return;
    }

    // Newest first
    trades.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const rows = trades.map(t => {
      const date = new Date(t.timestamp || Date.now());
      const time = date.toLocaleTimeString();
      const price = t.price ? `$${t.price.toFixed(6)}` : '—';
      const amount = t.amount ? t.amount : '—';
      const wallet = t.wallet ? `${t.wallet.slice(0, 4)}...${t.wallet.slice(-4)}` : '—';
      const type = t.type ? t.type.toUpperCase() : '—';

      return `
        <tr>
          <td>${wallet}</td>
          <td>${type}</td>
          <td>${price}</td>
          <td>${amount}</td>
          <td>${time}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="token-table-scroll">
        <table class="token-table">
          <thead>
            <tr>
              <th>Wallet</th>
              <th>Type</th>
              <th>Price</th>
              <th>Amount</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  reloadDexChart() {
    const frame = document.getElementById('dexChart');
    if (!frame) return;
    frame.src = `https://dexscreener.com/solana/${this.tokenMint}`;
  }

  addTradeHistory(type, amount, received) {
    // Keep existing list in sync
    this.loadTradeHistory();
  }
}

// Export
window.TradingUI = TradingUI;