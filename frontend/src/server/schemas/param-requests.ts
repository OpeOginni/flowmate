import { z } from 'zod';

// Field type enum
export const fieldTypeSchema = z.enum([
  'Address',
  'UFix64',
  'UInt64',
  'UInt8',
  'String',
  'Enum',
  'Timestamp',
  'Bool'
]);

export type FieldType = z.infer<typeof fieldTypeSchema>;

// Parameter field schema
export const paramFieldSchema = z.object({
  id: z.string().describe('Unique identifier for the field'),
  label: z.string().describe('User-friendly label for the field'),
  type: fieldTypeSchema.describe('Data type of the field'),
  required: z.boolean().default(true).describe('Whether this field is required'),
  description: z.string().optional().describe('Help text explaining what this field is for'),
  placeholder: z.string().optional().describe('Placeholder text for the input'),
  examples: z.array(z.string()).optional().describe('Example values'),
  enumOptions: z.array(z.string()).optional().describe('Options for Enum type fields'),
  default: z.unknown().optional().describe('Default value for the field'),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional().describe('Validation rules'),
});

export type ParamField = z.infer<typeof paramFieldSchema>;

// Parameter request schema
export const paramRequestSchema = z.object({
  action: z.string().describe('The action being requested (e.g., sendToken, scheduleSwap)'),
  actionLabel: z.string().describe('User-friendly name for the action'),
  reason: z.string().describe('Brief explanation of why these parameters are needed'),
  missing: z.array(paramFieldSchema).describe('List of missing required fields'),
  known: z.record(z.string(), z.unknown()).optional().describe('Fields that are already known'),
  constraints: z.record(z.string(), z.unknown()).optional().describe('Any constraints or special requirements'),
});

export type ParamRequest = z.infer<typeof paramRequestSchema>;

// Common field definitions
export const commonFields = {
  recipient: {
    id: 'recipient',
    label: 'Recipient Address',
    type: 'Address' as FieldType,
    required: true,
    description: 'Flow wallet address of the recipient',
    placeholder: '0x1234567890abcdef',
    examples: ['0x1234567890abcdef'],
    validation: {
      pattern: '^(0x)?[a-fA-F0-9]{16}$',
    },
  },
  amount: {
    id: 'amount',
    label: 'Amount',
    type: 'UFix64' as FieldType,
    required: true,
    description: 'Amount of tokens to send',
    placeholder: '10.0',
    examples: ['10.0', '5.5', '100'],
    validation: {
      min: 0.00000001,
    },
  },
  tokenType: {
    id: 'tokenType',
    label: 'Token Type',
    type: 'Enum' as FieldType,
    required: true,
    description: 'Type of token to use',
    enumOptions: ['FlowToken', 'USDCFlow', 'stFlowToken'],
    default: 'FlowToken',
  },
  timestamp: {
    id: 'timestamp',
    label: 'Execution Time',
    type: 'Timestamp' as FieldType,
    required: true,
    description: 'When to execute the transaction (Unix timestamp in seconds)',
    placeholder: 'e.g., "tomorrow at 3pm" or specific timestamp',
  },
  priority: {
    id: 'priority',
    label: 'Priority',
    type: 'UInt8' as FieldType,
    required: false,
    description: 'Transaction priority (0=Low, 1=Below, 2=Medium, 3=Above, 4=High)',
    default: 2,
    validation: {
      min: 0,
      max: 4,
    },
  },
  executionEffort: {
    id: 'executionEffort',
    label: 'Execution Effort',
    type: 'UInt64' as FieldType,
    required: false,
    description: 'Gas limit for transaction execution',
    default: 1000,
    validation: {
      min: 100,
    },
  },
  feeAmount: {
    id: 'feeAmount',
    label: 'Fee Amount',
    type: 'UFix64' as FieldType,
    required: false,
    description: 'Fee amount in FLOW tokens',
    default: 0.001,
    validation: {
      min: 0.0001,
    },
  },
  fromToken: {
    id: 'fromToken',
    label: 'From Token',
    type: 'Enum' as FieldType,
    required: true,
    description: 'Token to swap from',
    enumOptions: ['FlowToken', 'USDCFlow', 'stFlowToken'],
  },
  toToken: {
    id: 'toToken',
    label: 'To Token',
    type: 'Enum' as FieldType,
    required: true,
    description: 'Token to swap to',
    enumOptions: ['FlowToken', 'USDCFlow', 'stFlowToken'],
  },
  pid: {
    id: 'pid',
    label: 'Pool ID',
    type: 'UInt64' as FieldType,
    required: true,
    description: 'ID of the staking pool',
    placeholder: '0',
    validation: {
      min: 0,
    },
  },
  transactionId: {
    id: 'transactionId',
    label: 'Transaction ID',
    type: 'UInt64' as FieldType,
    required: true,
    description: 'ID of the scheduled transaction to cancel',
    placeholder: '123',
    validation: {
      min: 0,
    },
  },
};

