import { NextRequest, NextResponse } from 'next/server';
import { streamText, convertToModelMessages, stepCountIs, type UIMessage, type UIDataTypes, type InferUITools } from 'ai';
import { openrouter } from '@/server/providers/openrouter';
import { flowTransactionTools, setFlowTransactionNetwork } from '@/server/tools/flow-transactions';
import { requestParametersTool } from '@/server/tools/request-params';
import type { FlowNetwork } from '@/server/lib/contract-addresses';
import { getUserBalanceTool, checkSetupStatusTool, getCurrentTimestampTool } from '@/server/tools/flow-scripts';
import { QWEN_SYSTEM_PROMPT } from '@/server/system-prompt/qwen';

// Validate Flow wallet address format
function isValidFlowAddress(address: string): boolean {
  const flowAddressRegex = /^(0x)?[a-fA-F0-9]{16}$/;
  return flowAddressRegex.test(address);
}


export type ChatTools = InferUITools<typeof flowTransactionTools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages, walletAddress, network }: { 
      messages: ChatMessage[]; 
      walletAddress: string;
      network?: FlowNetwork;
    } = await req.json();

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required. Please connect your wallet.' },
        { status: 401 }
      );
    }

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Set the Flow network for transaction templating based on user's connected network
    // Fallback to env var if not provided, then to testnet
    const userNetwork = network || (process.env.NEXT_PUBLIC_FLOW_NETWORK as FlowNetwork) || 'testnet';
    setFlowTransactionNetwork(userNetwork);
    console.log(`[Chat API] Using Flow network: ${userNetwork} (user connected: ${network || 'not specified'})`);

    // Combine all tools
    const allTools = {
      ...flowTransactionTools,
      getUserBalanceTool: getUserBalanceTool(walletAddress, userNetwork),
      checkSetupStatusTool: checkSetupStatusTool(walletAddress, userNetwork),
      getCurrentTimestampTool: getCurrentTimestampTool,
      requestParameters: requestParametersTool,
    };

    console.log('[Chat API] Registered tools:', Object.keys(allTools));

    // Stream the AI response with tools
    const result = streamText({
      // model: openrouter('qwen/qwen3-vl-8b-instruct'),
      model: openrouter('qwen/qwen3-next-80b-a3b-instruct'),
      system: QWEN_SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      tools: allTools,
      temperature: 0.7,
      maxOutputTokens: 2000,
      stopWhen: stepCountIs(4), // Limit to 4 tool calls per response as that is the max we would ever need
      onStepFinish: async (step) => {
        console.log('[Chat API] Step finished:', {
          type: step.finishReason,
          toolCalls: step.toolCalls?.map(tc => tc.toolName),
          toolResults: step.toolResults?.length,
        });
      },
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

