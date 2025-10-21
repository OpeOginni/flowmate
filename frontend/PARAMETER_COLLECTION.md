# Structured Parameter Collection System

## Overview

The parameter collection system provides a dynamic, user-friendly way to collect missing information when users make incomplete blockchain transaction requests. Instead of asking questions in natural language, the AI generates structured forms that guide users to provide the exact information needed.

## How It Works

### 1. Detection of Missing Parameters

When a user makes a request like "Send some FLOW", the AI:
1. Identifies the intended action (`sendToken`)
2. Checks which parameters are provided (none in this case)
3. Determines which parameters are missing (`recipient`, `amount`)
4. Calls the `requestParameters` tool with a structured request

### 2. Form Generation

The `requestParameters` tool returns a `ParamRequest` object:

```typescript
{
  action: "sendToken",
  actionLabel: "Send Tokens",
  reason: "To send FLOW tokens, I need the recipient's address and the amount to send",
  missing: [
    {
      id: "recipient",
      label: "Recipient Address",
      type: "Address",
      required: true,
      description: "Flow wallet address of the recipient",
      placeholder: "0x1234567890abcdef",
      validation: { pattern: "^(0x)?[a-fA-F0-9]{16}$" }
    },
    {
      id: "amount",
      label: "Amount",
      type: "UFix64",
      required: true,
      description: "Amount of FLOW to send",
      placeholder: "10.0",
      validation: { min: 0.00000001 }
    }
  ],
  known: { tokenType: "FlowToken" }
}
```

### 3. Frontend Rendering

The `ParamRequestForm` component:
- Renders appropriate input types based on field type:
  - Text inputs for Address, String, Timestamp
  - Number inputs for UFix64, UInt64, UInt8
  - Select dropdowns for Enum types
  - Checkboxes for Bool types
- Applies validation rules (regex patterns, min/max values)
- Shows placeholders, examples, and descriptions
- Pre-fills defaults and known values

### 4. Submission & Continuation

When the user submits the form:
1. Values are validated against the schema
2. Data is sent back to the AI as a JSON message
3. AI extracts the values and calls the appropriate transaction tool
4. Transaction generation proceeds normally

## Field Types

### Address
Flow blockchain addresses with validation.

```typescript
{
  id: "recipient",
  type: "Address",
  validation: { pattern: "^(0x)?[a-fA-F0-9]{16}$" }
}
```

### UFix64
Decimal numbers for token amounts.

```typescript
{
  id: "amount",
  type: "UFix64",
  validation: { min: 0.00000001 }
}
```

### UInt64 / UInt8
Integer values for counts, IDs, priorities.

```typescript
{
  id: "priority",
  type: "UInt8",
  validation: { min: 0, max: 4 },
  default: 2
}
```

### Enum
Selection from predefined options.

```typescript
{
  id: "tokenType",
  type: "Enum",
  enumOptions: ["FlowToken", "USDCFlow"],
  default: "FlowToken"
}
```

### Timestamp
Unix timestamps (accepts human-readable input).

```typescript
{
  id: "timestamp",
  type: "Timestamp",
  description: "When to execute (provide timezone for relative times)"
}
```

### String
General text values.

```typescript
{
  id: "note",
  type: "String",
  placeholder: "Optional note"
}
```

### Bool
Boolean flags.

```typescript
{
  id: "autoExecute",
  type: "Bool",
  default: true
}
```

## Common Field Definitions

Pre-defined templates in `param-requests.ts`:

| Field | Type | Validation | Default |
|-------|------|------------|---------|
| recipient | Address | Flow address regex | - |
| amount | UFix64 | min: 0.00000001 | - |
| tokenType | Enum | FlowToken/USDCFlow | FlowToken |
| timestamp | Timestamp | - | - |
| priority | UInt8 | 0-4 range | 2 |
| executionEffort | UInt64 | min: 100 | 1000 |
| feeAmount | UFix64 | min: 0.0001 | 0.001 |
| fromToken | Enum | FlowToken/USDCFlow | - |
| toToken | Enum | FlowToken/USDCFlow | - |
| pid | UInt64 | min: 0 | - |
| transactionId | UInt64 | min: 0 | - |

## Action Requirements

Each action has defined field requirements in `param-helpers.ts`:

### sendToken
```typescript
{
  required: ['recipient', 'amount'],
  optional: ['tokenType'],
  defaults: { tokenType: 'FlowToken' }
}
```

### scheduleSendToken
```typescript
{
  required: ['recipient', 'amount', 'timestamp'],
  optional: ['tokenType', 'priority', 'executionEffort', 'feeAmount'],
  defaults: {
    tokenType: 'FlowToken',
    priority: 2,
    executionEffort: 1000,
    feeAmount: 0.001
  }
}
```

### scheduleSwapToken
```typescript
{
  required: ['fromToken', 'toToken', 'amount', 'timestamp'],
  optional: ['priority', 'executionEffort', 'feeAmount'],
  defaults: {
    priority: 2,
    executionEffort: 1000,
    feeAmount: 0.001
  }
}
```

