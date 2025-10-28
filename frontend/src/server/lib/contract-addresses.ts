/**
 * Contract address mappings for Flow blockchain
 * Based on flow.json configuration
 */

export type FlowNetwork = 'mainnet' | 'testnet' | 'emulator';

export interface ContractAddresses {
  FlowToken: string;
  USDCFlow: string;
  stFlowToken: string;
  FlowMateScheduledActionsHandler: string;
  FungibleToken: string;
  FlowTransactionScheduler: string;
  FlowTransactionSchedulerUtils: string;
  DeFiActions: string;
  SwapRouter: string;
  IncrementFiSwapConnectors: string;
  Staking: string;
  StakingError: string;
  SwapConfig: string;
  SwapError: string;
  SwapInterfaces: string;
  IncrementFiStakingConnectors: string;
  IncrementFiFlashloanConnectors: string;
  [key: string]: string;
}

/**
 * Contract addresses for each network
 */
export const CONTRACT_ADDRESSES: Record<FlowNetwork, ContractAddresses> = {
  mainnet: {
    FlowToken: '0x1654653399040a61',
    USDCFlow: '0xf1ab99c82dee3526',
    stFlowToken: '0xd6f80565193ad727',
    FlowMateScheduledActionsHandler: '0x136a10c590912ef8',
    FungibleToken: '0xf233dcee88fe0abe',
    FungibleTokenMetadataViews: '0xf233dcee88fe0abe',
    FlowTransactionScheduler: '0xe467b9dd11fa00df',
    FlowTransactionSchedulerUtils: '0xe467b9dd11fa00df', // Same as FlowTransactionScheduler on mainnet
    DeFiActions: '0x92195d814edf9cb0',
    SwapRouter: '0xa6850776a94e6551',
    IncrementFiSwapConnectors: '0xefa9bd7d1b17f1ed',
    Staking: '0x1b77ba4b414de352',
    StakingError: '0x1b77ba4b414de352',
    SwapConfig: '0xb78ef7afa52ff906',
    SwapError: '0xb78ef7afa52ff906',
    SwapInterfaces: '0xb78ef7afa52ff906',
    IncrementFiStakingConnectors: '0xefa9bd7d1b17f1ed',
    IncrementFiFlashloanConnectors: '0xefa9bd7d1b17f1ed',
  },
  testnet: {
    FlowToken: '0x7e60df042a9c0868',
    USDCFlow: '0x64adf39cbc354fcb',
    stFlowToken: '0xd6f80565193ad727',
    FlowMateScheduledActionsHandler: '0x136a10c590912ef8',
    FungibleToken: '0x9a0766d93b6608b7',
    FungibleTokenMetadataViews: '0x9a0766d93b6608b7',
    FlowTransactionScheduler: '0x8c5303eaa26202d6',
    FlowTransactionSchedulerUtils: '0x8c5303eaa26202d6',
    DeFiActions: '0x4c2ff9dd03ab442f',
    SwapRouter: '0x2f8af5ed05bbde0d',
    IncrementFiSwapConnectors: '0x49bae091e5ea16b5',
    Staking: '0x26a1e94319e81a3c',
    StakingError: '0x26a1e94319e81a3c',
    SwapConfig: '0x8d5b9dd833e176da',
    SwapError: '0x8d5b9dd833e176da',
    SwapInterfaces: '0x8d5b9dd833e176da',
    IncrementFiStakingConnectors: '0x49bae091e5ea16b5',
    IncrementFiFlashloanConnectors: '0x49bae091e5ea16b5',
  },
  emulator: {
    FlowToken: '0x0ae53cb6e3f42a79',
    USDCFlow: '0xf8d6e0586b0a20c7', // Placeholder
    stFlowToken: '0xd6f80565193ad727',
    FlowMateScheduledActionsHandler: '0x136a10c590912ef8',
    FungibleToken: '0xee82856bf20e2aa6',
    FungibleTokenMetadataViews: '0xee82856bf20e2aa6',
    FlowTransactionScheduler: '0xf8d6e0586b0a20c7',
    FlowTransactionSchedulerUtils: '0xf8d6e0586b0a20c7',
    DeFiActions: '0xf8d6e0586b0a20c7',
    SwapRouter: '0xf8d6e0586b0a20c7',
    IncrementFiSwapConnectors: '0xf8d6e0586b0a20c7',
    Staking: '0xf8d6e0586b0a20c7',
    StakingError: '0xf8d6e0586b0a20c7',
    SwapConfig: '0xf8d6e0586b0a20c7',
    SwapError: '0xf8d6e0586b0a20c7',
    SwapInterfaces: '0xf8d6e0586b0a20c7',
    IncrementFiStakingConnectors: '0xf8d6e0586b0a20c7',
    IncrementFiFlashloanConnectors: '0xf8d6e0586b0a20c7',
  },
};

/**
 * Get contract addresses for a specific network
 */
export function getContractAddresses(network: FlowNetwork = 'testnet'): ContractAddresses {
  return CONTRACT_ADDRESSES[network];
}

/**
 * Get a specific contract address for a network
 */
export function getContractAddress(contractName: string, network: FlowNetwork = 'testnet'): string {
  const addresses = getContractAddresses(network);
  const address = addresses[contractName];
  
  if (!address) {
    throw new Error(`Contract address not found for ${contractName} on ${network}`);
  }
  
  return address;
}

