import { tool } from 'ai';
import { paramRequestSchema, type ParamRequest } from '../schemas/param-requests';

/**
 * Request Parameters Tool
 * 
 * This tool is called when the user's request lacks required parameters.
 * It returns a structured request for missing information that the frontend
 * can render as a form.
 */
// @ts-ignore - AI SDK tool type inference issue
export const requestParametersTool = tool({
  description: `Request missing parameters from the user in a structured way. 
    Use this tool when you need to collect specific information before executing an action.
    This will display a form to the user with the exact fields needed.
    
    IMPORTANT: Only call this when you have incomplete information. If the user provides
    all required parameters, proceed directly to the appropriate transaction tool.`,
  
  inputSchema: paramRequestSchema,
  
  execute: async (params: ParamRequest): Promise<ParamRequest> => {
    // This tool simply validates and echoes the structure
    // The actual work happens in the frontend when it renders the form
    return params;
  },
});

