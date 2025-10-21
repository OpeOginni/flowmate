# Transaction Templating System

## Overview

FlowMate now uses a **string-based transaction templating system** that dynamically injects contract addresses based on the selected Flow network (mainnet, testnet, or emulator). This allows a single Cadence transaction file to work across all networks without modification.

## Problem Solved

Previously, Cadence transactions had generic import statements like:
```cadence
import FlowToken from "FlowToken"
import USDCFlow from "USDCFlow"
```

These imports rely on the Flow configuration file to resolve addresses, which can be brittle and doesn't work well in all contexts. The new system explicitly injects the correct contract addresses at runtime.

## How It Works

### 1. Contract Address Mapping (`contract-addresses.ts`)

Maintains a comprehensive mapping of contract addresses for each network:

```typescript
export const CONTRACT_ADDRESSES: Record<FlowNetwork, ContractAddresses> = {
  mainnet: {
    FlowToken: '0x1654653399040a61',
    USDCFlow: '0xf1ab99c82dee3526',
    FungibleToken: '0xf233dcee88fe0abe',
    FlowTransactionScheduler: '0xe467b9dd11fa00df',
    // ... and many more
  },
  testnet: {
    FlowToken: '0x7e60df042a9c0868',
    USDCFlow: '0x64adf39cbc354fcb',
    FungibleToken: '0x9a0766d93b6608b7',
    FlowTransactionScheduler: '0x8c5303eaa26202d6',
    // ... and many more
  },
  emulator: {
    // Emulator addresses
  }
};
```

### 2. Transaction Templating Engine (`template-transaction.ts`)

The `templateTransaction()` function performs regex-based replacement of import statements:

**Pattern 1:** `import ContractName from "ContractName"`  
**Becomes:** `import ContractName from 0xADDRESS`

**Pattern 2:** `import "ContractName"`  
**Becomes:** `import ContractName from 0xADDRESS`

```typescript
export function templateTransaction(
  transactionCode: string, 
  network: FlowNetwork = 'testnet'
): string {
  const contractAddresses = getContractAddresses(network);
  let templatedCode = transactionCode;

  // Replace import statements with actual addresses
  templatedCode = templatedCode.replace(
    /import\s+(\w+)\s+from\s+"(\w+)"/g,
    (match, importName, contractName) => {
      const address = contractAddresses[contractName];
      return address 
        ? `import ${importName} from ${address}`
        : match; // Keep original if address not found
    }
  );

  return templatedCode;
}
```

### 3. Tool Integration (`flow-transactions.ts`)

Each transaction tool now uses the templating system:

```typescript
export const sendTokenTool = tool({
  description: 'Send FLOW or USDC tokens...',
  inputSchema: sendTokenSchema,
  execute: async (params: SendTokenParams) => {
    // Read the raw transaction file
    const code = readAndTemplateTransaction('SendToken.cdc', currentNetwork);
    
    return {
      name: 'Send Tokens',
      code, // Now contains templated addresses
      args: [...],
      description: `Send ${params.amount} ${params.tokenType}...`,
    };
  },
});
```

The `currentNetwork` is set by the chat API before processing any requests.

### 4. Network Configuration (`api/chat/route.ts`)

The chat API receives the user's connected network from the frontend:

```typescript
export async function POST(req: NextRequest) {
  const { messages, walletAddress, network } = await req.json();
  
  // Use the user's connected network (with fallbacks)
  const userNetwork = network || process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet';
  
  // Set the network for transaction templating
  setFlowNetwork(userNetwork);
  console.log(`[Chat API] Using Flow network: ${userNetwork}`);

  // Process the request with tools...
}
```

### 5. Frontend Network Detection (`MainPageInput.tsx`)

The frontend sends the user's currently connected network:

```typescript
import { useNetworkSwitch } from '@/providers/FlowProvider'

export default function ConnectWallet() {
  const { currentNetwork } = useNetworkSwitch()
  
  const { messages, sendMessage } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        walletAddress: user?.addr,
        network: currentNetwork, // User's wallet network
      },
    }),
  })
}
```

## Example: Before & After Templating

### Original Transaction File (`SendToken.cdc`)
```cadence
import FlowToken from "FlowToken"
import USDCFlow from "USDCFlow"
import FungibleToken from "FungibleToken"

transaction(recipient: Address, amount: UFix64, tokenType: String) {
  // ... transaction logic
}
```

