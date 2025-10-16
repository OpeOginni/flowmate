# Agentic Transaction Orchestrator

## Overview

FlowMate's Agentic Transaction Orchestrator is an AI-powered assistant that interprets user intent, plans Flow blockchain actions, requests missing parameters, and generates ready-to-sign Cadence transactions. Users can interact with their Flow wallet using natural language, voice, or text input.

## Features

✅ **Natural Language Processing** - Understands user intent for blockchain operations  
✅ **Structured Parameter Collection** - Dynamic forms collect missing parameters in a user-friendly way  
✅ **Multi-Step Reasoning** - AI can ask follow-up questions for missing parameters  
✅ **Transaction Generation** - Automatically generates Cadence transactions from user requests  
✅ **Wallet Authentication** - Only authenticated Flow wallet users can generate transactions  
✅ **Transaction Review** - Users can review and edit parameters before signing  
✅ **Voice & Text Input** - Supports both voice transcription and text input  
✅ **Smart Defaults** - Pre-fills common values and validates input constraints  

## Supported Actions

### 1. Send Tokens
Send FLOW or USDC tokens to a recipient immediately.

**Example prompts:**
- "Send 10 FLOW to 0x1234567890abcdef"
- "Transfer 5 USDC to Bob's address"

### 2. Schedule Token Send
Schedule a token transfer for future execution.

**Example prompts:**
- "Schedule sending 10 FLOW to 0x1234567890abcdef tomorrow at 3pm"
- "Send 5 USDC to that address next Monday"

### 3. Swap Tokens
Exchange FLOW for USDC or vice versa immediately.

**Example prompts:**
- "Swap 5 FLOW to USDC"
- "Convert my FLOW to USDC"

### 4. Schedule Token Swap
Schedule a token swap for future execution.

**Example prompts:**
- "Schedule swapping 10 FLOW to USDC tomorrow at noon"
- "Swap tokens next week when the price is better"

### 5. Setup FlowMate Actions
Initialize your account for scheduled transactions (required once before scheduling).

**Example prompts:**
- "Setup my account for scheduling"
- "Initialize FlowMate actions"

### 6. Cancel Scheduled Action
Cancel a previously scheduled transaction.

**Example prompts:**
- "Cancel transaction ID 123"
- "Remove my scheduled swap"

### 7. Claim and Restake
Claim staking rewards and automatically restake them.

**Example prompts:**
- "Claim and restake rewards from pool 0"
- "Compound my staking rewards"

## Architecture

### Tech Stack
- **AI Model**: OpenAI GPT-4o / Qwen3-VL via OpenRouter
- **AI Framework**: Vercel AI SDK
- **Backend**: Next.js API Routes
- **Frontend**: React with @ai-sdk/react and @onflow/react-sdk
- **Blockchain**: Flow via FCL (Flow Client Library)
- **Transaction Templating**: Dynamic contract address injection based on network

### Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (Voice/Text Input → MainPageInput Component)           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              AI Chat API (/api/chat)                     │
│  - Validates wallet address                              │
│  - Streams AI responses with tools                       │
│  - Multi-step reasoning (up to 5 steps)                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               Tool Registry                              │
│  - sendToken                                             │
│  - scheduleSendToken                                     │
│  - scheduleSwapToken                                     │
│  - setupFlowMateActions                                  │
│  - cancelScheduledAction                                 │
│  - claimAndRestake                                       │
│  - swapTokens                                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│          Transaction Confirmation Modal                  │
│  - Review transaction details                            │
│  - Edit parameters                                       │
│  - Sign & send via Flow SDK hooks:                       │
│    • TransactionButton (submit)                          │
│    • TransactionDialog (status)                          │
│    • TransactionLink (explorer link)                     │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. User Input
Users interact through:
- **Text**: Type natural language requests
- **Voice**: Record voice commands (automatically transcribed via Whisper)

### 2. AI Processing & Parameter Collection
The AI assistant:
1. Analyzes user intent
2. Identifies the appropriate blockchain action
3. Checks for required parameters
4. **If parameters are missing**: Calls `requestParameters` tool with structured field definitions
5. **If parameters are complete**: Calls the appropriate transaction tool directly

