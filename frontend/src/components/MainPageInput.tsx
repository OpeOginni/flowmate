"use client"

import { useFlowCurrentUser, useFlowAccount, Connect } from "@onflow/react-sdk"
import MainPageConnectWallet from "./MainPageConnectWallet"
import { Button } from "@onflow/react-sdk/types/components/internal/Button"
import { Input } from "./ui/input"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "./ui/input-group"
import { useState } from "react"
import { AudioLinesIcon, SendIcon } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function ConnectWallet() {
  const { user, unauthenticate } = useFlowCurrentUser()
  const [input, setInput] = useState("")

  if (!user?.loggedIn) {
    return (<MainPageConnectWallet />)
  }

  const handleSubmit = () => {
    if(input.length === 0) {
      console.log("Audio Input Chosen")
    } else {
      console.log("Text input chosen")
      console.log(input)
      setInput("")
    }
  }

  return (
    <div className="inline-flex items-center justify-center px-8 w-full">
      <form className="flex w-full max-w-3xl items-center gap-2">
        <InputGroup className="h-14 rounded-3xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow bg-white/10 backdrop-blur-sm">
          <InputGroupInput 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Talk to your Flow Mate..." 
            className="text-base px-6 placeholder:text-muted-foreground/60"
          />
          <InputGroupAddon align="inline-end" className="pr-3.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton 
                  variant={input.length > 0 ? "default" : "secondary"} 
                  size="icon-sm"
                  onClick={handleSubmit}
                  className="rounded-full h-10 w-10"
                >
                  {input.length > 0 ? <SendIcon className="w-5 h-5" /> : <AudioLinesIcon className="w-5 h-5" />}
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <p>{input.length > 0 ? "Send message" : "Voice input"}</p>
              </TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  )
}