"use client"

import { useFlowCurrentUser } from "@onflow/react-sdk"
import MainPageConnectWallet from "./MainPageConnectWallet"
import { useState } from "react"
import ChatInterface from '@/components/ChatInterface'
import TransactionConfirmation from './TransactionConfirmation'
import { useNetworkSwitch } from '@/providers/FlowProvider'


export default function MainPageInput() {
  const { user } = useFlowCurrentUser()
  const { currentNetwork } = useNetworkSwitch()
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [completedTransactions, setCompletedTransactions] = useState<Record<string, string>>({})

  if (!user?.loggedIn || !user?.addr) {
    return (
      <div className="flex-1 flex flex-col">
        <MainPageConnectWallet />
      </div>
    )
  }

  return (
    <>
      <ChatInterface
        user={user}
        currentNetwork={currentNetwork}
        completedTransactions={completedTransactions}
        setSelectedTransaction={setSelectedTransaction}
        setCompletedTransactions={setCompletedTransactions}
      />

      {selectedTransaction && (
        <TransactionConfirmation
          transaction={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTransaction(null);
            }
          }}
          onSuccess={(txId) => {
            // Store the transaction ID with its key
            if (selectedTransaction._key) {
              setCompletedTransactions(prev => ({
                ...prev,
                [selectedTransaction._key]: txId
              }));
            }
            setSelectedTransaction(null);
          }}
        />
      )}
        </>

  )


}
