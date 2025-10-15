import { z } from 'zod';

// Flow address validation
const flowAddressSchema = z.string().regex(/^(0x)?[a-fA-F0-9]{16}$/, 'Invalid Flow address format');

// Token type enum
const tokenTypeSchema = z.enum(['FlowToken', 'USDCFlow']).describe('Token type to use');

// Priority enum (0-4)
const prioritySchema = z.number().int().min(0).max(4).default(2).describe('Transaction priority (0=Low, 1=Below, 2=Medium, 3=Above, 4=High)');

/**
 * SendToken - Send tokens to a recipient
 */
export const sendTokenSchema = z.object({
  recipient: flowAddressSchema.describe('Flow address of the recipient'),
  amount: z.number().positive().describe('Amount of tokens to send'),
  tokenType: tokenTypeSchema.describe('Type of token to send (FlowToken or USDCFlow)'),
});

/**
 * ScheduleSendToken - Schedule a token send for future execution
 */
export const scheduleSendTokenSchema = z.object({
  recipient: flowAddressSchema.describe('Flow address of the recipient'),
  amount: z.number().positive().describe('Amount of tokens to send'),
  timestamp: z.number().positive().describe('Unix timestamp (in seconds) when to execute the transaction'),
  priority: prioritySchema,
  executionEffort: z.number().int().positive().default(1000).describe('Execution effort (gas limit)'),
  feeAmount: z.number().positive().default(0.001).describe('Fee amount in FLOW tokens'),
  tokenType: tokenTypeSchema.describe('Type of token to send (FlowToken or USDCFlow)'),
});

/**
 * ScheduleSwapToken - Schedule a token swap for future execution
 */
export const scheduleSwapTokenSchema = z.object({
  fromToken: tokenTypeSchema.describe('Token to swap from (FlowToken or USDCFlow)'),
  toToken: tokenTypeSchema.describe('Token to swap to (FlowToken or USDCFlow)'),
  amount: z.number().positive().describe('Amount of tokens to swap'),
  timestamp: z.number().positive().describe('Unix timestamp (in seconds) when to execute the swap'),
  priority: prioritySchema,
  executionEffort: z.number().int().positive().default(1000).describe('Execution effort (gas limit)'),
  feeAmount: z.number().positive().default(0.001).describe('Fee amount in FLOW tokens'),
});

/**
 * SetupFlowMateActions - Setup FlowMate action handler (no parameters)
 */
export const setupFlowMateActionsSchema = z.object({});

/**
 * CancelScheduledAction - Cancel a scheduled transaction
 */
export const cancelScheduledActionSchema = z.object({
  transactionId: z.number().int().positive().describe('ID of the scheduled transaction to cancel'),
});

/**
 * ClaimAndRestake - Claim rewards and restake in a pool
 */
export const claimAndRestakeSchema = z.object({
  pid: z.number().int().nonnegative().describe('Pool ID to claim and restake rewards from'),
});

/**
 * SwapperAction - Execute a token swap (Flow -> USDCFlow)
 * Note: This transaction has hardcoded values, but we expose them for potential future customization
 */
export const swapperActionSchema = z.object({
  amount: z.number().positive().default(5.0).describe('Amount of FLOW tokens to swap (currently hardcoded to 5.0)'),
});

/**
 * FlashLoanAndSwap - Execute flash loan arbitrage (currently commented out in contract)
 */
export const flashLoanAndSwapSchema = z.object({
  flashLoanAmount: z.number().positive().describe('Amount to flash loan'),
  pairAddress: flowAddressSchema.describe('Address of the pair contract'),
});

// Export type inference helpers
export type SendTokenParams = z.infer<typeof sendTokenSchema>;
export type ScheduleSendTokenParams = z.infer<typeof scheduleSendTokenSchema>;
export type ScheduleSwapTokenParams = z.infer<typeof scheduleSwapTokenSchema>;
export type SetupFlowMateActionsParams = z.infer<typeof setupFlowMateActionsSchema>;
export type CancelScheduledActionParams = z.infer<typeof cancelScheduledActionSchema>;
export type ClaimAndRestakeParams = z.infer<typeof claimAndRestakeSchema>;
export type SwapperActionParams = z.infer<typeof swapperActionSchema>;
export type FlashLoanAndSwapParams = z.infer<typeof flashLoanAndSwapSchema>;

