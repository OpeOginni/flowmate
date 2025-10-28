"use client"

import React, { useState, createElement } from "react"
import { AudioLinesIcon, SendIcon, Mic, StopCircle, LoaderCircle, Bot, User, ExternalLink, Wallet, DollarSign } from "lucide-react"
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
import TransactionConfirmation from './TransactionConfirmation'
import ParamRequestForm from './ParamRequestForm'
import { Connect, TransactionLink } from "@onflow/react-sdk"
import type { ChatMessage } from '@/app/api/chat/route'
import type { ParamRequest } from '@/server/schemas/param-requests'
import { toast } from "sonner"
import { GetUserBalanceParams } from "@/server/schemas/scripts"

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
                                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                                    <div className="flex gap-2 items-center">
                                      <LoaderCircle className="w-4 h-4 animate-spin text-blue-500" />
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Preparing form...</p>
                                    </div>
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

                          // Handle setup status check
                          if (toolName === 'checkSetupStatusTool') {
                            const toolOutput = toolPart.output as { isSetup?: boolean; hasManager?: boolean; hasHandler?: boolean };

                            if (!toolPart.output) {
                              return (
                                <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-4">
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-6 max-w-md w-full shadow-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
                                        <LoaderCircle className="w-5 h-5 animate-spin text-purple-600" />
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Checking setup status…</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            const isSetup = toolOutput.isSetup || false;
                            const statusIcon = isSetup ? '✅' : '⚠️';
                            const statusColor = isSetup ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20';
                            const borderColor = isSetup ? 'border-green-400 dark:border-green-600' : 'border-orange-400 dark:border-orange-600';

                            return (
                              <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-4">
                                <div className={`bg-gradient-to-r ${statusColor} border-2 ${borderColor} rounded-2xl p-6 max-w-md w-full shadow-lg`}>
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="text-4xl">{statusIcon}</div>
                                    <div className="text-center">
                                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        Setup Status
                                      </h3>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {isSetup 
                                          ? 'Your account is ready for scheduled transactions!'
                                          : 'Setup required for scheduled transactions'
                                        }
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (toolName === 'getUserBalanceTool') {
                            // Extract the balance data from the tool result
                            const toolInput = toolPart.input as GetUserBalanceParams;
                            const toolOutput = toolPart.output as { balance?: string };

                            if (!toolPart.input || !toolPart.output) {
                              return (
                                <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-4">
                                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-6 max-w-md w-full shadow-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
                                        <LoaderCircle className="w-5 h-5 animate-spin text-blue-600" />
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">Fetching balance…</p>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="h-8 w-36 bg-blue-100/60 dark:bg-blue-900/40 rounded animate-pulse" />
                                      <div className="h-4 w-20 bg-blue-100/60 dark:bg-blue-900/40 rounded animate-pulse" />
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // Format balance with proper decimals
                            const formatBalance = (balance: any, tokenType: string) => {
                              const balanceStr = balance.toString();
                              if (tokenType === 'FlowToken') {
                                // Flow tokens typically have 8 decimals
                                return balanceStr.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 3
                                });
                              } else if (tokenType === 'USDCFlow') {
                                // USDC typically has 6 decimals
                                return balanceStr.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 3
                                });
                              } else if (tokenType === 'stFlowToken') {
                                // stFlowToken typically has 8 decimals
                                return balanceStr.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 3
                                });
                              }
                              return balanceStr;
                            };



                            const tokenIcon = toolInput.tokenType === 'FlowToken' ? <img src="/flow.svg" alt="Flow Logo" className="w-6 h-6" /> : toolInput.tokenType === 'USDCFlow' ? <img src="/usdc_flow.svg" alt="USDC Logo" className="w-6 h-6" /> : <img src="/stflow.svg" alt="stFLOW Logo" className="w-6 h-6" />;
                            const tokenColor = toolInput.tokenType === 'FlowToken' ? 'text-green-600' : 'text-blue-600';
                            const cardGradient = toolInput.tokenType === 'FlowToken'
                              ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' :'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20';
                            const borderColor = toolInput.tokenType === 'FlowToken'
                              ? 'border-green-400 dark:border-green-600'
                              : 'border-blue-400 dark:border-blue-600';

                            return (
                              <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-4">
                                <div className={`bg-gradient-to-r ${cardGradient} border-2 ${borderColor} rounded-2xl p-6 max-w-md w-full shadow-lg`}>
                                  <div className="flex flex-col items-center gap-4">
                                    {/* Icon and Title */}
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md ${tokenColor}`}>
                                          {tokenIcon}
                                      </div>
                                      <div className="text-center">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                          {toolInput.tokenType === 'FlowToken' ? 'FLOW' : toolInput.tokenType === 'USDCFlow' ? 'USDC' : 'stFLOW'} Balance
                                        </h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          Wallet: {user?.addr?.slice(0, 6)}...{user?.addr?.slice(-4)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Balance Display */}
                                    {toolOutput.balance && (
                                      <div className="text-center">
                                        <div className={`text-3xl font-bold ${tokenColor} mb-1`}>
                                          {Number(toolOutput.balance).toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 3
                                          })}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                          {toolInput.tokenType === 'FlowToken' ? 'FLOW' : 'USDC'}
                                        </div>
                                      </div>
                                    )}

                                    {/* Additional Info */}
                                    <div className="w-full pt-2 border-t border-gray-200 dark:border-gray-700">
                                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                        Real-time balance from Flow blockchain
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // Handle transaction tool results
                          const txKey = `${message.id}-${i}`;
                          const txId = completedTransactions[txKey];

                          return (
                            <div key={`${message.id}-tool-${i}`} className="flex justify-center w-full my-6">
                              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-400 dark:border-green-600 rounded-2xl p-6 max-w-md w-full shadow-lg">
                                {txId ? (
                                  // Show transaction link if completed
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="text-center">
                                      <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                                        ✅ Transaction Sent Successfully!
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        View your transaction on the blockchain
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <TransactionLink txId={txId} variant='primary' />
                                    </div>
                                  </div>
                                ) : (
                                  // Show sign button if not completed
                                  <>
                                    <button
                                      onClick={() => {
                                        // Extract the actual transaction data from the tool call result
                                        // The structure is: { output: { name, code, args, ... } }
                                        const rawData = toolPart.result || toolPart;
                                        const txData = rawData.output || rawData;

                                        setSelectedTransaction({ ...txData, _key: txKey });
                                      }}
                                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-md"
                                    >
                                      🔐 Review & Sign Transaction
                                    </button>
                                    <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-3">
                                      Click to review transaction details before signing
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        }

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
