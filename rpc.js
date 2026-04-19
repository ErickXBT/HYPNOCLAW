// rpc.js - RPC Infrastructure Configuration

const RPC_ENDPOINTS = [
  'https://mainnet.helius-rpc.com/?api-key=5b018308-4743-440c-996d-4bae88141355',
  'https://api.mainnet-beta.solana.com',
  'https://solana.public-rpc.com'
];

class RPCManager {
  constructor() {
    this.endpoints = [...RPC_ENDPOINTS];
    this.currentEndpoint = this.endpoints[0];
    this.connection = new solanaWeb3.Connection(this.currentEndpoint, 'confirmed');
  }

  // Try to return a healthy connection (failover if needed)
  async getConnection() {
    for (const endpoint of this.endpoints) {
      try {
        const conn = new solanaWeb3.Connection(endpoint, 'confirmed');
        const { blockhash } = await conn.getLatestBlockhash();
        if (blockhash) {
          this.currentEndpoint = endpoint;
          this.connection = conn;
          return this.connection;
        }
      } catch (err) {
        console.warn('RPC failed:', endpoint, err.message);
      }
    }
    throw new Error('All RPC endpoints failed');
  }

  // Health check current connection
  async healthCheck() {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();
      return !!blockhash;
    } catch (error) {
      console.error('RPC health check failed:', error);
      return false;
    }
  }

  // Ensure connection is healthy, otherwise attempt failover
  async ensureConnection() {
    if (await this.healthCheck()) return this.connection;
    console.log('Primary RPC failed, trying failover...');
    return this.getConnection();
  }
}

// Global RPC instance
window.rpcManager = new RPCManager();

// Initialize connection
(async () => {
  try {
    window.connection = await window.rpcManager.getConnection();
  } catch (err) {
    console.error('Failed to initialize RPC connection:', err);
    window.connection = new solanaWeb3.Connection(RPC_ENDPOINTS[0], 'confirmed');
  }
})();
