"use client"

import { LoaderCircle } from "lucide-react";
import { GetUserBalanceParams } from "@/server/schemas/scripts";

interface BalanceDisplayProps {
  tokenType: string;
  balance?: string;
  walletAddress?: string;
  isLoading?: boolean;
}

export default function BalanceDisplay({
  tokenType,
  balance,
  walletAddress,
  isLoading = false,
}: BalanceDisplayProps) {
  if (isLoading || !balance) {
    return (
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
    );
  }

  const tokenIcon = tokenType === 'FlowToken' 
    ? <img src="/flow.svg" alt="Flow Logo" className="w-6 h-6" /> 
    : tokenType === 'USDCFlow' 
    ? <img src="/usdc_flow.svg" alt="USDC Logo" className="w-6 h-6" /> 
    : <img src="/stflow.svg" alt="stFLOW Logo" className="w-6 h-6" />;
  
  const tokenColor = tokenType === 'FlowToken' ? 'text-green-600' : 'text-blue-600';
  const cardGradient = tokenType === 'FlowToken'
    ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
    : 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20';
  const borderColor = tokenType === 'FlowToken'
    ? 'border-green-400 dark:border-green-600'
    : 'border-blue-400 dark:border-blue-600';

  const tokenDisplayName = tokenType === 'FlowToken' ? 'FLOW' : tokenType === 'USDCFlow' ? 'USDC' : 'stFLOW';

  return (
    <div className={`bg-gradient-to-r ${cardGradient} border-2 ${borderColor} rounded-2xl p-6 max-w-md w-full shadow-lg`}>
      <div className="flex flex-col items-center gap-4">
        {/* Icon and Title */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md ${tokenColor}`}>
            {tokenIcon}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {tokenDisplayName} Balance
            </h3>
            {walletAddress && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Balance Display */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${tokenColor} mb-1`}>
            {Number(balance).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 3
            })}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {tokenDisplayName}
          </div>
        </div>

        {/* Additional Info */}
        <div className="w-full pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Real-time balance from Flow blockchain
          </p>
        </div>
      </div>
    </div>
  );
}

