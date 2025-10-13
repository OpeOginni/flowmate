"use client"
import {
    DynamicContextProvider,
    DynamicWidget,
  } from "@dynamic-labs/sdk-react-core";
  
  import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
  import { createConfig, WagmiProvider } from "wagmi";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { http } from "viem";
  import { mainnet, flowMainnet, flowTestnet} from "viem/chains";
  import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
  import { FlowWalletConnectors } from "@dynamic-labs/flow";
  
  const config = createConfig({
    chains: [flowMainnet, flowTestnet],
    multiInjectedProviderDiscovery: false,
    transports: {
      [flowMainnet.id]: http(),
      [flowTestnet.id]: http(),
    },
  });
  
  const queryClient = new QueryClient();
  
  export default function DynamicProvider({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <DynamicContextProvider
        settings={{
          // Find your environment id at https://app.dynamic.xyz/dashboard/developer
          environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "",
          walletConnectors: [EthereumWalletConnectors, FlowWalletConnectors],
        }}
      >
        <WagmiProvider config={config}>
            <DynamicWidget />
            {children}
        </WagmiProvider>
      </DynamicContextProvider>
    );
  }
  