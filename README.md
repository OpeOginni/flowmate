# Flow Mate

> Your personal AI Butler for the Flow Blockchain

[![Flow](https://img.shields.io/badge/Flow-Build%20on-Flow-orange)](https://flow.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-4.0+-black)](https://sdk.vercel.ai)

Flow Mate is an AI-powered personal assistant built on the Flow Blockchain that handles blockchain operations through natural language. Send tokens, swap assets, check balances, and schedule transactions — all through conversation.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Smart Contracts](#smart-contracts)
- [Networks](#networks)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Operations

| Feature | Description |
|---------|-------------|
| **Token Transfers** | Send Flow or USDCFlow to any address |
| **Token Swaps** | Swap between Flow, USDCFlow, and stFlow on IncrementFi |
| **Balance Queries** | Get your Flow or USDCFlow balance on demand |
| **Scheduled Actions** | Schedule transfers and swaps for future execution |

### AI-Powered

- **Natural Language Interface**: Describe what you want to do in plain English
- **Intelligent Tool Selection**: AI automatically selects the correct operation based on your request
- **Agentic Tools**: Built with Vercel AI SDK and custom agentic tools for Flow operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (Next.js + Tailwind)                      │
│                        ┌─────────┐                           │
│                        │  AI UI   │                          │
│                        └────┬────┘                           │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Layer                                │
│              (Vercel AI SDK + Agent Tools)                  │
│                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│   │  Send    │   │  Swap    │   │ Schedule │                │
│   │  Token   │   │  Token   │   │  Action  │                │
│   └──────────┘   └──────────┘   └──────────┘                │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Flow Blockchain                           │
│                                                              │
│   ┌─────────────────┐    ┌─────────────────────┐            │
│   │ Flow Token      │    │ Flow Mate Scheduler │            │
│   │ USDCFlow        │    │ Contract            │            │
│   │ stFlow          │    │ (0x136a...)         │            │
│   └─────────────────┘    └─────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DeFi Integrations                         │
│                    (IncrementFi)                            │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend

- [Next.js 14](https://nextjs.org) — React framework
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Vercel AI SDK](https://sdk.vercel.ai) — AI integration
- [@onflow/fcl](https://github.com/onflow/fcl) — Flow client
- [@onflow/react-sdk](https://github.com/onflow/react-sdk) — Flow React hooks

### Backend / Blockchain

- [Cadence](https://cadence-lang.org) — Smart contract language
- [Flow Blockchain](https://flow.com) — Layer 1 blockchain
- [Flow Actions](https://developers.flow.com) — Flow Forte upgrade

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Flow CLI (for contract development)
- A Flow account with Testnet/Mainnet access

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/OpeOginni/flowmate.git
cd flowmate
```

2. **Install frontend dependencies**

```bash
cd frontend
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

4. **Configure your environment**

Edit `.env.local` with your specific configuration (see [Environment Variables](#environment-variables))

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Smart Contract Setup

```bash
cd contracts
flow deps add mainnet://1d7e57aa55817448.FlowToken
flow deps add mainnet://1d7e57aa55817448.FungibleToken
flow deps add mainnet://1d7e57aa55817448.USDCFlow
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FLOW_NETWORK` | Flow network (testnet/mainnet) | Yes |
| `NEXT_PUBLIC_FLOW_ACCESS_NODE` | Flow access node URL | Yes |
| `AI_API_KEY` | Your AI provider API key | Yes |

## Usage

### Connect Wallet

1. Click the wallet connect button on the interface
2. Authenticate with your preferred Flow wallet (Blocto, Dapper, etc.)
3. Ensure you have sufficient balance for transactions

### Send Tokens

```
User: "Send 10 Flow to 0x1234567890abcdef"
AI:   "I'll send 10 Flow to the specified address. Please confirm..."
```

### Swap Tokens

```
User: "Swap 50 USDCFlow for Flow"
AI:   "I'll swap 50 USDCFlow for Flow on IncrementFi..."
```

### Check Balance

```
User: "What's my Flow balance?"
AI:   "Your Flow balance is 150.50 FLOW"
```

### Schedule Transactions

```
User: "Send 100 Flow to 0xabcdef tomorrow at 9am"
AI:   "I've scheduled a transfer of 100 Flow to execute tomorrow at 9:00 AM UTC"
```

## Smart Contracts

### Flow Mate Scheduler

The scheduler contract enables time-delayed transactions on Flow.

- **Mainnet**: [`0x136a10c590912ef8`](https://www.flowscan.io/contract/A.136a10c590912ef8.FlowMateScheduledActionsHandler)
- **Testnet**: Not yet deployed

### Contract Structure

```
contracts/
├── cadence/
│   ├── contracts/     # Smart contracts
│   ├── scripts/       # Read-only scripts
│   └── transactions/  # State-changing transactions
└── flow.json          # Project configuration
```

## Networks

| Network | Status | Notes |
|---------|--------|-------|
| **Mainnet** | ✅ Supported | Full functionality |
| **Testnet** | ⚠️ Partial | Swapping limited by liquidity |

### Switching Networks

Change `NEXT_PUBLIC_FLOW_NETWORK` in your environment:

```bash
# For testnet
NEXT_PUBLIC_FLOW_NETWORK=testnet

# For mainnet
NEXT_PUBLIC_FLOW_NETWORK=mainnet
```

## Roadmap

- [x] Token transfers (Flow, USDCFlow)
- [x] Token swaps (Flow, USDCFlow, stFlow)
- [x] Balance queries
- [x] Scheduled transfers
- [ ] Staking and unstaking Flow
- [ ] Flash loan operations
- [ ] Additional DeFi integrations
- [ ] Enhanced UI/UX

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Opeyemi](https://x.com/BrightOginni) during the Forte Hacks Hackathon

[![Follow on X](https://img.shields.io/twitter/follow/BrightOginni?style=social)](https://x.com/BrightOginni)