### 3. Dynamic Form Rendering (When Parameters Missing)
When the AI identifies missing parameters:
1. `ParamRequestForm` component renders based on the field schema
2. Form includes:
   - Field labels and descriptions
   - Input types (text, number, select for enums)
   - Placeholders and examples
   - Validation rules (regex, min/max)
   - Pre-filled defaults and known values
3. User fills in the missing information
4. Form submits values back to the AI as JSON
5. AI then calls the transaction tool with complete parameters

### 4. Transaction Generation
Each tool:
1. Validates input parameters using Zod schemas
2. Reads the corresponding Cadence transaction file
3. Maps parameters to Cadence arguments
4. Returns a transaction payload with code and arguments

### 5. User Review & Signing
1. Transaction details are displayed in a modal
2. User can review and edit parameters
3. User clicks "Sign & Send" which triggers the `TransactionButton` from Flow SDK
4. Transaction is submitted to the Flow blockchain
5. `TransactionDialog` shows real-time transaction status
6. `TransactionLink` provides a link to view transaction on Flowscan

## Data Flow

### Complete Request Flow
```typescript
// 1. User sends message with all parameters
{
  text: "Send 10 FLOW to 0x1234567890abcdef"
}

// 2. AI responds with tool call (direct transaction)
{
  role: 'assistant',
  parts: [
    { type: 'text', text: "I'll prepare a transaction to send 10 FLOW..." },
    { 
      type: 'tool-sendToken',
      result: {
        name: 'Send Tokens',
        code: '...',  // Cadence transaction code
        args: [
          { name: 'recipient', type: 'Address', value: '0x1234567890abcdef' },
          { name: 'amount', type: 'UFix64', value: '10.0' },
          { name: 'tokenType', type: 'String', value: 'FlowToken' }
        ],
        description: 'Send 10.0 FlowToken to 0x1234567890abcdef'
      }
    }
  ]
}

// 3. User reviews and signs via Flow SDK hooks
```

### Incomplete Request Flow (Parameter Collection)
```typescript
// 1. User sends incomplete message
{
  text: "Send some FLOW"
}

// 2. AI requests missing parameters
{
  role: 'assistant',
  parts: [
    { type: 'text', text: "I can help you send FLOW tokens..." },
    {
      type: 'tool-requestParameters',
      result: {
        action: 'sendToken',
        actionLabel: 'Send Tokens',
        reason: 'To send FLOW tokens, I need the recipient address and amount',
        missing: [
          {
            id: 'recipient',
            label: 'Recipient Address',
            type: 'Address',
            required: true,
            description: 'Flow wallet address',
            placeholder: '0x1234567890abcdef',
            validation: { pattern: '^(0x)?[a-fA-F0-9]{16}$' }
          },
          {
            id: 'amount',
            label: 'Amount',
            type: 'UFix64',
            required: true,
            description: 'Amount of FLOW to send',
            placeholder: '10.0',
            validation: { min: 0.00000001 }
          }
        ],
        known: { tokenType: 'FlowToken' }
      }
    }
  ]
}

// 3. ParamRequestForm is rendered with the fields

// 4. User fills form and submits
{
  recipient: '0x1234567890abcdef',
  amount: 10.0
}

// 5. Values sent back to AI as message
{
  text: 'Here are the parameters you requested for Send Tokens:\n```json\n{\n  "recipient": "0x1234567890abcdef",\n  "amount": 10.0\n}\n```'
}

// 6. AI now calls sendToken tool with complete parameters
{
  role: 'assistant',
  parts: [
    { type: 'tool-sendToken', result: { /* transaction payload */ } }
  ]
}

// 7. User reviews and signs
```

## File Structure

```
frontend/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts                  # AI chat endpoint with parameter collection
│   ├── components/
│   │   ├── MainPageInput.tsx                 # Main chat interface
│   │   ├── ParamRequestForm.tsx              # Dynamic form for missing parameters
│   │   └── TransactionConfirmation.tsx       # Transaction review modal (uses Flow SDK hooks)
│   └── server/
│       ├── lib/
│       │   ├── contract-addresses.ts         # Network-specific contract address mappings
│       │   └── template-transaction.ts       # Transaction templating engine
│       ├── providers/
│       │   └── openrouter.ts                 # OpenRouter client
│       ├── schemas/
│       │   ├── transactions.ts               # Transaction Zod schemas
│       │   └── param-requests.ts             # Parameter field schemas & common definitions
│       └── tools/
│           ├── flow-transactions.ts          # Transaction tool implementations
│           ├── request-params.ts             # Parameter collection tool
│           └── param-helpers.ts              # Helper functions for field requirements
```

