import { commonFields, type ParamField } from '../schemas/param-requests';

/**
 * Helper functions to generate field requirements for each action type
 */

export const actionFieldRequirements = {
  sendToken: {
    required: ['recipient', 'amount'],
    optional: ['tokenType'],
    defaults: { tokenType: 'FlowToken' },
  },
  scheduleSendToken: {
    required: ['recipient', 'amount', 'timestamp'],
    optional: ['tokenType', 'priority', 'executionEffort', 'feeAmount'],
    defaults: { 
      tokenType: 'FlowToken',
      priority: 2,
      executionEffort: 1000,
      feeAmount: 0.001,
    },
  },
  scheduleSwapToken: {
    required: ['fromToken', 'toToken', 'amount', 'timestamp'],
    optional: ['priority', 'executionEffort', 'feeAmount'],
    defaults: {
      priority: 2,
      executionEffort: 1000,
      feeAmount: 0.001,
    },
  },
  swapTokens: {
    required: ['amount'],
    optional: [],
    defaults: {},
  },
  setupFlowMateActions: {
    required: [],
    optional: [],
    defaults: {},
  },
  cancelScheduledAction: {
    required: ['transactionId'],
    optional: [],
    defaults: {},
  },
  claimAndRestake: {
    required: ['pid'],
    optional: [],
    defaults: {},
  },
};

/**
 * Get field definition by ID
 */
export function getFieldById(fieldId: string): ParamField | undefined {
  return commonFields[fieldId as keyof typeof commonFields];
}

/**
 * Get all required fields for an action
 */
export function getRequiredFieldsForAction(action: string): ParamField[] {
  const requirements = actionFieldRequirements[action as keyof typeof actionFieldRequirements];
  if (!requirements) return [];
  
  return requirements.required
    .map(fieldId => getFieldById(fieldId))
    .filter((field): field is ParamField => field !== undefined);
}

/**
 * Get all optional fields for an action
 */
export function getOptionalFieldsForAction(action: string): ParamField[] {
  const requirements = actionFieldRequirements[action as keyof typeof actionFieldRequirements];
  if (!requirements) return [];
  
  return requirements.optional
    .map(fieldId => getFieldById(fieldId))
    .filter((field): field is ParamField => field !== undefined);
}

/**
 * Get default values for an action
 */
export function getDefaultsForAction(action: string): Record<string, unknown> {
  const requirements = actionFieldRequirements[action as keyof typeof actionFieldRequirements];
  return requirements?.defaults || {};
}

/**
 * Check which required fields are missing from provided parameters
 */
export function getMissingFields(
  action: string,
  providedParams: Record<string, unknown>
): ParamField[] {
  const requiredFields = getRequiredFieldsForAction(action);
  
  return requiredFields.filter(field => {
    const value = providedParams[field.id];
    return value === undefined || value === null || value === '';
  });
}

/**
 * Get known parameters (non-missing ones)
 */
export function getKnownParams(
  action: string,
  providedParams: Record<string, unknown>
): Record<string, unknown> {
  const allFields = [
    ...getRequiredFieldsForAction(action),
    ...getOptionalFieldsForAction(action),
  ];
  
  const known: Record<string, unknown> = {};
  allFields.forEach(field => {
    const value = providedParams[field.id];
    if (value !== undefined && value !== null && value !== '') {
      known[field.id] = value;
    }
  });
  
  return known;
}

