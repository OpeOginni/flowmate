"use client"

import { useFlowCurrentUser, useFlowAccount, Connect } from "@onflow/react-sdk"
import MainPageConnectWallet from "./MainPageConnectWallet"

export default function ConnectWallet() {
  const { user, unauthenticate } = useFlowCurrentUser()


  if (!user?.loggedIn) {
    return (<MainPageConnectWallet />)
  }

  return (
    <div className="inline-flex h-11 items-center justify-center px-8 text-sm font-medium">
      "Connected BOYZ"
    </div>
  )
}