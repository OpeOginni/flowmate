import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "UniswapV2SwapConnectors"
import "SwapFactory"
import "DeFiActions"
import "EVM"

/// Script to calculate the expected profit from a flash loan arbitrage
/// using both IncrementFi and UniswapV2 protocols
///
/// Calculates two routes:
/// Route 1: FLOW -> USDC (IncrementFi) -> FLOW (UniswapV2)
/// Route 2: FLOW -> USDC (UniswapV2) -> FLOW (IncrementFi)
///
/// Returns the most profitable route

access(all) struct ArbitrageResult {
  access(all) let loanAmount: UFix64
  access(all) let flashLoanFee: UFix64
  access(all) let expectedUSDCOut: UFix64
  access(all) let expectedFlowOut: UFix64
  access(all) let repaymentAmount: UFix64
  access(all) let expectedProfit: UFix64
  access(all) let isProfitable: Bool
  access(all) let profitPercentage: UFix64
  access(all) let routeName: String

  init(
    loanAmount: UFix64,
    flashLoanFee: UFix64,
    expectedUSDCOut: UFix64,
    expectedFlowOut: UFix64,
    routeName: String
  ) {
    self.loanAmount = loanAmount
    self.flashLoanFee = flashLoanFee
    self.expectedUSDCOut = expectedUSDCOut
    self.expectedFlowOut = expectedFlowOut
    self.repaymentAmount = loanAmount + flashLoanFee
    self.routeName = routeName
    
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

access(all) struct ComparisonResult {
  access(all) let route1: ArbitrageResult
  access(all) let route2: ArbitrageResult
  access(all) let bestRoute: ArbitrageResult
  access(all) let profitDifference: UFix64

  init(route1: ArbitrageResult, route2: ArbitrageResult) {
    self.route1 = route1
    self.route2 = route2
    
    // Determine best route
    if route1.expectedProfit >= route2.expectedProfit {
      self.bestRoute = route1
      self.profitDifference = route1.expectedProfit - route2.expectedProfit
    } else {
      self.bestRoute = route2
      self.profitDifference = route2.expectedProfit - route1.expectedProfit
    }
  }
}

/// Calculate expected arbitrage profit for both routes and return the best one
///
/// @param flashLoanAmount: The amount of FLOW tokens to borrow via flash loan
/// @param coaAddress: Address of the Cadence Owned Account for EVM interactions
/// @param uniswapRouterEVMAddress: EVM address of the UniswapV2 router (hex string)
/// @param flowEVMAddress: EVM address of FLOW token (hex string)
/// @param usdcEVMAddress: EVM address of USDC token (hex string)
/// @return ComparisonResult struct comparing both routes
///
access(all) fun main(
  flashLoanAmount: UFix64,
  coaAddress: Address,
  uniswapRouterEVMAddress: String,
  flowEVMAddress: String,
  usdcEVMAddress: String
): ComparisonResult {
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

  // Calculate flash loan fee
  let flashLoanFee = UFix64(SwapFactory.getFlashloanRateBps()) * flashLoanAmount / 10000.0

  // Parse EVM addresses
  let routerEVMAddr = EVM.addressFromString(uniswapRouterEVMAddress)
  let flowEVMAddr = EVM.addressFromString(flowEVMAddress)
  let usdcEVMAddr = EVM.addressFromString(usdcEVMAddress)

  // Get COA capability
  let coaCapability = getAccount(coaAddress)
    .capabilities
    .get<auth(EVM.Owner) &EVM.CadenceOwnedAccount>(/public/evm)
  
  assert(coaCapability.check(), message: "COA capability not found or invalid")

  // Create IncrementFi swappers
  let incrementFiSwapper = IncrementFiSwapConnectors.Swapper(
    path: [flowKey, usdcFlowKey],
    inVault: Type<@FlowToken.Vault>(),
    outVault: Type<@USDCFlow.Vault>(),
    uniqueID: nil
  )

  let incrementFiSwapperReverse = IncrementFiSwapConnectors.Swapper(
    path: [usdcFlowKey, flowKey],
    inVault: Type<@USDCFlow.Vault>(),
    outVault: Type<@FlowToken.Vault>(),
    uniqueID: nil
  )

  // Create UniswapV2 swappers
  let uniswapV2Swapper = UniswapV2SwapConnectors.Swapper(
    routerAddress: routerEVMAddr,
    path: [flowEVMAddr, usdcEVMAddr],
    inVault: Type<@FlowToken.Vault>(),
    outVault: Type<@USDCFlow.Vault>(),
    coaCapability: coaCapability,
    uniqueID: nil
  )

  let uniswapV2SwapperReverse = UniswapV2SwapConnectors.Swapper(
    routerAddress: routerEVMAddr,
    path: [usdcEVMAddr, flowEVMAddr],
    inVault: Type<@USDCFlow.Vault>(),
    outVault: Type<@FlowToken.Vault>(),
    coaCapability: coaCapability,
    uniqueID: nil
  )

  // ROUTE 1: IncrementFi -> UniswapV2
  let route1Quote1 = incrementFiSwapper.quoteOut(forProvided: flashLoanAmount, reverse: false)
  let route1USDCOut = route1Quote1.quote
  let route1Quote2 = uniswapV2SwapperReverse.quoteOut(forProvided: route1USDCOut, reverse: false)
  let route1FlowOut = route1Quote2.quote

  let route1Result = ArbitrageResult(
    loanAmount: flashLoanAmount,
    flashLoanFee: flashLoanFee,
    expectedUSDCOut: route1USDCOut,
    expectedFlowOut: route1FlowOut,
    routeName: "IncrementFi -> UniswapV2"
  )

  // ROUTE 2: UniswapV2 -> IncrementFi
  let route2Quote1 = uniswapV2Swapper.quoteOut(forProvided: flashLoanAmount, reverse: false)
  let route2USDCOut = route2Quote1.outAmount
  let route2Quote2 = incrementFiSwapperReverse.quoteOut(forProvided: route2USDCOut, reverse: false)
  let route2FlowOut = route2Quote2.outAmount

  let route2Result = ArbitrageResult(
    loanAmount: flashLoanAmount,
    flashLoanFee: flashLoanFee,
    expectedUSDCOut: route2USDCOut,
    expectedFlowOut: route2FlowOut,
    routeName: "UniswapV2 -> IncrementFi"
  )

  // Return comparison result
  return ComparisonResult(route1: route1Result, route2: route2Result)
}

