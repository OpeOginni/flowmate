import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "SwapFactory"
import "DeFiActions"

/// Script to calculate the expected profit from a flash loan arbitrage
/// using IncrementFi protocol with multi-hop routing
///
/// Multi-hop route: FLOW -> intermediateToken -> USDC -> intermediateToken -> FLOW
/// This provides better pricing through intermediate tokens with better liquidity
///
/// Returns an ArbitrageResult struct containing profit details

access(all) struct ArbitrageResult {
  access(all) let loanAmount: UFix64
  access(all) let flashLoanFee: UFix64
  access(all) let intermediateTokenKey: String
  access(all) let expectedIntermediateOut1: UFix64
  access(all) let expectedUSDCOut: UFix64
  access(all) let expectedIntermediateOut2: UFix64
  access(all) let expectedFlowOut: UFix64
  access(all) let repaymentAmount: UFix64
  access(all) let expectedProfit: UFix64
  access(all) let isProfitable: Bool
  access(all) let profitPercentage: UFix64

  init(
    loanAmount: UFix64,
    flashLoanFee: UFix64,
    intermediateTokenKey: String,
    expectedIntermediateOut1: UFix64,
    expectedUSDCOut: UFix64,
    expectedIntermediateOut2: UFix64,
    expectedFlowOut: UFix64
  ) {
    self.loanAmount = loanAmount
    self.flashLoanFee = flashLoanFee
    self.intermediateTokenKey = intermediateTokenKey
    self.expectedIntermediateOut1 = expectedIntermediateOut1
    self.expectedUSDCOut = expectedUSDCOut
    self.expectedIntermediateOut2 = expectedIntermediateOut2
    self.expectedFlowOut = expectedFlowOut
    self.repaymentAmount = loanAmount + flashLoanFee
    
    // Calculate profit (can be negative)
    if expectedFlowOut >= self.repaymentAmount {
      self.expectedProfit = expectedFlowOut - self.repaymentAmount
      self.isProfitable = true
    } else {
      self.expectedProfit = 0.0
      self.isProfitable = false
    }
    
    // Calculate profit percentage
    self.profitPercentage = loanAmount > 0.0 ? (self.expectedProfit / loanAmount) * 100.0 : 0.0
  }
}

/// Calculate expected arbitrage profit for a given flash loan amount using multi-hop routing
///
/// @param flashLoanAmount: The amount of FLOW tokens to borrow via flash loan
/// @param intermediateTokenTypeIdentifier: The type identifier of the intermediate token (e.g., "A.b19436aae4d94622.FiatToken.Vault" for stgUSDC)
/// @return ArbitrageResult struct with detailed profit calculation
///
access(all) fun main(flashLoanAmount: UFix64, intermediateTokenTypeIdentifier: String): ArbitrageResult {
  pre {
    flashLoanAmount > 0.0: "Flash loan amount must be greater than 0"
    intermediateTokenTypeIdentifier.length > 0: "Intermediate token type identifier cannot be empty"
  }

  // Get token identifiers
  let flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier
  )
  let usdcFlowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier
  )
  let intermediateKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: intermediateTokenTypeIdentifier
  )

  // Calculate flash loan fee (typically 0.3% or 30 basis points)
  let flashLoanFee = UFix64(SwapFactory.getFlashloanRateBps()) * flashLoanAmount / 10000.0

  // FORWARD PATH: FLOW -> intermediate -> USDC
  
  // Step 1: FLOW -> Intermediate Token
  let swapper1 = IncrementFiSwapConnectors.Swapper(
    path: [flowKey, intermediateKey],
    inVault: Type<@FlowToken.Vault>(),
    outVault: Type<@FungibleToken.Vault>(), // Generic type since we don't know the exact intermediate token type
    uniqueID: nil
  )
  let quote1 = swapper1.quoteOut(forProvided: flashLoanAmount, reverse: false)
  let expectedIntermediateOut1 = quote1.outAmount

  // Step 2: Intermediate Token -> USDC
  let swapper2 = IncrementFiSwapConnectors.Swapper(
    path: [intermediateKey, usdcFlowKey],
    inVault: Type<@FungibleToken.Vault>(),
    outVault: Type<@USDCFlow.Vault>(),
    uniqueID: nil
  )
  let quote2 = swapper2.quoteOut(forProvided: expectedIntermediateOut1, reverse: false)
  let expectedUSDCOut = quote2.outAmount

  // RETURN PATH: USDC -> intermediate -> FLOW
  
  // Step 3: USDC -> Intermediate Token
  let swapper3 = IncrementFiSwapConnectors.Swapper(
    path: [usdcFlowKey, intermediateKey],
    inVault: Type<@USDCFlow.Vault>(),
    outVault: Type<@FungibleToken.Vault>(),
    uniqueID: nil
  )
  let quote3 = swapper3.quoteOut(forProvided: expectedUSDCOut, reverse: false)
  let expectedIntermediateOut2 = quote3.outAmount

  // Step 4: Intermediate Token -> FLOW
  let swapper4 = IncrementFiSwapConnectors.Swapper(
    path: [intermediateKey, flowKey],
    inVault: Type<@FungibleToken.Vault>(),
    outVault: Type<@FlowToken.Vault>(),
    uniqueID: nil
  )
  let quote4 = swapper4.quoteOut(forProvided: expectedIntermediateOut2, reverse: false)
  let expectedFlowOut = quote4.outAmount

  // Return comprehensive result
  return ArbitrageResult(
    loanAmount: flashLoanAmount,
    flashLoanFee: flashLoanFee,
    intermediateTokenKey: intermediateKey,
    expectedIntermediateOut1: expectedIntermediateOut1,
    expectedUSDCOut: expectedUSDCOut,
    expectedIntermediateOut2: expectedIntermediateOut2,
    expectedFlowOut: expectedFlowOut
  )
}

// Example usage:
// flow scripts execute ./cadence/scripts/FindArbitrage_IncrementFi_MultiHop.cdc --network mainnet 10000.0 "A.b19436aae4d94622.FiatToken.Vault"
// 
// To find the intermediate token type identifier:
// 1. Check IncrementFi website for the swap route
// 2. Look at the token contract address and name
// 3. Format as: A.<address>.<contract>.<resource>

