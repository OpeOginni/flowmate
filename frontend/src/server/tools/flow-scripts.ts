import { tool } from 'ai';
import * as fs from 'fs';
import * as path from 'path';
import { GetUserBalanceParams, getUserBalanceSchema, CheckSetupStatusParams, checkSetupStatusSchema } from '../schemas/scripts';
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
  FlowMateScheduledActionsHandler: string
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
    FlowMateScheduledActionsHandler: "",
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
    FlowMateScheduledActionsHandler: "0x136a10c590912ef8",
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
    FlowMateScheduledActionsHandler: "0x136a10c590912ef8",
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

/**
 * CheckSetupStatus Tool
 */
export const checkSetupStatusTool = (address: string, network: FlowNetwork) => tool({
  description: 'Check if the user has completed the FlowMate setup. NOTE: This is optional - scheduled transactions automatically handle setup. Only use this if the user explicitly asks about their setup status.',
  inputSchema: checkSetupStatusSchema,
  execute: async (params: CheckSetupStatusParams) => {
    const code = readAndTemplateScript('CheckSetupStatus.cdc', network);

    const config = flowConfig[network];

    fcl.config({
      "accessNode.api": config.accessNodeUrl,
      "flow.network": config.flowNetwork,
      "fcl.limit": 1000
    });

    let result: any;

    try {
      result = await fcl.query({
        cadence: code,
        args: (arg, t) => [
          arg(address, t.Address),
        ]
      })
    } catch (error) {
      console.error('Setup check error:', error);
      throw new Error(`Failed to check setup status: ${error}`);
    }

    const isSetup = result.isSetup || false;
    const hasManager = result.hasManager || false;
    const hasHandler = result.hasHandler || false;

    return {
      isSetup,
      hasManager,
      hasHandler,
      description: isSetup 
        ? 'FlowMate setup is complete. You can schedule transactions.'
        : 'FlowMate setup is not complete. Please run the setup transaction first by saying "Setup my account for scheduled transactions"',
    };
  },
});

export const flowScriptTools = {
  getUserBalanceTool: getUserBalanceTool,
  checkSetupStatusTool: checkSetupStatusTool,
};