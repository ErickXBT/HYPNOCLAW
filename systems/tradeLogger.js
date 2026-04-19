// systems/tradeLogger.js - Persistent trade logging (localStorage)

class TradeLogger {
  constructor() {
    this.trades = [];
    this.loadTrades();
  }

  loadTrades() {
    const stored = localStorage.getItem('hypnoclaw_trades');
    if (!stored) return;
    try {
      this.trades = JSON.parse(stored) || [];
    } catch (error) {
      console.warn('Failed to load trade logs:', error);
      this.trades = [];
    }
  }

  saveTrades() {
    localStorage.setItem('hypnoclaw_trades', JSON.stringify(this.trades));
  }

  logTrade(trade) {
    if (!trade || !trade.tokenMint) return;
    const record = {
      ...trade,
      timestamp: trade.timestamp || Date.now()
    };
    this.trades.push(record);
    this.saveTrades();
  }

  getTrades(tokenMint) {
    if (!tokenMint) return [...this.trades];
    return this.trades.filter(t => t.tokenMint === tokenMint);
  }
}

window.tradeLogger = new TradeLogger();
window.TradeLogger = TradeLogger;
