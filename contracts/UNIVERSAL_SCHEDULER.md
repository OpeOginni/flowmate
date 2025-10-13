# FlowMate Universal Action Scheduler

A scalable, efficient system for scheduling blockchain actions via voice commands on Flow blockchain.

## Overview

The Universal Action Scheduler solves the problem of resource bloat by using a **single Handler resource** that can execute unlimited scheduled transactions. Instead of creating a new Handler for each schedule, all actions are managed centrally through one Handler that interprets action data at execution time.

## Architecture

```
┌─────────────────────────────────────────────┐
│              User Account                    │
│                                              │
│  Manager (FlowTransactionSchedulerUtils)    │
│  ├─ Schedule 1: Send 10 FLOW to Alice       │
│  ├─ Schedule 2: Swap 5 FLOW to USDC         │
│  ├─ Schedule 3: Recurring payment weekly    │
│  └─ Schedule N: ...                         │
│                                              │
│  UniversalActionHandler (ONE resource)      │
│  └─ Executes all action types               │
│                                              │
│  FlowToken.Vault (uses capabilities)        │
│  USDCFlow.Vault (uses capabilities)         │
└─────────────────────────────────────────────┘
```

## Key Features

✅ **One Handler for All Schedules** - No resource duplication  
✅ **Capability-Based** - No token locking, uses vault capabilities  
✅ **Extensible** - Easy to add new action types  
✅ **Voice-AI Ready** - Simple data structures for AI interpretation  
✅ **Centralized Management** - All schedules managed via Manager  

## Action Types Supported

| Action Type | Description | Parameters |
|------------|-------------|------------|
| `send_token` | Send tokens to a recipient | recipient, amount, tokenType |
| `swap_token` | Swap between tokens using IncrementFi | fromToken, toToken, amount |
| `recurring_payment` | Periodic token payments | recipient, amount, tokenType |
| `batch_send` | Send to multiple recipients | recipients: {Address: UFix64} |

## Setup

### 1. First-Time Setup

Run this once per account to set up the Manager and Handler:

```bash
flow transactions send ./cadence/transactions/SetupFlowMateActions.cdc --signer your-account
```

This creates:
- FlowTransactionSchedulerUtils Manager
- Universal FlowMateActionHandler
- Required capabilities

### 2. Schedule a Token Send

```bash
flow transactions send ./cadence/transactions/ScheduleSendToken.cdc \
  --arg Address:0xRECIPIENT_ADDRESS \
  --arg UFix64:10.0 \
  --arg UFix64:1704067200.0 \
  --arg UInt8:1 \
  --arg UInt64:1000 \
  --arg UFix64:0.1 \
  --arg String:"FlowToken" \
  --signer your-account
```

Parameters:
- `recipient`: Address to send tokens to
- `amount`: Amount to send
- `timestamp`: Unix timestamp for execution
- `priority`: 0=Low, 1=Medium, 2=High
- `executionEffort`: Gas limit (e.g., 1000)
- `feeAmount`: Scheduling fee in FLOW
- `tokenType`: "FlowToken" or "USDCFlow"

### 3. Schedule a Token Swap

```bash
flow transactions send ./cadence/transactions/ScheduleSwapToken.cdc \
  --arg String:"FlowToken" \
  --arg String:"USDCFlow" \
  --arg UFix64:5.0 \
  --arg UFix64:1704067200.0 \
  --arg UInt8:1 \
  --arg UInt64:2000 \
  --arg UFix64:0.2 \
  --signer your-account
```

Parameters:
- `fromToken`: "FlowToken" or "USDCFlow"
- `toToken`: "FlowToken" or "USDCFlow"
- `amount`: Amount to swap
- `timestamp`: Unix timestamp for execution
- `priority`: 0=Low, 1=Medium, 2=High
- `executionEffort`: Gas limit (e.g., 2000 for swaps)
- `feeAmount`: Scheduling fee in FLOW

### 4. Cancel a Scheduled Action

```bash
flow transactions send ./cadence/transactions/CancelScheduledAction.cdc \
  --arg UInt64:TRANSACTION_ID \
  --signer your-account
```

