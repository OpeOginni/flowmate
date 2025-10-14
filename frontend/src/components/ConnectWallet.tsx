"use client"

import { Connect } from "@onflow/react-sdk"

export default function ConnectWallet() {

  return (
    <div>
        <Connect
            onConnect={() => console.log("Connected!")}
            onDisconnect={() => console.log("Logged out")}
        />
    </div>
  )
}