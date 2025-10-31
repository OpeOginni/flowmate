"use client"

import { TransactionLink } from "@onflow/react-sdk";

interface TransactionDisplayProps {
  txId?: string;
  onReviewClick: () => void;
}

export default function TransactionDisplay({
  txId,
  onReviewClick,
}: TransactionDisplayProps) {
  return (
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
            onClick={onReviewClick}
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
  );
}

