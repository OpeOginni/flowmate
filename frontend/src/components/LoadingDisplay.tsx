"use client"

import { LoaderCircle } from "lucide-react";

interface LoadingDisplayProps {
  message: string;
  gradient?: string;
  borderColor?: string;
  iconColor?: string;
}

export default function LoadingDisplay({
  message,
  gradient = "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
  borderColor = "border-purple-300 dark:border-purple-700",
  iconColor = "text-purple-600",
}: LoadingDisplayProps) {
  return (
    <div className={`bg-gradient-to-r ${gradient} border-2 ${borderColor} rounded-2xl p-6 max-w-md w-full shadow-lg`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md">
          <LoaderCircle className={`w-5 h-5 animate-spin ${iconColor}`} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

