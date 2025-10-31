"use client"

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { TransactionButton, TransactionDialog } from '@onflow/react-sdk';
import * as fcl from '@onflow/fcl';
import { AlertCircle } from 'lucide-react';
import { DateTimePicker } from './DateTimePicker';
import { getUnixTime, fromUnixTime, format } from 'date-fns';

interface TransactionArg {
  name: string;
  type: string;
  value: unknown;
}

interface TransactionPayload {
  name: string;
  codePath: string;
  code: string;
  args?: TransactionArg[];
  description: string;
}

interface TransactionConfirmationProps {
  transaction: TransactionPayload;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (txId: string) => void;
}

export default function TransactionConfirmation({ 
  transaction, 
  open,
  onOpenChange,
  onSuccess 
}: TransactionConfirmationProps) {
  const [editedArgs, setEditedArgs] = useState<TransactionArg[]>(transaction.args || []);
  const [txId, setTxId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Reset edited args when transaction changes
  useEffect(() => {
    setEditedArgs(transaction.args || []);
  }, [transaction.args]);

  const handleArgChange = (index: number, newValue: string | Date) => {
    const updated = [...editedArgs];
    
    // If newValue is a Date (from DateTimePicker), convert to Unix timestamp using date-fns
    if (newValue instanceof Date) {
      updated[index] = { ...updated[index], value: getUnixTime(newValue) };
    } else {
      updated[index] = { ...updated[index], value: newValue };
    }
    
    setEditedArgs(updated);
  };

  // Helper to format UFix64 values (must have decimal point)
  const formatUFix64 = (value: string | number): string => {
    const str = typeof value === 'number' ? value.toString() : value;
    // If the string doesn't contain a decimal point, add .0
    return str.includes('.') ? str : `${str}.0`;
  };

  // Convert args to FCL format
  const convertToFclArgs = (arg: any, t: any) => {
    
    const converted = editedArgs.map((argItem, index) => {
      const { type, value } = argItem;
      
      let fclArg;
      switch (type) {
        case 'Address':
          fclArg = arg(value as string, t.Address);
          break;
        case 'UFix64':
          const ufix64Value = formatUFix64(value as string);
          fclArg = arg(ufix64Value, t.UFix64);
          break;
        case 'UInt64':
          fclArg = arg(value as string, t.UInt64);
          break;
        case 'UInt8':
          fclArg = arg(value as string, t.UInt8);
          break;
        case 'String':
          fclArg = arg(value as string, t.String);
          break;
        case 'Bool':
          fclArg = arg(value as boolean, t.Bool);
          break;
        default:
          fclArg = arg(value as string, t.String);
      }
      return fclArg;
    });
    
    return converted;
  };

  const handleSuccess = (data: string) => {
    setTxId(data);
    setDialogOpen(true);
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess(data);
    }
  };

  const handleError = (error: unknown) => {
    console.error('=== Transaction Failed ===');
    console.error("Transaction Name:", transaction.name);
    console.error("Error:", error);
    console.error("Error message:", error instanceof Error ? error.message : 'Unknown error');
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack');
    console.error("Transaction Code:", transaction.code?.substring(0, 300));
    console.error("Args:", JSON.stringify(editedArgs, null, 2));
    console.error('==========================');
    alert(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>{transaction.name}</DialogTitle>
          <DialogDescription>{transaction.description}</DialogDescription>
        </DialogHeader>

          {/* Transaction Arguments */}
          {editedArgs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Transaction Parameters
              </h3>
              <div className="space-y-3">
                {editedArgs.map((arg, index) => {
                  // Detect timestamp fields - check both UFix64 type and name containing 'timestamp'
                  const isTimestamp = arg.type === 'UFix64' && arg.name.toLowerCase().includes('timestamp');
                  
                  // For timestamps, parse the value correctly using date-fns
                  const timestampValue = isTimestamp && arg.value 
                    ? (typeof arg.value === 'number' 
                        ? arg.value 
                        : parseFloat(String(arg.value)))
                    : null;
                  
                  const timestampDate = timestampValue 
                    ? fromUnixTime(timestampValue)
                    : undefined;
                  
                  return (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {arg.name} <span className="text-gray-500">({arg.type})</span>
                      </label>
                      
                      {isTimestamp ? (
                        <div className="space-y-2">
                          <DateTimePicker
                            value={timestampDate}
                            onChange={(date) => {
                              if (date) {
                                handleArgChange(index, date);
                              }
                            }}
                          />
                          {timestampDate && (
                            <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                              <p className="text-xs font-medium text-indigo-900 dark:text-indigo-200">
                                📅 Scheduled for:
                              </p>
                              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mt-1">
                                {format(timestampDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={String(arg.value)}
                          onChange={(e) => handleArgChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">Review Carefully</p>
                <p>Please review all transaction parameters before signing. This action cannot be undone.</p>
              </div>
            </div>
          </div>

          {/* Transaction Code Preview */}
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              View Transaction Code
            </summary>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
              {transaction.code}
            </pre>
          </details>

          {/* Action Buttons */}
          <DialogFooter className="flex flex-col gap-3 items-stretch sm:flex-col">
            <TransactionButton
              label="🔐 Sign & Send Transaction"
              transaction={{
                cadence: transaction.code,
                args: convertToFclArgs,
                limit: 9999,
              }}
              mutation={{
                onSuccess: handleSuccess,
                onError: handleError,
              }}
              className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
            />
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-auto self-center bg-red-500 hover:bg-red-600 text-white hover:text-white"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Status Dialog */}
      {txId && (
        <TransactionDialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              onOpenChange(false); // Close the confirmation modal when dialog closes
            }
          }} 
          txId={txId} 
        />
      )}
    </>
  );
}

