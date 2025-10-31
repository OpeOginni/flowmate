"use client"

import Image from "next/image"
import { useFlowCurrentUser, useFlowAccount, Connect } from "@onflow/react-sdk"
import { useNetworkSwitch } from "@/providers/FlowProvider"
import { useState } from "react"
import { toast } from "sonner"

export default function Header() {
    const { user, unauthenticate } = useFlowCurrentUser()
    const { currentNetwork, switchNetwork, isNetworkSwitching } = useNetworkSwitch()
    const [showNetworkMenu, setShowNetworkMenu] = useState(false)
    const [showSwitchConfirm, setShowSwitchConfirm] = useState(false)
    const [pendingNetwork, setPendingNetwork] = useState<"mainnet" | "testnet" | null>(null)
    
    const {
        data: account,
        isLoading,
    } = useFlowAccount({
        address: user?.addr,
        query: { enabled: !!user?.addr, queryHash: `N-${currentNetwork}, A-${user?.addr}` },
    })
    
    // Format balance - Flow balance is in the account balance field
    const formatBalance = (balance: string | number | undefined) => {
        if (!balance) return "0.00"
        const balanceNum = typeof balance === "string" ? parseFloat(balance) : balance
        return (balanceNum / 100_000_000).toFixed(2) // Convert from smallest unit to FLOW
    }

    const handleNetworkSwitchRequest = (network: "mainnet" | "testnet") => {
        if (network === currentNetwork) {
            setShowNetworkMenu(false)
            return
        }
        
        setPendingNetwork(network)
        setShowNetworkMenu(false)
        
        // If user is logged in, show confirmation dialog
        if (user?.loggedIn) {
            setShowSwitchConfirm(true)
        } else {
            // If not logged in, switch directly
            performNetworkSwitch(network)
        }
    }

    const performNetworkSwitch = async (network: "mainnet" | "testnet") => {
        try {
            // Unauthenticate if logged in
            if (user?.loggedIn) {
                await unauthenticate()
            }
            
            // Switch network
            await switchNetwork(network)
            
            setShowSwitchConfirm(false)
            setPendingNetwork(null)
        } catch (error) {
            console.error("Failed to switch network:", error)
            setPendingNetwork(null)
        }
    }

    const cancelNetworkSwitch = () => {
        setShowSwitchConfirm(false)
        setPendingNetwork(null)
    }

    const networkColors = {
        mainnet: "bg-green-500",
        testnet: "bg-yellow-500",
        emulator: "bg-blue-500"
    }

    const networkLabels = {
        mainnet: "Mainnet",
        testnet: "Testnet",
        emulator: "Emulator"
    }

    return(
        <>
            <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <Image 
                        src="/header-logo.png" 
                        alt="Flow Mate" 
                        width={120} 
                        height={40}
                        className="h-8 w-auto"
                        priority
                    />
                    
                    {user?.loggedIn ? (
                        <div className="flex items-center gap-2">
                            {/* Combined Info Card */}
                            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border bg-card shadow-sm">
                                {/* Network Switcher */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                                        disabled={isNetworkSwitching}
                                        className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${networkColors[currentNetwork]}`}></div>
                                        <span className="text-foreground capitalize">{networkLabels[currentNetwork]}</span>
                                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Network Menu */}
                                    {showNetworkMenu && (
                                        <>
                                            {/* Backdrop to close menu */}
                                            <div 
                                                className="fixed inset-0 z-40" 
                                                onClick={() => setShowNetworkMenu(false)}
                                            />
                                            <div className="absolute top-full mt-2 right-0 w-40 rounded-md border border-border bg-card shadow-lg z-50">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => handleNetworkSwitchRequest("mainnet")}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-foreground transition-colors"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span>Mainnet</span>
                                                        {currentNetwork === "mainnet" && (
                                                            <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleNetworkSwitchRequest("testnet")}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-foreground transition-colors"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                        <span>Testnet</span>
                                                        {currentNetwork === "testnet" && (
                                                            <svg className="w-4 h-4 ml-auto text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="h-6 w-px bg-border"></div>

                                {/* Balance Display */}
                                {!isLoading ? (
                                    <div className="flex items-center gap-2">
                                        {/* Flow Logo SVG */}
                                        <img src="./flow.svg" alt="flow" className="w-4 h-4" />
                                        <span className="text-sm font-semibold text-foreground">
                                            {formatBalance(account?.balance)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">FLOW</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-4 bg-muted animate-pulse rounded"></div>
                                    </div>
                                )}
                            </div>

                            {/* Connect Button */}
                            <Connect
                                onConnect={() => toast.success("Wallet Connected!")}
                                onDisconnect={() => toast.info("Wallet Disconnected")}
                            />
                        </div>
                    ) : (
                        <Connect
                            onConnect={() => toast.success("Wallet Connected!")}
                            onDisconnect={() => toast.info("Wallet Disconnected")}
                        />
                    )}
                </div>
            </header>

            {/* Network Switch Confirmation Modal */}
            {showSwitchConfirm && pendingNetwork && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={cancelNetworkSwitch}
                    />
                    
                    {/* Modal */}
                    <div className="relative bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex flex-col gap-4">
                            {/* Icon */}
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10">
                                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Switch to {networkLabels[pendingNetwork]}?
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Switching networks requires you to disconnect your wallet. You&apos;ll need to reconnect after the switch.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={cancelNetworkSwitch}
                                    disabled={isNetworkSwitching}
                                    className="flex-1 px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => performNetworkSwitch(pendingNetwork)}
                                    disabled={isNetworkSwitching}
                                    className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isNetworkSwitching ? "Switching..." : "Switch Network"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}