Returns 50% of the scheduling fee as refund.

## Query Scripts

### Get All Scheduled Actions

```bash
flow scripts execute ./cadence/scripts/GetScheduledActions.cdc \
  --arg Address:0xYOUR_ADDRESS
```

Returns list of all scheduled actions with their IDs, timestamps, and status.

### Get Action Status

```bash
flow scripts execute ./cadence/scripts/GetActionStatus.cdc \
  --arg UInt64:TRANSACTION_ID
```

Returns detailed status of a specific scheduled action.

## Voice AI Integration

### Example Flow

```
User: "Send 10 FLOW to Alice tomorrow at 5pm"
  ↓
AI Extracts:
  - action: "send_token"
  - recipient: Alice's address (0x...)
  - amount: 10.0
  - tokenType: "FlowToken"
  - timestamp: Calculate Unix timestamp for tomorrow 5pm
  ↓
Call: ScheduleSendToken.cdc with extracted parameters
  ↓
Return: Transaction ID to user for tracking
```

### Action Data Structure

All actions use the `ActionData` struct:

```cadence
struct ActionData {
    type: String                    // "send_token", "swap_token", etc.
    parameters: {String: AnyStruct} // Action-specific parameters
}
```

Example for send:
```cadence
ActionData(
    type: "send_token",
    parameters: {
        "recipient": 0x123...,
        "amount": 10.0,
        "tokenType": "FlowToken"
    }
)
```

Example for swap:
```cadence
ActionData(
    type: "swap_token",
    parameters: {
        "fromToken": "FlowToken",
        "toToken": "USDCFlow",
        "amount": 5.0
    }
)
```

## Events

The contract emits detailed events for monitoring:

- `ActionExecuted`: General action completion
- `SendTokenExecuted`: Token send details
- `SwapTokenExecuted`: Swap details with amounts
- `RecurringPaymentExecuted`: Recurring payment info
- `BatchSendExecuted`: Batch send summary

## Files Structure

```
contracts/
├── cadence/
│   ├── contracts/
│   │   └── FlowMateActionHandler.cdc       # Main contract
│   ├── transactions/
│   │   ├── SetupFlowMateActions.cdc        # One-time setup
│   │   ├── ScheduleSendToken.cdc           # Schedule send
│   │   ├── ScheduleSwapToken.cdc           # Schedule swap
│   │   └── CancelScheduledAction.cdc       # Cancel schedule
│   └── scripts/
│       ├── GetScheduledActions.cdc         # Query all schedules
│       └── GetActionStatus.cdc             # Query specific status
```

## Fees

Scheduling fees depend on:
- **Priority**: High (10x), Medium (5x), Low (2x) multiplier
- **Execution Effort**: Gas limit for the action
- **Storage**: Data storage costs

Use `FlowTransactionScheduler.estimate()` to calculate fees before scheduling.

## Benefits Over Previous Approach

| Old Approach | Universal Scheduler |
|-------------|-------------------|
| N schedules = N Handler resources | N schedules = 1 Handler |
| Tokens locked in Handler | Tokens stay in vault (capabilities) |
| Separate contract per action type | One contract for all actions |
| Complex management | Central Manager |
| Not AI-friendly | Simple data structures |

## Extending with New Actions

To add a new action type:

1. Add event in `FlowMateActionHandler.cdc`:
```cadence
access(all) event NewActionExecuted(id: UInt64, ...)
```

2. Add case in `executeTransaction()`:
```cadence
case "new_action":
    self.executeNewAction(id: id, params: actionData.parameters)
```

3. Implement execution function:
```cadence
access(self) fun executeNewAction(id: UInt64, params: {String: AnyStruct}) {
    // Implementation
}
```

4. Create scheduling transaction similar to `ScheduleSendToken.cdc`

## Security Considerations

- Only the Handler can execute scheduled transactions (via Execute entitlement)
- Capabilities restrict vault access to only what's needed
- Pre-execution balance checks prevent over-withdrawal
- All actions emit events for transparency
- Cancellation requires ownership of the Manager resource

## Support

For issues or questions, see the main FlowMate repository.