## Transaction Templating System

FlowMate uses a sophisticated transaction templating system to inject the correct contract addresses based on the target network (mainnet, testnet, or emulator).

### How It Works

1. **Cadence Transaction Files** - Stored in `contracts/cadence/transactions/` with generic import statements:
   ```cadence
   import FlowToken from "FlowToken"
   import USDCFlow from "USDCFlow"
   import FungibleToken from "FungibleToken"
   ```

2. **Contract Address Mapping** - `contract-addresses.ts` maintains address mappings for each network:
   ```typescript
   {
     mainnet: {
       FlowToken: '0x1654653399040a61',
       USDCFlow: '0xf1ab99c82dee3526',
       FungibleToken: '0xf233dcee88fe0abe',
       // ...
     },
     testnet: {
       FlowToken: '0x7e60df042a9c0868',
       USDCFlow: '0x64adf39cbc354fcb',
       FungibleToken: '0x9a0766d93b6608b7',
       // ...
     }
   }
   ```

3. **Dynamic Templating** - The `templateTransaction()` function replaces import statements with actual addresses:
   ```cadence
   // Before templating:
   import FlowToken from "FlowToken"
   
   // After templating (testnet):
   import FlowToken from 0x7e60df042a9c0868
   ```

4. **Network Selection** - The frontend detects the user's wallet network and sends it to the API:
   ```typescript
   // Frontend (MainPageInput.tsx)
   const { currentNetwork } = useNetworkSwitch()
   // Sent to API in request body
   
   // Backend (api/chat/route.ts)
   const userNetwork = network || process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet';
   setFlowNetwork(userNetwork);
   ```

### Benefits

✅ **Single Source of Truth** - One transaction file works across all networks  
✅ **User-Centric** - Automatically uses the network the user's wallet is connected to  
✅ **Network Flexibility** - Easily switch between mainnet, testnet, and emulator  
✅ **Type Safety** - Contract addresses are validated and type-safe  
✅ **Maintainability** - Contract address updates happen in one central location  
✅ **Logging** - Built-in logging shows exactly how imports are being transformed

### Structured Parameter Collection System

The system includes a sophisticated parameter collection mechanism:

#### Field Type Support
- **Address** - Flow wallet addresses with validation
- **UFix64** - Decimal numbers for token amounts
- **UInt64/UInt8** - Integer values
- **Enum** - Selection from predefined options (e.g., FlowToken, USDCFlow)
- **Timestamp** - Unix timestamps (accepts human-readable input)
- **String** - Text values
- **Bool** - Boolean flags

#### Common Field Definitions (`param-requests.ts`)
Pre-defined field templates for:
- recipient (Address with Flow validation)
- amount (UFix64 with min validation)
- tokenType (Enum: FlowToken/USDCFlow)
- timestamp (for scheduling)
- priority, executionEffort, feeAmount (optional scheduling params)
- fromToken, toToken (for swaps)
- pid (pool ID for staking)
- transactionId (for cancellation)

#### Action Requirements (`param-helpers.ts`)
Each action has defined:
- **Required fields** - Must be provided
- **Optional fields** - Can have defaults
- **Defaults** - Pre-filled values (e.g., tokenType: 'FlowToken', priority: 2)

Example for `sendToken`:
```typescript
{
  required: ['recipient', 'amount'],
  optional: ['tokenType'],
  defaults: { tokenType: 'FlowToken' }
}
```

### Flow SDK Hooks Used

The transaction confirmation component uses the following Flow SDK hooks:

- **`TransactionButton`** - Handles transaction submission and wallet signing
- **`TransactionDialog`** - Displays real-time transaction status with loading states
- **`TransactionLink`** - Provides a link to view the transaction on Flowscan explorer

