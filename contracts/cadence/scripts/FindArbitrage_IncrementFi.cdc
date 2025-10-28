import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "SwapFactory"
import "DeFiActions"

/// Script to calculate the expected profit from a flash loan arbitrage
/// using only IncrementFi protocol (FLOW -> USDC -> FLOW)
///
/// Returns an ArbitrageResult struct containing:
/// - loanAmount: The amount of FLOW tokens to borrow
/// - flashLoanFee: The fee charged by the flash loan provider
/// - expectedUSDCOut: Expected USDC from first swap (FLOW -> USDC)
/// - expectedFlowOut: Expected FLOW from second swap (USDC -> FLOW)
/// - repaymentAmount: Total amount to repay (loanAmount + fee)
/// - expectedProfit: Estimated profit (can be negative if unprofitable)
/// - isProfitable: Boolean indicating if the arbitrage is profitable
/// - profitPercentage: Profit as a percentage of loan amount

access(all) struct ArbitrageResult {
  access(all) let loanAmount: UFix64
  access(all) let flashLoanFee: UFix64
  access(all) let expectedUSDCOut: UFix64
  access(all) let expectedFlowOut: UFix64
  access(all) let repaymentAmount: UFix64
  access(all) let expectedProfit: UFix64
  access(all) let isProfitable: Bool
  access(all) let profitPercentage: UFix64

  init(
    loanAmount: UFix64,
    flashLoanFee: UFix64,
    expectedUSDCOut: UFix64,
    expectedFlowOut: UFix64
  ) {
    self.loanAmount = loanAmount
    self.flashLoanFee = flashLoanFee
    self.expectedUSDCOut = expectedUSDCOut
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

/// Calculate expected arbitrage profit for a given flash loan amount
///
/// @param flashLoanAmount: The amount of FLOW tokens to borrow via flash loan
/// @return ArbitrageResult struct with detailed profit calculation
///
access(all) fun main(flashLoanAmount: UFix64): ArbitrageResult {
  pre {
    flashLoanAmount > 0.0: "Flash loan amount must be greater than 0"
  }

  // Get token identifiers
  let flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier
  )
  let usdcFlowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier
  )

  // Calculate flash loan fee (typically 0.3% or 30 basis points)
  let flashLoanFee = UFix64(SwapFactory.getFlashloanRateBps()) * flashLoanAmount / 10000.0

  // Create swapper for FLOW -> USDC
  let swapper1 = IncrementFiSwapConnectors.Swapper(
    path: [flowKey, usdcFlowKey],
    inVault: Type<@FlowToken.Vault>(),
    outVault: Type<@USDCFlow.Vault>(),
    uniqueID: nil
  )

  // Create swapper for USDC -> FLOW
  let swapper2 = IncrementFiSwapConnectors.Swapper(
    path: [usdcFlowKey, flowKey],
    inVault: Type<@USDCFlow.Vault>(),
    outVault: Type<@FlowToken.Vault>(),
    uniqueID: nil
  )

  // Calculate expected USDC output from FLOW -> USDC swap
  let quote1 = swapper1.quoteOut(forProvided: flashLoanAmount, reverse: false)
  let expectedUSDCOut = quote1.outAmount

  // Calculate expected FLOW output from USDC -> FLOW swap
  let quote2 = swapper2.quoteOut(forProvided: expectedUSDCOut, reverse: false)
  let expectedFlowOut = quote2.outAmount

  // Return comprehensive result
  return ArbitrageResult(
    loanAmount: flashLoanAmount,
    flashLoanFee: flashLoanFee,
    expectedUSDCOut: expectedUSDCOut,
    expectedFlowOut: expectedFlowOut
  )
}

// flow scripts execute ./cadence/scripts/FindArbitrage_IncrementFi.cdc --network mainnet <flashLoanAmount>

