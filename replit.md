# HYPNOCLAW AI

## Overview
A Solana-based decentralized application (dApp) that functions as a token launchpad and trading platform with an "AI Health Agent for Insomnia" theme. Features a bonding curve mechanism for token launches, anti-bot systems, and automated liquidity migration to Raydium.

## Architecture
- **Type**: Static frontend web application (no build step required)
- **Languages**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Blockchain**: Solana
- **Wallet**: Phantom Wallet integration

## Project Structure
- `index.html` — Main entry point (copied from `hypnoclaw-full (3).html`)
- `server.js` — Simple Node.js HTTP server to serve static files on port 5000
- `bonding-curve.js` — Token bonding curve price calculations
- `raydium.js` — Liquidity graduation to Raydium pools
- `rpc.js` — Solana RPC connection management with failover
- `dexscreener.js` — Dexscreener API integration
- `trading-ui.js` — UI rendering and trading components
- `pages.js` — Hash-based routing and page management
- `fees.js` — Platform fee processing
- `trending.js` — Trending token display logic
- `anti-bot.js` — Anti-bot trading protection
- `js/tradingEngine.js` — Central trade execution orchestrator
- `js/tokenState.js` — Global token price/market cap state manager
- `js/dexService.js` — DEX abstraction service
- `systems/registry.js` — Token registry management
- `systems/tradeLogger.js` — Trade event logging

## Running the App
- **Workflow**: "Start application" runs `node server.js`
- **Port**: 5000 (0.0.0.0)
- **Deployment**: Configured as a static site

## Key Features
- Bonding curve token pricing (linear slope model)
- Automatic Raydium pool graduation at $30k market cap
- RPC failover across multiple Solana endpoints (Helius, public)
- Phantom Wallet integration with auto-connect
- Anti-bot trading protection
