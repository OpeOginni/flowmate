"use client"

import React, { useState } from "react"
import { SendIcon, Mic, StopCircle, LoaderCircle, Bot, User} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "./ui/input-group"
import ParamRequestForm from './ParamRequestForm'
import TimestampDisplay from './TimestampDisplay'
import SetupStatusDisplay from './SetupStatusDisplay'
import BalanceDisplay from './BalanceDisplay'
import TransactionDisplay from './TransactionDisplay'
import LoadingDisplay from './LoadingDisplay'
import type { ChatMessage } from '@/app/api/chat/route'
import type { ParamRequest } from '@/server/schemas/param-requests'
import { toast } from "sonner"
import { GetUserBalanceParams } from "@/server/schemas/scripts"
import { extractTimeInstruction, calculateFutureTimestamp } from '@/lib/timestamp-utils';

// Transaction tool names for display handling
const TRANSACTION_TOOL_NAMES = ['scheduleSendToken', 'scheduleSwapToken', 'sendToken', 'swapTokens', 'setupFlowMateActions', 'cancelScheduledAction', 'claimAndRestake'];

// ChatInterface component - only renders when user is authenticated
function ChatInterface({
  user,
  currentNetwork,
  completedTransactions,
  setSelectedTransaction,
  setCompletedTransactions
}: {
  user: any;
  currentNetwork: string;
  completedTransactions: Record<string, string>;
  setSelectedTransaction: (tx: any) => void;
  setCompletedTransactions: (txs: Record<string, string>) => void;
}) {
  const [input, setInput] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)

  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording
  } = useAudioRecorder()

  // Initialize chat with useChat hook
  const { messages, sendMessage } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        walletAddress: user.addr,
        network: currentNetwork,
      },
    }),
    onError: (error) => {
      console.error('Chat error:', error)
      toast.error('Failed to send message. Please try again.')
    }
  })

  const isLoading = messages.length > 0 && messages[messages.length - 1]?.role === 'user'

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording()
      if (!audioBlob || !user?.addr) return

      setIsTranscribing(true)
      try {
        // Create form data with audio and wallet info
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')
        formData.append('walletAddress', user.addr)

        // Send to transcription API
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (data.success) {
          setInput(data.text)
        } else {
          console.error('Transcription failed:', data.error)
          alert(data.error || 'Failed to transcribe audio')
        }
      } catch (error) {
        console.error('Error transcribing audio:', error)
        alert('Failed to transcribe audio. Please try again.')
      } finally {
        setIsTranscribing(false)
      }
    } else {
      // Start recording
      await startRecording()
    }
  }

  const handleSubmit = () => {
    if(input.length === 0) {
      handleVoiceInput()
    } else {
      // Send message to AI assistant
      sendMessage({ text: input })
      setInput("")
    }
  }

  const getButtonIcon = () => {
    if (isTranscribing) {
      return <LoaderCircle className="w-5 h-5 animate-spin" />
    }
    if (isRecording) {
      return <StopCircle className="w-5 h-5 text-red-500" />
    }
    if (input.length > 0) {
      return <SendIcon className="w-5 h-5" />
    }
    return <Mic className="w-5 h-5" />
  }

  const getTooltipText = () => {
    if (isTranscribing) return "Transcribing..."
    if (isRecording) return `Stop recording (${recordingTime}s)`
    if (input.length > 0) return "Send message"
    return "Start voice input"
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex flex-col w-full max-w-4xl mx-auto px-4 py-6 h-full">
          {/* Hero Section - Only show when no messages */}
          {!hasMessages && (
            <div className="flex flex-col items-center text-center space-y-8 mb-12 flex-shrink-0">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                  say hey to your
                </h1>
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-primary">
                  Flow Mate
                </h1>
              </div>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Automate your Flow blockchain actions with ease. Schedule transactions,
                manage DeFi activities, and take control of your crypto workflow.
              </p>
            </div>
          )}

          {/* Messages Display */}
          {hasMessages && (
            <div className="flex-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-6 py-6 space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className="w-full">
                      {message.parts.map((part, i) => {
                        if (part.type === 'text') {
                          return (
                            <div
                              key={`${message.id}-text-${i}`}
                              className={`flex gap-3 ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {message.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div
                                className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                                  message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{part.text}</p>
                              </div>
                              {message.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Handle tool call results
                        if (part.type.startsWith('tool-')) {
                          const toolName = part.type.replace('tool-', '');
                          const toolPart = part as any; // Type assertion for tool parts

                          // Handle parameter request form
                          if (toolName === 'requestParameters') {
                            // Extract the parameter request from the tool result
                            const paramRequest = toolPart.output as ParamRequest;

                            // Show loading state if output not ready yet
                            if (!paramRequest || !toolPart.output) {
                              return (
                                <div key={`${message.id}-tool-${i}`} className="flex justify-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="max-w-[80%]">
                                    <LoadingDisplay message="Preparing form…" />
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div key={`${message.id}-tool-${i}`} className="flex justify-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="max-w-[80%]">
                                  <ParamRequestForm
                                    request={paramRequest}
                                    onSubmit={(values) => {
                                      // Send the collected parameters back to the AI
                                      const paramsJson = JSON.stringify(values, null, 2);
                                      sendMessage({
                                        text: `Here are the parameters you requested for ${paramRequest.actionLabel}:\n\`\`\`json\n${paramsJson}\n\`\`\``
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }

                          // Handle getCurrentTimestampTool results
                          if (toolName === 'getCurrentTimestampTool') {
                            const toolOutput = toolPart.output as { timestamp?: number; description?: string };

                            if (!toolPart.output) {
                              return (
                                <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-4">
                                  <LoadingDisplay message="Getting current timestamp…" />
                                </div>
                              );
                            }

                            // Extract user instruction from the conversation
                            const userMessage = messages
                              .slice()
                              .reverse()
                              .find(m => m.role === 'user');
                            
                            const userText = userMessage?.parts.find(p => p.type === 'text')?.text || '';
                            const timeInstruction = extractTimeInstruction(userText);

                            // Calculate timestamp if we have instruction
                            const currentTimestamp = toolOutput.timestamp || 0;
                            const calculatedTimestamp = timeInstruction && currentTimestamp
                              ? calculateFutureTimestamp(currentTimestamp, timeInstruction)
                              : undefined;

                            return (
                              <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-4">
                                <TimestampDisplay
                                  currentTimestamp={currentTimestamp}
                                  userInstruction={timeInstruction}
                                  calculatedTimestamp={calculatedTimestamp}
                                />
                              </div>
                            );
                          }

                          // Handle setup status check
                          if (toolName === 'checkSetupStatusTool') {
                            const toolOutput = toolPart.output as { isSetup?: boolean; hasManager?: boolean; hasHandler?: boolean };

                            return (
                              <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-4">
                                <SetupStatusDisplay
                                  isSetup={toolOutput.isSetup || false}
                                  isLoading={!toolPart.output}
                                />
                              </div>
                            );
                          }

                          if (toolName === 'getUserBalanceTool') {
                            const toolInput = toolPart.input as GetUserBalanceParams;
                            const toolOutput = toolPart.output as { balance?: string };

                            return (
                              <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-4">
                                <BalanceDisplay
                                  tokenType={toolInput?.tokenType || ''}
                                  balance={toolOutput?.balance}
                                  walletAddress={user?.addr}
                                  isLoading={!toolPart.input || !toolPart.output}
                                />
                              </div>
                            );
                          }

                          // Handle transaction tool results (default case for any transaction tool)
                          if (TRANSACTION_TOOL_NAMES.includes(toolName)) {
                            const txKey = `${message.id}-${i}`;
                            const txId = completedTransactions[txKey];

                            return (
                              <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-6">
                                <TransactionDisplay
                                  txId={txId}
                                  onReviewClick={() => {
                                    const rawData = toolPart.result || toolPart;
                                    const txData = rawData.output || rawData;
                                    setSelectedTransaction({ ...txData, _key: txKey });
                                  }}
                                />
                              </div>
                            );
                          }
                        }

                        // If part is not text and not a tool, return null
                        return null;
                      })}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Input Area */}
          <div className={`w-full flex-shrink-0 ${hasMessages ? 'mt-4' : ''}`}>
            <form className="flex w-full items-center gap-2" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <InputGroup className={`h-14 rounded-3xl border-2 shadow-lg hover:shadow-xl transition-all bg-white dark:bg-gray-800 ${
                isRecording ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300 dark:border-gray-600'
              }`}>
                <InputGroupInput
                  value={isRecording ? `Recording... ${recordingTime}s` : input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isTranscribing ? "Transcribing..." : "Talk to your Flow Mate..."}
                  className="text-base px-6 placeholder:text-muted-foreground/60"
                  disabled={isRecording || isTranscribing || isLoading}
                />
                <InputGroupAddon align="inline-end" className="pr-3.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InputGroupButton
                        variant={input.length > 0 || isRecording ? "default" : "secondary"}
                        size="icon-sm"
                        onClick={handleSubmit}
                        disabled={isTranscribing || isLoading}
                        className="rounded-full h-10 w-10"
                      >
                        {getButtonIcon()}
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      <p>{getTooltipText()}</p>
                    </TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatInterface
