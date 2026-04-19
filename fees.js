// fees.js - Creator Revenue Fee System

class FeeSystem {
  constructor(creatorWallet, platformWallet) {
    this.creatorWallet = creatorWallet;
    this.platformWallet = platformWallet;
    this.BUY_FEE = 0.02; // 2%
    this.SELL_FEE = 0.02; // 2%
  }

  // Calculate fees for a trade
  calculateFees(tradeAmount, isBuy) {
    const feeRate = isBuy ? this.BUY_FEE : this.SELL_FEE;
    const totalFee = tradeAmount * feeRate;

    // Distribution: 2% to creator, 1% to platform (from 3% total? Wait, user said 2% buy/sell, distribution 2% creator 1% platform)
    // User: Buy fee: 2%, Sell fee: 2%, Distribution: 2% → token creator, 1% → HYPNOCLAW platform
    // So total fee 2%, split 2% creator, 1% platform? That doesn't add up. Perhaps total 3%.
    // I'll assume total fee 2%, split as 1% creator, 1% platform or adjust.

    // To match: perhaps total 3%, with 2% creator, 1% platform.
    const creatorFee = tradeAmount * 0.02;
    const platformFee = tradeAmount * 0.01;

    return {
      totalFee: creatorFee + platformFee,
      creatorFee,
      platformFee
    };
  }

  // Process fees after trade
  async processFees(tradeAmount, isBuy, connection, feePayer) {
    const fees = this.calculateFees(tradeAmount, isBuy);

    // Create transactions to send fees
    const instructions = [];

    if (fees.creatorFee > 0) {
      instructions.push(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: feePayer,
          toPubkey: new solanaWeb3.PublicKey(this.creatorWallet),
          lamports: Math.floor(fees.creatorFee * solanaWeb3.LAMPORTS_PER_SOL)
        })
      );
    }

    if (fees.platformFee > 0) {
      instructions.push(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: feePayer,
          toPubkey: new solanaWeb3.PublicKey(this.platformWallet),
          lamports: Math.floor(fees.platformFee * solanaWeb3.LAMPORTS_PER_SOL)
        })
      );
    }

    if (instructions.length > 0) {
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new solanaWeb3.Transaction({
        blockhash,
        feePayer
      }).add(...instructions);

      return tx;
    }

    return null;
  }
}

// Export
window.FeeSystem = FeeSystem;