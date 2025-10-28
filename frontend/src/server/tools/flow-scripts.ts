import { tool } from 'ai';
import * as fs from 'fs';
import * as path from 'path';
import { GetUserBalanceParams, getUserBalanceSchema } from '../schemas/scripts';
import { templateTransactionWithLogging } from '../lib/template-transaction';
import { FlowNetwork } from '../lib/contract-addresses';
import * as fcl from '@onflow/fcl';

interface FlowConfig {
  accessNodeUrl: string
  discoveryWallet: string
  discoveryAuthnEndpoint: string
  flowNetwork: string
  stFlowToken: string
  USDCFlow: string
  FlowToken: string
  FungibleToken: string
  FungibleTokenMetadataViews: string
}

const flowConfig: Record<FlowNetwork, FlowConfig> = {
  emulator: {
    accessNodeUrl: "http://localhost:8888",
    discoveryWallet: "http://localhost:8701/fcl/authn",
    discoveryAuthnEndpoint: "http://localhost:8701/fcl/authn",
    flowNetwork: "local" as const,
    stFlowToken: "",
    USDCFlow: "",
    FlowToken: "",
    FungibleToken: "",
    FungibleTokenMetadataViews: "",
  },
  testnet: {
    accessNodeUrl: "https://rest-testnet.onflow.org",
    discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
    discoveryAuthnEndpoint:
      "https://fcl-discovery.onflow.org/api/testnet/authn",
    flowNetwork: "testnet" as const,
    stFlowToken: "0xd6f80565193ad727",
    USDCFlow: "0x64adf39cbc354fcb",
    FlowToken: "0x7e60df042a9c0868",
    FungibleToken: "0x9a0766d93b6608b7",
    FungibleTokenMetadataViews: "0x9a0766d93b6608b7",
  },
  mainnet: {
    accessNodeUrl: "https://rest-mainnet.onflow.org",
    discoveryWallet: "https://fcl-discovery.onflow.org/mainnet/authn",
    discoveryAuthnEndpoint:
      "https://fcl-discovery.onflow.org/api/mainnet/authn",
    flowNetwork: "mainnet" as const,
    stFlowToken: "0xd6f80565193ad727",
    USDCFlow: "0xf1ab99c82dee3526",
    FlowToken: "0x1654653399040a61",
    FungibleToken: "0xf233dcee88fe0abe",
    FungibleTokenMetadataViews: "0xf233dcee88fe0abe",
  },
}

function readScriptFile(filename: string): string {
  const contractsPath = path.join(process.cwd(), '..', 'contracts', 'cadence', 'scripts', filename);
  return fs.readFileSync(contractsPath, 'utf-8');
}

function readAndTemplateScript(filename: string, network: FlowNetwork = 'testnet'): string {
  const rawCode = readScriptFile(filename);
  return templateTransactionWithLogging(rawCode, network, filename);
}

/**
 * GetUserBalance Tool
 */
export const getUserBalanceTool = (address: string, network: FlowNetwork) => tool({
  description: 'Get the specific signed in user\'s balance of a token',
  inputSchema: getUserBalanceSchema,
  execute: async (params: GetUserBalanceParams) => {
    const code = readAndTemplateScript('GetBalance.cdc', network);

    const config = flowConfig[network];

    fcl.config({
      "accessNode.api": config.accessNodeUrl,
      "flow.network": config.flowNetwork,
      "fcl.limit": 1000
    });

    let result: any;

    try{
      result = await fcl.query({
        cadence: code,
        args: (arg, t) => [
          arg(address, t.Address),
          arg(params.tokenType, t.String),
        ]
      })

    } catch (error) {
      console.error('error', error);
      throw new Error(`Failed to get balance: ${error}`);
    }


    return {
      balance: result,
      description: `The balance of ${params.tokenType} for ${address} is ${result.toString()}`,
    };
  },
});

export const flowScriptTools = {
  getUserBalanceTool: getUserBalanceTool,
};