### swapTokens
```typescript
{
  required: ['amount'],
  optional: [],
  defaults: {}
}
```

### cancelScheduledAction
```typescript
{
  required: ['transactionId'],
  optional: [],
  defaults: {}
}
```

### claimAndRestake
```typescript
{
  required: ['pid'],
  optional: [],
  defaults: {}
}
```

### setupFlowMateActions
```typescript
{
  required: [],
  optional: [],
  defaults: {}
}
```

## Example Flows

### Example 1: Incomplete Send Request

**User:** "Send FLOW to Bob"

**AI Response:**
```json
{
  "action": "sendToken",
  "actionLabel": "Send Tokens",
  "reason": "To send FLOW tokens, I need Bob's wallet address and the amount",
  "missing": [
    {
      "id": "recipient",
      "label": "Recipient Address (Bob)",
      "type": "Address",
      "required": true,
      "description": "Bob's Flow wallet address",
      "placeholder": "0x1234567890abcdef",
      "validation": { "pattern": "^(0x)?[a-fA-F0-9]{16}$" }
    },
    {
      "id": "amount",
      "label": "Amount",
      "type": "UFix64",
      "required": true,
      "description": "Amount of FLOW to send",
      "placeholder": "10.0",
      "validation": { "min": 0.00000001 }
    }
  ],
  "known": { "tokenType": "FlowToken" }
}
```

**Form Rendered:** Two input fields for address and amount

**User Fills:**
- Recipient: `0x1234567890abcdef`
- Amount: `25.5`

**Submitted Back:**
```json
{
  "recipient": "0x1234567890abcdef",
  "amount": 25.5
}
```

**AI Continues:** Calls `sendToken` with complete parameters

### Example 2: Partial Schedule Request

**User:** "Schedule swap 5 FLOW tomorrow"

**AI Response:**
```json
{
  "action": "scheduleSwapToken",
  "actionLabel": "Schedule Token Swap",
  "reason": "To schedule the swap, I need to know which token to swap to and the exact time",
  "missing": [
    {
      "id": "toToken",
      "label": "To Token",
      "type": "Enum",
      "required": true,
      "enumOptions": ["FlowToken", "USDCFlow"],
      "description": "Token to receive"
    },
    {
      "id": "timestamp",
      "label": "Execution Time",
      "type": "Timestamp",
      "required": true,
      "description": "Exact time for swap (provide timezone for 'tomorrow')",
      "placeholder": "e.g., 1234567890 or 'tomorrow 3pm EST'"
    }
  ],
  "known": {
    "fromToken": "FlowToken",
    "amount": 5
  }
}
```

**Form Rendered:** Select dropdown and timestamp input

**User Fills:**
- To Token: `USDCFlow`
- Execution Time: User enters "3pm EST", AI converts to Unix timestamp

**AI Continues:** Calls `scheduleSwapToken` with all parameters

## Validation

### Client-Side Validation
The `ParamRequestForm` component validates:
- **Required fields** - Cannot be empty
- **Regex patterns** - For Address and custom formats
- **Numeric ranges** - Min/max values for numbers
- **Type conversion** - Strings to numbers where needed

### Error Messages
- Required field missing: `"[Field Label] is required"`
- Below minimum: `"[Field Label] must be at least [min]"`
- Above maximum: `"[Field Label] must be at most [max]"`
- Invalid format: `"[Field Label] format is invalid"`

### Server-Side Validation
The transaction tools validate with Zod schemas before generating transactions.

## Benefits

1. **Better UX** - Forms are clearer than conversational back-and-forth
2. **Type Safety** - Structured fields prevent invalid input
3. **Validation** - Real-time feedback on errors
4. **Defaults** - Smart pre-filling reduces user effort
5. **Consistency** - Same fields always look the same
6. **Extensibility** - Easy to add new fields or actions

## Adding New Fields

1. **Define the field in `param-requests.ts`:**
```typescript
export const commonFields = {
  // ... existing fields
  myNewField: {
    id: 'myNewField',
    label: 'My New Field',
    type: 'String' as FieldType,
    required: true,
    description: 'What this field is for',
    placeholder: 'example value',
  },
};
```

2. **Add to action requirements in `param-helpers.ts`:**
```typescript
export const actionFieldRequirements = {
  myAction: {
    required: ['myNewField'],
    optional: [],
    defaults: {},
  },
};
```

3. **AI will automatically use it** when calling `requestParameters` for that action

## Testing Checklist

- [ ] User provides all parameters → Direct transaction generation
- [ ] User provides no parameters → Form with all required fields
- [ ] User provides some parameters → Form with only missing fields
- [ ] Form validation works for all field types
- [ ] Defaults are pre-filled correctly
- [ ] Known values are shown but not editable
- [ ] Submitted values are sent back as JSON
- [ ] AI proceeds to transaction tool after form submission
- [ ] Enum fields show correct options
- [ ] Number fields enforce min/max
- [ ] Address fields validate format
- [ ] Error messages are clear and helpful

