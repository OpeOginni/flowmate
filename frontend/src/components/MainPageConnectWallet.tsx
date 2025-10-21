"use client"

import { Connect } from "@onflow/react-sdk"

export default function MainPageConnectWallet() {

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-8 max-w-3xl">
        {/* Hero Title */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            say hey to your <span className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-primary">Flow Mate</span>
          </h1>
        </div>
        
        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Automate your Flow blockchain actions with ease. Schedule transactions, 
          manage DeFi activities, and take control of your crypto workflow.
        </p>

        {/* Connect Button */}
        <div className="flex justify-center pt-4">
          <div className="inline-flex items-center justify-center">
            <Connect
              onConnect={() => console.log("Connected!")}
              onDisconnect={() => console.log("Logged out")}
            />
          </div>
        </div>
      </div>
    </div>
  )
}