import { tool } from 'ai';
import * as fs from 'fs';
import * as path from 'path';
import {
  sendTokenSchema,
  scheduleSendTokenSchema,
  scheduleSwapTokenSchema,
  setupFlowMateActionsSchema,
  cancelScheduledActionSchema,
  claimAndRestakeSchema,
  swapperActionSchema,
  type SendTokenParams,
  type ScheduleSendTokenParams,
  type ScheduleSwapTokenParams,
  type SetupFlowMateActionsParams,
  type CancelScheduledActionParams,
  type ClaimAndRestakeParams,
  type SwapperActionParams,
} from '../schemas/transactions';
import { templateTransactionWithLogging } from '../lib/template-transaction';
import { FlowNetwork } from '../lib/contract-addresses';

// Transaction payload type
export interface TransactionPayload {
  name: string;
  codePath: string;
  code: string;
  args?: Array<{ name: string; type: string; value: unknown }>;
  description: string;
}

// Helper to read transaction file
function readTransactionFile(filename: string): string {
  const contractsPath = path.join(process.cwd(), '..', 'contracts', 'cadence', 'transactions', filename);
  return fs.readFileSync(contractsPath, 'utf-8');
}

// Helper to template a transaction with contract addresses
function readAndTemplateTransaction(filename: string, network: FlowNetwork = 'testnet'): string {
  const rawCode = readTransactionFile(filename);
  return templateTransactionWithLogging(rawCode, network, filename);
}

// Helper to map Cadence types
function getCadenceType(value: unknown): string {
  if (typeof value === 'string') {
    if (value.match(/^(0x)?[a-fA-F0-9]{16}$/)) return 'Address';
    return 'String';
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return 'UInt64';
    return 'UFix64';
  }
  if (typeof value === 'boolean') return 'Bool';
  return 'String';
}

// Helper to format numbers as UFix64 strings (must have decimal point)
function toUFix64String(value: number): string {
  const str = value.toString();
  // If the string doesn't contain a decimal point, add .0
  return str.includes('.') ? str : `${str}.0`;
}

// Network context that will be set by the API route
let currentNetwork: FlowNetwork = 'testnet';

export function setFlowTransactionNetwork(network: FlowNetwork) {
  currentNetwork = network;
}

/**
 * SendToken Tool
 */
export const sendTokenTool = tool({
  description: 'Send FLOW or USDC tokens to a recipient address. Use this when the user wants to transfer tokens immediately.',
  inputSchema: sendTokenSchema,
  execute: async (params: SendTokenParams) => {
    const code = readAndTemplateTransaction('SendToken.cdc', currentNetwork);
    
    return {
      name: 'Send Tokens',
      codePath: 'contracts/cadence/transactions/SendToken.cdc',
      code,
      args: [
        { name: 'recipient', type: 'Address', value: params.recipient },
        { name: 'amount', type: 'UFix64', value: toUFix64String(params.amount) },
        { name: 'tokenType', type: 'String', value: params.tokenType },
      ],
      description: `Send ${params.amount} ${params.tokenType} to ${params.recipient}`,
    };
  },
});

/**
 * ScheduleSendToken Tool
 */
export const scheduleSendTokenTool = tool({
  description: 'Schedule a token send for future execution. Use this when the user wants to send tokens at a specific time in the future.',
  inputSchema: scheduleSendTokenSchema,
  execute: async (params: ScheduleSendTokenParams) => {
    const code = readAndTemplateTransaction('ScheduleSendToken.cdc', currentNetwork);
    
    const date = new Date(params.timestamp * 1000);
    const formattedDate = date.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
    
    return {
      name: 'Schedule Token Send',
      codePath: 'contracts/cadence/transactions/ScheduleSendToken.cdc',
      code,
      args: [
        { name: 'recipient', type: 'Address', value: params.recipient },
        { name: 'amount', type: 'UFix64', value: toUFix64String(params.amount) },
        { name: 'timestamp', type: 'UFix64', value: toUFix64String(params.timestamp) },
        { name: 'priority', type: 'UInt8', value: params.priority.toString() },
        { name: 'executionEffort', type: 'UInt64', value: params.executionEffort.toString() },
        { name: 'feeAmount', type: 'UFix64', value: toUFix64String(params.feeAmount) },
        { name: 'tokenType', type: 'String', value: params.tokenType },
      ],
      description: `Schedule sending ${params.amount} ${params.tokenType} to ${params.recipient} on ${formattedDate}`,
    };
  },
});

/**
 * ScheduleSwapToken Tool
 */
