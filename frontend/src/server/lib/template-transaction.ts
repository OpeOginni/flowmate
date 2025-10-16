import { getContractAddresses, type FlowNetwork } from './contract-addresses';

// Re-export FlowNetwork type for convenience
export type { FlowNetwork } from './contract-addresses';

/**
 * Template a Cadence transaction by replacing import statements with actual contract addresses
 * 
 * @param transactionCode - The raw Cadence transaction code
 * @param network - The Flow network (mainnet, testnet, or emulator)
 * @returns The templated transaction code with contract addresses
 * 
 * @example
 * Input: `import FlowToken from "FlowToken"`
 * Output: `import FlowToken from 0x7e60df042a9c0868` (for testnet)
 * 
 * Input: `import "FlowTransactionScheduler"`
 * Output: `import FlowTransactionScheduler from 0x8c5303eaa26202d6` (for testnet)
 */
export function templateTransaction(transactionCode: string, network: FlowNetwork = 'testnet'): string {
  const contractAddresses = getContractAddresses(network);
  let templatedCode = transactionCode;

  // Pattern 1: import ContractName from "ContractName"
  // Replace with: import ContractName from 0xADDRESS
  const importWithFromPattern = /import\s+(\w+)\s+from\s+"(\w+)"/g;
  templatedCode = templatedCode.replace(importWithFromPattern, (match, importName, contractName) => {
    const address = contractAddresses[contractName];
    if (!address) {
      console.warn(`Warning: No address found for contract "${contractName}" on ${network}, keeping original import`);
      return match;
    }
    return `import ${importName} from ${address}`;
  });

  // Pattern 2: import "ContractName"
  // Replace with: import ContractName from 0xADDRESS
  const importWithoutFromPattern = /import\s+"(\w+)"/g;
  templatedCode = templatedCode.replace(importWithoutFromPattern, (match, contractName) => {
    const address = contractAddresses[contractName];
    if (!address) {
      console.warn(`Warning: No address found for contract "${contractName}" on ${network}, keeping original import`);
      return match;
    }
    return `import ${contractName} from ${address}`;
  });

  return templatedCode;
}

/**
 * Template a transaction and log the changes for debugging
 */
export function templateTransactionWithLogging(
  transactionCode: string, 
  network: FlowNetwork = 'testnet',
  transactionName: string = 'Unknown'
): string {
  const importLines = transactionCode.split('\n').filter(line => line.trim().startsWith('import'));
  importLines.forEach(line => console.log('  ', line));

  const templated = templateTransaction(transactionCode, network);

  const templatedImports = templated.split('\n').filter(line => line.trim().startsWith('import'));
  templatedImports.forEach(line => console.log('  ', line));

  return templated;
}

