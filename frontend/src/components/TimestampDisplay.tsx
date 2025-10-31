"use client"

import { fromUnixTime, format } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';

interface TimestampDisplayProps {
  currentTimestamp: number;
  userInstruction?: string;
  calculatedTimestamp?: number;
}

export default function TimestampDisplay({
  currentTimestamp,
  userInstruction,
  calculatedTimestamp,
}: TimestampDisplayProps) {
  const currentDate = fromUnixTime(currentTimestamp);
  const futureDate = calculatedTimestamp ? fromUnixTime(calculatedTimestamp) : null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-6 max-w-md w-full shadow-lg">
      <div className="flex flex-col gap-4">
        {/* Current Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Current Time
            </h3>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-1">
              {format(currentDate, 'h:mm:ss a')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
              Unix: {currentTimestamp}
            </p>
          </div>
        </div>

        {/* User Instruction */}
        {userInstruction && (
          <div className="flex items-center gap-2 pt-2 border-t border-purple-200 dark:border-purple-800">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Scheduling for:
              </p>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mt-1">
                {userInstruction}
              </p>
            </div>
          </div>
        )}

        {/* Calculated Future Time */}
        {futureDate && (
          <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Scheduled Execution Time
              </h3>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(futureDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
                {format(futureDate, 'h:mm:ss a')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                Unix: {calculatedTimestamp}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

