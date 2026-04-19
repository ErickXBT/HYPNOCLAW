// bonding-curve.js - Bonding Curve Engine for HYPNOCLAW Launchpad

class BondingCurve {
  constructor(tokenMint) {
    this.tokenMint = tokenMint;
    this.basePrice = 0.0000005;
    this.slope = 0.000000002;
    this.tokensSold = 0; // Track total tokens sold
    this.solLiquidity = 0; // SOL held in bonding curve
  }

  // Calculate current price per token
  calculatePrice(tokensSold = this.tokensSold) {
    return this.basePrice + (tokensSold * this.slope);
  }

  // Calculate price for buying amount tokens
  calculateBuyPrice(amount) {
    const startPrice = this.calculatePrice();
    const endTokens = this.tokensSold + amount;
    const endPrice = this.calculatePrice(endTokens);
    const averagePrice = (startPrice + endPrice) / 2;
    return averagePrice * amount;
  }

  // Calculate SOL received for selling amount tokens
  calculateSellPrice(amount) {
    if (amount > this.tokensSold) {
      throw new Error('Insufficient tokens in bonding curve');
    }
    const startTokens = this.tokensSold;
    const endTokens = this.tokensSold - amount;
    const startPrice = this.calculatePrice(startTokens);
    const endPrice = this.calculatePrice(endTokens);
    const averagePrice = (startPrice + endPrice) / 2;
    return averagePrice * amount;
  }

  // Buy tokens
  async buyToken(amount, buyerWallet) {
    const solRequired = this.calculateBuyPrice(amount);
    // Check balance, anti-bot, etc. (handled elsewhere)

    // Transfer SOL to bonding curve
    // In production, this would interact with on-chain program
    this.solLiquidity += solRequired;
    this.tokensSold += amount;

    // Update global token state
    if (window.tokenStateManager) {
      const state = window.tokenStateManager.getTokenState(this.tokenMint);
      const newVolume = (state.volume || 0) + solRequired;
      const newTrades = (state.tradeCount || 0) + 1;

      window.tokenStateManager.updateTokenState(this.tokenMint, {
        tokensSold: this.tokensSold,
        price: this.calculatePrice(),
        marketCap: this.tokensSold * this.calculatePrice() * 200, // Assuming 1 SOL = $200
        liquidity: this.solLiquidity,
        volume: newVolume,
        tradeCount: newTrades
      });
    }

    return {
      tokensReceived: amount,
      solPaid: solRequired,
      newPrice: this.calculatePrice()
    };
  }

  // Sell tokens
  async sellToken(amount, sellerWallet) {
    const solReceived = this.calculateSellPrice(amount);
    // Check balance, anti-bot, etc.

    // Transfer tokens back, SOL out
    this.solLiquidity -= solReceived;
    this.tokensSold -= amount;

    // Update global token state
    if (window.tokenStateManager) {
      const state = window.tokenStateManager.getTokenState(this.tokenMint);
      const newVolume = (state.volume || 0) + solReceived;
      const newTrades = (state.tradeCount || 0) + 1;

      window.tokenStateManager.updateTokenState(this.tokenMint, {
        tokensSold: this.tokensSold,
        price: this.calculatePrice(),
        marketCap: this.tokensSold * this.calculatePrice() * 200,
        liquidity: this.solLiquidity,
        volume: newVolume,
        tradeCount: newTrades
      });
    }

    return {
      tokensSold: amount,
      solReceived: solReceived,
      newPrice: this.calculatePrice()
    };
  }

  // Get current state
  getState() {
    return {
      tokenMint: this.tokenMint,
      tokensSold: this.tokensSold,
      solLiquidity: this.solLiquidity,
      currentPrice: this.calculatePrice(),
      marketCap: this.tokensSold * this.calculatePrice() * 200 // Assuming 1 SOL = $200
    };
  }
}

// Export for use in other modules
window.BondingCurve = BondingCurve;