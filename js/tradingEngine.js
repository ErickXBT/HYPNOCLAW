// js/tradingEngine.js - Trading Engine Improvements

class TradingEngine {
  constructor() {
    this.bondingCurves = new Map(); // tokenMint -> BondingCurve
    this.feeSystem = window.feeSystem || new FeeSystem('creator-wallet-placeholder', PLATFORM_WALLET.toString());
    this.antiBot = window.antiBotSystem || new AntiBotSystem();
  }

  // Get or create bonding curve for token
  getBondingCurve(tokenMint) {
    if (!this.bondingCurves.has(tokenMint)) {
      this.bondingCurves.set(tokenMint, new BondingCurve(tokenMint));
    }
    return this.bondingCurves.get(tokenMint);
  }

  // Execute buy trade
  async executeBuy(tokenMint, solAmount, buyerWallet) {
    // Check anti-bot
    const canBuy = this.antiBot.canBuy(buyerWallet, tokenMint, solAmount);
    if (!canBuy.allowed) {
      throw new Error(canBuy.reason);
    }

    const bondingCurve = this.getBondingCurve(tokenMint);
    const tokensToReceive = Math.floor(solAmount / bondingCurve.calculatePrice());

    if (tokensToReceive <= 0) {
      throw new Error('SOL amount too small for trade');
    }

    // Execute trade
    const result = await bondingCurve.buyToken(tokensToReceive, buyerWallet);

    // Process fees
    const feeTx = await this.feeSystem.processFees(solAmount, true, window.connection, new solanaWeb3.PublicKey(buyerWallet));
    if (feeTx) {
      // Sign and send fee transaction
      const phantom = window.phantom?.solana || window.solana;
      const signedFeeTx = await phantom.signTransaction(feeTx);
      await window.connection.sendRawTransaction(signedFeeTx.serialize());
    }

    // Record trade
    this.antiBot.recordTrade(buyerWallet, tokenMint, solAmount, true);

    // Log trade for analytics
    if (window.tradeLogger) {
      window.tradeLogger.logTrade({
        tokenMint,
        type: 'buy',
        price: result.newPrice,
        amount: result.tokensReceived,
        wallet: buyerWallet,
        timestamp: Date.now()
      });
    }

    // Attempt Raydium auto-liquidity upgrade
    if (!window.raydiumLiquidity && window.RaydiumLiquidity) {
      window.raydiumLiquidity = new RaydiumLiquidity(window.connection, window.phantom?.solana || window.solana);
    }
    if (window.raydiumLiquidity) {
      await window.raydiumLiquidity.monitorAndGraduate(tokenMint, bondingCurve);
    }

    // Update UI immediately
    this.updateUI(tokenMint);

    return result;
  }

  // Execute sell trade
  async executeSell(tokenMint, tokenAmount, sellerWallet) {
    // Check anti-bot
    const canSell = this.antiBot.canSell(sellerWallet, tokenMint, tokenAmount);
    if (!canSell.allowed) {
      throw new Error(canSell.reason);
    }

    const bondingCurve = this.getBondingCurve(tokenMint);

    // Execute trade
    const result = await bondingCurve.sellToken(tokenAmount, sellerWallet);

    // Process fees
    const feeTx = await this.feeSystem.processFees(result.solReceived, false, window.connection, new solanaWeb3.PublicKey(sellerWallet));
    if (feeTx) {
      const phantom = window.phantom?.solana || window.solana;
      const signedFeeTx = await phantom.signTransaction(feeTx);
      await window.connection.sendRawTransaction(signedFeeTx.serialize());
    }

    // Record trade
    this.antiBot.recordTrade(sellerWallet, tokenMint, result.solReceived, false);

    // Log trade for analytics
    if (window.tradeLogger) {
      window.tradeLogger.logTrade({
        tokenMint,
        type: 'sell',
        price: result.newPrice,
        amount: result.solReceived,
        wallet: sellerWallet,
        timestamp: Date.now()
      });
    }

    // Attempt Raydium auto-liquidity upgrade
    if (!window.raydiumLiquidity && window.RaydiumLiquidity) {
      window.raydiumLiquidity = new RaydiumLiquidity(window.connection, window.phantom?.solana || window.solana);
    }
    if (window.raydiumLiquidity) {
      await window.raydiumLiquidity.monitorAndGraduate(tokenMint, bondingCurve);
    }

    // Update UI immediately
    this.updateUI(tokenMint);

    return result;
  }

  // Update UI for token
  updateUI(tokenMint) {
    // Update trending if on trending page
    if (window.pageManager && window.pageManager.currentPage === 'trending') {
      window.pageManager.renderTrending();
    }

    // Update token page if viewing this token
    if (window.pageManager && window.pageManager.currentPage === 'token') {
      const currentToken = window.location.hash.split('/')[1];
      if (currentToken === tokenMint) {
        window.pageManager.renderTokenPage(tokenMint);
      }
    }
  }

  // Get trade history (persisted via localStorage)
  getTradeHistory(tokenMint) {
    if (window.tradeLogger) {
      return window.tradeLogger.getTrades(tokenMint);
    }
    return [];
  }
}

// Global instance
window.tradingEngine = new TradingEngine();

// Export
window.TradingEngine = TradingEngine;