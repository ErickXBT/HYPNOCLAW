// anti-bot.js - Anti Sniper Bot System for HYPNOCLAW

class AntiBotSystem {
  constructor() {
    this.MAX_BUY_PER_WALLET = 0.5; // SOL
    this.TRADE_COOLDOWN = 10000; // 10 seconds
    this.FIRST_TRADE_DELAY = 5000; // 5 seconds

    this.walletTrades = new Map(); // wallet -> {lastTrade: timestamp, totalBought: amount}
    this.tokenLaunchTimes = new Map(); // tokenMint -> launchTimestamp
  }

  // Check if wallet can buy
  canBuy(wallet, tokenMint, solAmount) {
    const now = Date.now();
    const walletData = this.walletTrades.get(wallet) || { lastTrade: 0, totalBought: 0 };

    // Check max buy per wallet
    if (walletData.totalBought + solAmount > this.MAX_BUY_PER_WALLET) {
      return { allowed: false, reason: `Max buy limit: ${this.MAX_BUY_PER_WALLET} SOL per wallet` };
    }

    // Check trade cooldown
    if (now - walletData.lastTrade < this.TRADE_COOLDOWN) {
      const remaining = Math.ceil((this.TRADE_COOLDOWN - (now - walletData.lastTrade)) / 1000);
      return { allowed: false, reason: `Trade cooldown: ${remaining}s remaining` };
    }

    // Check first trade delay
    const launchTime = this.tokenLaunchTimes.get(tokenMint);
    if (launchTime && now - launchTime < this.FIRST_TRADE_DELAY) {
      const remaining = Math.ceil((this.FIRST_TRADE_DELAY - (now - launchTime)) / 1000);
      return { allowed: false, reason: `First trade delay: ${remaining}s remaining` };
    }

    return { allowed: true };
  }

  // Check if wallet can sell
  canSell(wallet, tokenMint, tokenAmount) {
    const now = Date.now();
    const walletData = this.walletTrades.get(wallet) || { lastTrade: 0, totalBought: 0 };

    // Check trade cooldown
    if (now - walletData.lastTrade < this.TRADE_COOLDOWN) {
      const remaining = Math.ceil((this.TRADE_COOLDOWN - (now - walletData.lastTrade)) / 1000);
      return { allowed: false, reason: `Trade cooldown: ${remaining}s remaining` };
    }

    return { allowed: true };
  }

  // Record a trade
  recordTrade(wallet, tokenMint, solAmount, isBuy) {
    const walletData = this.walletTrades.get(wallet) || { lastTrade: 0, totalBought: 0 };

    walletData.lastTrade = Date.now();
    if (isBuy) {
      walletData.totalBought += solAmount;
    }

    this.walletTrades.set(wallet, walletData);
  }

  // Record token launch
  recordLaunch(tokenMint) {
    this.tokenLaunchTimes.set(tokenMint, Date.now());
  }

  // Get wallet stats
  getWalletStats(wallet) {
    return this.walletTrades.get(wallet) || { lastTrade: 0, totalBought: 0 };
  }
}

// Export
window.AntiBotSystem = AntiBotSystem;