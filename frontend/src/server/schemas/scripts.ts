import { z } from 'zod';

const tokenTypeSchema = z.enum(['FlowToken', 'USDCFlow', 'stFlowToken']).describe('Token type to use');

/**
 * GetUserBalance - Get the specific signed in user's balance of a token
 */
export const getUserBalanceSchema = z.object({
  tokenType: tokenTypeSchema.describe('Token type to get the balance of (FlowToken or USDCFlow or stFlowToken)'),
});

/**
 * CheckSetupStatus - Check if user has completed FlowMate setup (no parameters needed)
 */
export const checkSetupStatusSchema = z.object({});

/**
 * GetCurrentTimestamp - Get the current Unix timestamp in seconds (no parameters needed)
 */
export const getCurrentTimestampSchema = z.object({});

export type GetUserBalanceParams = z.infer<typeof getUserBalanceSchema>;
export type CheckSetupStatusParams = z.infer<typeof checkSetupStatusSchema>;
export type GetCurrentTimestampParams = z.infer<typeof getCurrentTimestampSchema>;