### After Templating (Testnet)
```cadence
import FlowToken from 0x7e60df042a9c0868
import USDCFlow from 0x64adf39cbc354fcb
import FungibleToken from 0x9a0766d93b6608b7

transaction(recipient: Address, amount: UFix64, tokenType: String) {
  // ... transaction logic
}
```

### After Templating (Mainnet)
```cadence
import FlowToken from 0x1654653399040a61
import USDCFlow from 0xf1ab99c82dee3526
import FungibleToken from 0xf233dcee88fe0abe

transaction(recipient: Address, amount: UFix64, tokenType: String) {
  // ... transaction logic
}
```

## Configuration

The network is automatically detected from the user's wallet connection. The system uses:

1. **User's Connected Network** (primary) - Detected via `useNetworkSwitch()` hook
2. **Environment Variable** (fallback) - `NEXT_PUBLIC_FLOW_NETWORK` in `.env.local`
3. **Default** (final fallback) - `testnet`

```env
# In .env.local (optional fallback)
NEXT_PUBLIC_FLOW_NETWORK=testnet  # or mainnet, emulator
```

This means:
- If a user connects their wallet to **mainnet**, transactions will use **mainnet** contract addresses
- If a user connects to **testnet**, transactions will use **testnet** contract addresses
- The transactions will always match the user's wallet network

## Benefits

✅ **Network Agnostic** - One transaction file works on all networks  
✅ **User-Centric** - Automatically uses the network the user's wallet is connected to  
✅ **No Mismatches** - Transactions always match the user's wallet network  
✅ **Explicit Addresses** - No reliance on config file resolution  
✅ **Type Safe** - Contract addresses are validated TypeScript types  
✅ **Centralized Management** - Update addresses in one place  
✅ **Built-in Logging** - See exactly how transactions are transformed  
✅ **Easy Testing** - Switch networks with an env var change  

## Debugging

The system includes comprehensive logging. When a transaction is templated, you'll see:

```
=== Templating Transaction: SendToken.cdc for testnet ===
Original imports:
   import FlowToken from "FlowToken"
   import USDCFlow from "USDCFlow"
   import FungibleToken from "FungibleToken"
Templated imports:
   import FlowToken from 0x7e60df042a9c0868
   import USDCFlow from 0x64adf39cbc354fcb
   import FungibleToken from 0x9a0766d93b6608b7
============================================================
```

## Files Modified

1. **`src/server/lib/contract-addresses.ts`** - Contract address mappings
2. **`src/server/lib/template-transaction.ts`** - Templating engine
3. **`src/server/tools/flow-transactions.ts`** - Updated all tools to use templating
4. **`src/app/api/chat/route.ts`** - Sets network before processing
5. **`AGENTIC_TRANSACTIONS.md`** - Updated documentation
6. **`README.md`** - Updated with OpenRouter API key and network config

## Adding New Contracts

To add a new contract address:

1. Open `src/server/lib/contract-addresses.ts`
2. Add the contract name and address to each network:

```typescript
export const CONTRACT_ADDRESSES: Record<FlowNetwork, ContractAddresses> = {
  mainnet: {
    // ... existing contracts
    MyNewContract: '0xMAINNET_ADDRESS',
  },
  testnet: {
    // ... existing contracts
    MyNewContract: '0xTESTNET_ADDRESS',
  },
  emulator: {
    // ... existing contracts
    MyNewContract: '0xEMULATOR_ADDRESS',
  },
};
```

3. Update the `ContractAddresses` interface type if needed
4. The templating system will automatically handle imports for the new contract

## Testing

To test the templating system:

1. Set your network in `.env.local`:
   ```env
   NEXT_PUBLIC_FLOW_NETWORK=testnet
   ```

2. Make a transaction request through the chat interface

3. Check the console logs to see the templating in action

4. Click "Review & Sign Transaction" to see the final templated code

## Future Enhancements

- [ ] Add support for custom contract deployments
- [ ] Cache templated transactions for performance
- [ ] Add validation for missing contract addresses
- [ ] Support for dynamic address injection from user config
- [ ] Template script files in addition to transactions

