import { z } from 'zod';

const tokenTypeSchema = z.enum(['FlowToken', 'USDCFlow']).describe('Token type to use');

/**
 * GetUserBalance - Get the specific signed in user's balance of a token
 */
export const getUserBalanceSchema = z.object({
  tokenType: tokenTypeSchema.describe('Token type to get the balance of (FlowToken or USDCFlow)'),
});

export type GetUserBalanceParams = z.infer<typeof getUserBalanceSchema>;