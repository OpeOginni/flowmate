import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "SwapRouter"
import "SwapFactory"

/// Script to automatically find the best arbitrage route by testing multiple paths
/// Tests both direct and multi-hop routes through common intermediate tokens
///
/// This script dynamically discovers the most profitable route without hardcoding

access(all) struct RouteResult {
  access(all) let routeName: String
  access(all) let path: [String]
  access(all) let amounts: [UFix64]
  access(all) let finalAmount: UFix64
  access(all) let profit: UFix64
  access(all) let isProfitable: Bool
  access(all) let profitPercentage: UFix64

  init(routeName: String, path: [String], amounts: [UFix64], loanAmount: UFix64, flashLoanFee: UFix64) {
    self.routeName = routeName
    self.path = path
    self.amounts = amounts
    self.finalAmount = amounts[amounts.length - 1]
    
    let repaymentAmount = loanAmount + flashLoanFee
    if self.finalAmount >= repaymentAmount {
      self.profit = self.finalAmount - repaymentAmount
      self.isProfitable = true
    } else {
      self.profit = 0.0
      self.isProfitable = false
    }
    
    self.profitPercentage = loanAmount > 0.0 ? (self.profit / loanAmount) * 100.0 : 0.0
  }
}

access(all) struct ComparisonResult {
  access(all) let loanAmount: UFix64
  access(all) let flashLoanFee: UFix64
  access(all) let testedRoutes: [RouteResult]
  access(all) let bestRoute: RouteResult?
  access(all) let directRouteResult: RouteResult?

  init(loanAmount: UFix64, flashLoanFee: UFix64, testedRoutes: [RouteResult]) {
    self.loanAmount = loanAmount
    self.flashLoanFee = flashLoanFee
    self.testedRoutes = testedRoutes
    
    // Find best route by highest profit
    var bestProfit = 0.0
    var bestIndex: Int? = nil
    var directIndex: Int? = nil
    
    var i = 0
    while i < testedRoutes.length {
      let route = testedRoutes[i]
      
      // Track direct route for comparison
      if route.path.length == 3 { // Direct route: FLOW -> USDC -> FLOW
        directIndex = i
      }
      
      if route.profit > bestProfit {
        bestProfit = route.profit
        bestIndex = i
      }
      i = i + 1
    }
    
    self.bestRoute = bestIndex != nil ? testedRoutes[bestIndex!] : nil
    self.directRouteResult = directIndex != nil ? testedRoutes[directIndex!] : nil
  }
}

/// Test a route and return the result, catching errors if the route doesn't exist
access(all) fun testRoute(
  routeName: String,
  path: [String],
  loanAmount: UFix64,
  flashLoanFee: UFix64
): RouteResult? {
  // Try to calculate the route - if it fails, the pairs don't exist
  var amounts: [UFix64]? = nil
  
  // Use a simple check: try to get the amounts, return nil if it panics
  // Note: In Cadence, we can't catch panics, so we'll validate pairs first
  var i = 0
  while i < path.length - 1 {
    let pairAddr = SwapFactory.getPairAddress(token0Key: path[i], token1Key: path[i + 1])
    if pairAddr == nil {
      // Pair doesn't exist, skip this route
      return nil
    }
    i = i + 1
  }
  
  // All pairs exist, calculate the route
  amounts = SwapRouter.getAmountsOut(amountIn: loanAmount, tokenKeyPath: path)
  
  return RouteResult(
    routeName: routeName,
    path: path,
    amounts: amounts!,
    loanAmount: loanAmount,
    flashLoanFee: flashLoanFee
  )
}

/// Main function to find the best arbitrage route
///
/// @param flashLoanAmount: Amount of FLOW to borrow
/// @param intermediateTokens: Array of intermediate token type identifiers to test (e.g., stgUSDC, USDT, etc.)
/// @return ComparisonResult with all tested routes and the best one
///
access(all) fun main(flashLoanAmount: UFix64, intermediateTokens: [String]?): ComparisonResult {
  pre {
    flashLoanAmount > 0.0: "Flash loan amount must be greater than 0"
  }

  // Get token keys
  let flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier
  )
  let usdcKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier
  )

  // Calculate flash loan fee
  let flashLoanFee = UFix64(SwapFactory.getFlashloanRateBps()) * flashLoanAmount / 10000.0

  // Store all tested routes
  let testedRoutes: [RouteResult] = []

  // 1. Test DIRECT route: FLOW -> USDC -> FLOW
  let directRoute = testRoute(
    routeName: "Direct: FLOW -> USDC -> FLOW",
    path: [flowKey, usdcKey, flowKey],
    loanAmount: flashLoanAmount,
    flashLoanFee: flashLoanFee
  )
  if directRoute != nil {
    testedRoutes.append(directRoute!)
  }

  // 2. Test multi-hop routes if intermediate tokens provided
  if intermediateTokens != nil {
    for intermediateTokenIdentifier in intermediateTokens! {
      let intermediateKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
        vaultTypeIdentifier: intermediateTokenIdentifier
      )
      
      // Test route: FLOW -> intermediate -> USDC -> intermediate -> FLOW
      let multiHopRoute = testRoute(
        routeName: "Multi-hop: FLOW -> ".concat(intermediateKey).concat(" -> USDC -> ").concat(intermediateKey).concat(" -> FLOW"),
        path: [flowKey, intermediateKey, usdcKey, intermediateKey, flowKey],
        loanAmount: flashLoanAmount,
        flashLoanFee: flashLoanFee
      )
      if multiHopRoute != nil {
        testedRoutes.append(multiHopRoute!)
      }

      // Test route: FLOW -> intermediate -> USDC -> FLOW (asymmetric)
      let asymRoute1 = testRoute(
        routeName: "Asym: FLOW -> ".concat(intermediateKey).concat(" -> USDC -> FLOW"),
        path: [flowKey, intermediateKey, usdcKey, flowKey],
        loanAmount: flashLoanAmount,
        flashLoanFee: flashLoanFee
      )
      if asymRoute1 != nil {
        testedRoutes.append(asymRoute1!)
      }

      // Test route: FLOW -> USDC -> intermediate -> FLOW (asymmetric reverse)
      let asymRoute2 = testRoute(
        routeName: "Asym: FLOW -> USDC -> ".concat(intermediateKey).concat(" -> FLOW"),
        path: [flowKey, usdcKey, intermediateKey, flowKey],
        loanAmount: flashLoanAmount,
        flashLoanFee: flashLoanFee
      )
      if asymRoute2 != nil {
        testedRoutes.append(asymRoute2!)
      }
    }
  }

  return ComparisonResult(
    loanAmount: flashLoanAmount,
    flashLoanFee: flashLoanFee,
    testedRoutes: testedRoutes
  )
}

// Example usage:
// 
// Test with common intermediate tokens on Flow mainnet:
// flow scripts execute ./cadence/scripts/FindBestArbitrageRoute_IncrementFi.cdc --network mainnet 10000.0 '["A.b19436aae4d94622.FiatToken.Vault", "A.cfdd90d4a00f7b5b.TeleportedTetherToken.Vault"]'
//
// Test without intermediate tokens (direct route only):
// flow scripts execute ./cadence/scripts/FindBestArbitrageRoute_IncrementFi.cdc --network mainnet 10000.0 null
//
// Common intermediate token identifiers on Flow mainnet:
// - stgUSDC (Stargate USDC): "A.b19436aae4d94622.FiatToken.Vault"
// - USDT (Tether): "A.cfdd90d4a00f7b5b.TeleportedTetherToken.Vault"
// - stFlow: Check IncrementFi docs for the exact identifier