export const scheduleSwapTokenTool = tool({
  description: 'Schedule a token swap for future execution. Use this when the user wants to swap tokens at a specific time.',
  inputSchema: scheduleSwapTokenSchema,
  execute: async (params: ScheduleSwapTokenParams) => {
    const code = readAndTemplateTransaction('ScheduleSwapToken.cdc', currentNetwork);
    
    const date = new Date(params.timestamp * 1000);
    const formattedDate = date.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
    
    return {
      name: 'Schedule Token Swap',
      codePath: 'contracts/cadence/transactions/ScheduleSwapToken.cdc',
      code,
      args: [
        { name: 'fromToken', type: 'String', value: params.fromToken },
        { name: 'toToken', type: 'String', value: params.toToken },
        { name: 'amount', type: 'UFix64', value: toUFix64String(params.amount) },
        { name: 'timestamp', type: 'UFix64', value: toUFix64String(params.timestamp) },
        { name: 'priority', type: 'UInt8', value: params.priority.toString() },
        { name: 'executionEffort', type: 'UInt64', value: params.executionEffort.toString() },
        { name: 'feeAmount', type: 'UFix64', value: toUFix64String(params.feeAmount) },
      ],
      description: `Schedule swapping ${params.amount} ${params.fromToken} to ${params.toToken} on ${formattedDate}`,
    };
  },
});

/**
 * SetupFlowMateActions Tool
 */
export const setupFlowMateActionsTool = tool({
  description: 'Setup the FlowMate action handler. This must be run once before scheduling any actions. Use this when the user needs to initialize their account for scheduled transactions.',
  inputSchema: setupFlowMateActionsSchema,
  execute: async (params: SetupFlowMateActionsParams) => {
    const code = readAndTemplateTransaction('SetupFlowMateActions.cdc', currentNetwork);
    
    return {
      name: 'Setup FlowMate Actions',
      codePath: 'contracts/cadence/transactions/SetupFlowMateActions.cdc',
      code,
      args: [],
      description: 'Initialize your account for scheduled transactions and automated actions',
    };
  },
});

/**
 * CancelScheduledAction Tool
 */
export const cancelScheduledActionTool = tool({
  description: 'Cancel a previously scheduled transaction. Use this when the user wants to cancel a pending scheduled action.',
  inputSchema: cancelScheduledActionSchema,
  execute: async (params: CancelScheduledActionParams) => {
    const code = readAndTemplateTransaction('CancelScheduledAction.cdc', currentNetwork);
    
    return {
      name: 'Cancel Scheduled Action',
      codePath: 'contracts/cadence/transactions/CancelScheduledAction.cdc',
      code,
      args: [
        { name: 'transactionId', type: 'UInt64', value: params.transactionId.toString() },
      ],
      description: `Cancel scheduled transaction with ID ${params.transactionId}`,
    };
  },
});

/**
 * ClaimAndRestake Tool
 */
export const claimAndRestakeTool = tool({
  description: 'Claim staking rewards and automatically restake them in the same pool. Use this when the user wants to compound their staking rewards.',
  inputSchema: claimAndRestakeSchema,
  execute: async (params: ClaimAndRestakeParams) => {
    const code = readAndTemplateTransaction('ClaimAndRestake.cdc', currentNetwork);
    
    return {
      name: 'Claim and Restake',
      codePath: 'contracts/cadence/transactions/ClaimAndRestake.cdc',
      code,
      args: [
        { name: 'pid', type: 'UInt64', value: params.pid.toString() },
      ],
      description: `Claim and restake rewards from pool ${params.pid}`,
    };
  },
});

/**
 * SwapperAction Tool
 */
export const swapperTokensTool = tool({
  description: 'Execute an immediate token swap between FlowToken and USDCFlow tokens. Use this when the user wants to swap tokens now.',
  inputSchema: swapperActionSchema,
  execute: async (params: SwapperActionParams) => {
    const code = readAndTemplateTransaction('SwapperAction.cdc', currentNetwork);
    
    return {
      name: 'Swap Tokens',
      codePath: 'contracts/cadence/transactions/SwapperAction.cdc',
      code,
      args: [
        { name: 'amount', type: 'UFix64', value: toUFix64String(params.amount) },
        { name: 'fromToken', type: 'String', value: params.fromToken },
        { name: 'toToken', type: 'String', value: params.toToken },
      ],
      description: `Swap ${params.amount} ${params.fromToken} to ${params.toToken}`,
    };
  },
});

// Export all tools
export const flowTransactionTools = {
  sendToken: sendTokenTool,
  scheduleSendToken: scheduleSendTokenTool,
  scheduleSwapToken: scheduleSwapTokenTool,
  setupFlowMateActions: setupFlowMateActionsTool,
  cancelScheduledAction: cancelScheduledActionTool,
  claimAndRestake: claimAndRestakeTool,
  swapTokens: swapperTokensTool,
};

