// raydium.js - Raydium Auto Liquidity System

class RaydiumLiquidity {
  constructor(connection, wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.MARKET_CAP_THRESHOLD_MIN = 30000; // $30k
    this.graduatedTokens = new Set();
  }

  // Check if token should graduate to Raydium
  shouldGraduate(marketCap) {
    return marketCap >= this.MARKET_CAP_THRESHOLD_MIN;
  }

  // Create Raydium liquidity pool via Raydium SDK (when available)
  async createLiquidityPool(tokenMint, solAmount, tokenAmount) {
    if (!window.RaydiumSDK && !window.raydium) {
      console.warn('Raydium SDK not available, skipping pool creation');
      return { success: false, reason: 'Raydium SDK missing' };
    }

    try {
      // Assemble parameters
      const mintPubkey = new solanaWeb3.PublicKey(tokenMint);
      const wsolMint = new solanaWeb3.PublicKey('So11111111111111111111111111111111111111112');
      const owner = new solanaWeb3.PublicKey(this.wallet.publicKey?.toString ? this.wallet.publicKey.toString() : this.wallet || '');

      // Raydium SDK integration (using the global RaydiumSDK object if present)
      const sdk = window.RaydiumSDK || window.raydium;

      // 1) Create pool (pair) if needed
      const poolInfo = await sdk.pool.createPoolIfNotExists({
        connection: this.connection,
        owner,
        tokenMint: mintPubkey,
        baseMint: wsolMint
      });

      // 2) Add liquidity
      const addLiquidityResult = await sdk.pool.addLiquidity({
        connection: this.connection,
        owner,
        pool: poolInfo,
        amountA: solAmount,
        amountB: tokenAmount
      });

      // 3) Burn LP tokens to lock liquidity
      await sdk.pool.burnLp({
        connection: this.connection,
        owner,
        pool: poolInfo,
        lpAmount: addLiquidityResult.lpAmount
      });

      return {
        success: true,
        poolId: poolInfo.id || poolInfo.address,
        lpToken: addLiquidityResult.lpMint?.toString(),
        details: { poolInfo, addLiquidityResult }
      };
    } catch (error) {
      console.error('Raydium pool creation failed:', error);
      return { success: false, reason: error.message || 'Unknown error' };
    }
  }

  // Monitor market cap and trigger graduation
  async monitorAndGraduate(tokenMint, bondingCurve) {
    const state = bondingCurve.getState();

    if (!this.shouldGraduate(state.marketCap) || this.graduatedTokens.has(tokenMint)) {
      return null;
    }

    console.log(`Token ${tokenMint} reached market cap threshold. Creating Raydium liquidity...`);

    // Calculate liquidity amounts
    const solLiquidity = state.solLiquidity * 0.8; // Use 80% of bonding curve SOL
    const tokenLiquidity = state.tokensSold * 0.8; // Use 80% of tokens

    const result = await this.createLiquidityPool(tokenMint, solLiquidity, tokenLiquidity);

    if (result.success) {
      this.graduatedTokens.add(tokenMint);

      // Mark token as listed in our state manager
      if (window.tokenStateManager) {
        window.tokenStateManager.updateTokenState(tokenMint, { dexListed: true });
      }

      // Notify user
      if (typeof toast === 'function') {
        toast('success', 'Raydium Listed', `Token is now listed on Raydium. Liquidity pool created.`);
      }

      // Update bonding curve state
      bondingCurve.solLiquidity *= 0.2; // Keep 20% in bonding curve
      bondingCurve.tokensSold *= 0.2;

      console.log('Successfully graduated to Raydium!');
      return result;
    }

    return null;
  }
}

// Export
window.RaydiumLiquidity = RaydiumLiquidity;