"use client"

import { Connect } from "@onflow/react-sdk"

export default function MainPageConnectWallet() {

  return (
    <div className="inline-flex h-11 items-center justify-center px-8 text-sm font-medium">
      <Connect
        onConnect={() => console.log("Connected!")}
        onDisconnect={() => console.log("Logged out")}
      />
    </div>
  )
}