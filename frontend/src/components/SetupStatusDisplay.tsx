"use client"

import { LoaderCircle } from "lucide-react";

interface SetupStatusDisplayProps {
  isSetup: boolean;
  isLoading?: boolean;
}

export default function SetupStatusDisplay({
  isSetup,
  isLoading = false,
}: SetupStatusDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-6 max-w-md w-full shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
            <LoaderCircle className="w-5 h-5 animate-spin text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Checking setup status…</p>
        </div>
      </div>
    );
  }

  const statusIcon = isSetup ? '✅' : '⚠️';
  const statusColor = isSetup 
    ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
    : 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20';
  const borderColor = isSetup 
    ? 'border-green-400 dark:border-green-600' 
    : 'border-orange-400 dark:border-orange-600';

  return (
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
  );
}