These hooks are from `@onflow/react-sdk` and provide a better UX than custom FCL implementations.

## Configuration

### Environment Variables

Required in `.env.local`:

```env
# OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenAI API Key (for Whisper transcription)
OPENAI_API_KEY=your_openai_api_key_here

# Flow Network
NEXT_PUBLIC_FLOW_NETWORK=mainnet

# App Details
NEXT_PUBLIC_APP_DETAIL_URL=http://localhost:3000
```

### System Prompt

The AI uses a carefully crafted system prompt that:
- Defines available blockchain actions
- Instructs the AI to ask for missing parameters
- Prevents fabrication of addresses or amounts
- Ensures clear communication with users

See `/app/api/chat/route.ts` for the full prompt.

## Security

### Wallet Authentication
- All API requests validate Flow wallet address format
- Regex validation: `/^(0x)?[a-fA-F0-9]{16}$/`
- Unauthenticated requests are rejected with 401

### Parameter Validation
- All tool inputs validated with Zod schemas
- Type-safe parameter handling
- Invalid inputs return clear error messages

### Transaction Review
- Users must explicitly review and approve all transactions
- All parameters are editable before signing
- Transaction code is visible for transparency

## Usage Examples

### Basic Send
```
User: "Send 10 FLOW to 0x1234567890abcdef"
AI: "I'll prepare a transaction to send 10 FLOW tokens to 0x1234567890abcdef."
[Transaction generated and presented for review]
```

### Missing Parameters
```
User: "Send some FLOW to Bob"
AI: "I can help you send FLOW. Could you provide:
     1. Bob's Flow wallet address
     2. The amount of FLOW to send"
User: "Send 5 FLOW to 0x1234567890abcdef"
AI: "Got it! I'll prepare the transaction."
[Transaction generated]
```

### Scheduling
```
User: "Schedule sending 10 FLOW to Alice tomorrow at 3pm"
AI: "To schedule this transaction, I need:
     1. Alice's wallet address
     2. Your timezone to calculate the correct timestamp"
User: "0xabcdef1234567890, I'm in EST"
AI: "Perfect! Scheduling for tomorrow at 3pm EST (timestamp: 1234567890)."
[Transaction generated with scheduled parameters]
```

## Extending the System

### Adding New Actions

1. **Create Transaction File**
   - Add `.cdc` file to `contracts/cadence/transactions/`

2. **Define Zod Schema**
   ```typescript
   // src/server/schemas/transactions.ts
   export const myNewActionSchema = z.object({
     param1: z.string(),
     param2: z.number(),
   });
   ```

3. **Create Tool**
   ```typescript
   // src/server/tools/flow-transactions.ts
   export const myNewActionTool = tool({
     description: 'Description for AI',
     parameters: myNewActionSchema,
     execute: async (params) => {
       const code = readTransactionFile('MyNewAction.cdc');
       return {
         name: 'My New Action',
         codePath: 'contracts/cadence/transactions/MyNewAction.cdc',
         code,
         args: [...],
         description: 'User-friendly description',
       };
     },
   });
   ```

4. **Register Tool**
   ```typescript
   export const flowTransactionTools = {
     // ... existing tools
     myNewAction: myNewActionTool,
   };
   ```

## Troubleshooting

### AI Not Calling Tools
- Check that the description is clear and specific
- Ensure required parameters are in the schema
- Verify the tool is registered in `flowTransactionTools`

### Transaction Fails
- Check Cadence transaction code for errors
- Verify argument types match Cadence expectations
- Ensure user has sufficient balance/permissions

### Wallet Connection Issues
- Confirm wallet is connected before sending messages
- Check Flow network configuration
- Verify FCL initialization

## Future Enhancements

- [ ] Support for more DeFi protocols
- [ ] Multi-transaction batching
- [ ] Gas estimation and optimization
- [ ] Transaction history and tracking
- [ ] Advanced scheduling options (recurring, conditional)
- [ ] Integration with more AI models
- [ ] Real-time blockchain data queries

## Credits

- **Vercel AI SDK** - Streaming AI responses and tool calling
- **OpenRouter** - AI model access
- **Flow Blockchain** - Smart contract platform
- **FCL** - Flow Client Library

