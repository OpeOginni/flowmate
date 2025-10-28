import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "SwapRouter"
import "SwapFactory"

/// Fully automatic script that tests common intermediate tokens
/// No need to specify intermediate tokens - it tests all known common tokens automatically

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
  access(all) let repaymentAmount: UFix64
  access(all) let testedRoutes: [RouteResult]
  access(all) let bestRoute: RouteResult?
  access(all) let directRouteResult: RouteResult?
  access(all) let profitImprovement: UFix64 // How much better is best route vs direct

  init(loanAmount: UFix64, flashLoanFee: UFix64, testedRoutes: [RouteResult]) {
    self.loanAmount = loanAmount
    self.flashLoanFee = flashLoanFee
    self.repaymentAmount = loanAmount + flashLoanFee
    self.testedRoutes = testedRoutes
    
    var bestProfit = 0.0
    var bestIndex: Int? = nil
    var directIndex: Int? = nil
    
    var i = 0
    while i < testedRoutes.length {
      let route = testedRoutes[i]
      
      if route.path.length == 3 {
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
    
    // Calculate improvement
    if self.bestRoute != nil && self.directRouteResult != nil {
      self.profitImprovement = self.bestRoute!.profit - self.directRouteResult!.profit
    } else {
      self.profitImprovement = 0.0
    }
  }
}

/// Test a route silently - returns nil if route doesn't exist
access(all) fun testRoute(
  routeName: String,
  path: [String],
  loanAmount: UFix64,
  flashLoanFee: UFix64
): RouteResult? {
  // Validate all pairs exist
  var i = 0
  while i < path.length - 1 {
    let pairAddr = SwapFactory.getPairAddress(token0Key: path[i], token1Key: path[i + 1])
    if pairAddr == nil {
      return nil
    }
    i = i + 1
  }
  
  // Calculate route
  let amounts = SwapRouter.getAmountsOut(amountIn: loanAmount, tokenKeyPath: path)
  
  return RouteResult(
    routeName: routeName,
    path: path,
    amounts: amounts,
    loanAmount: loanAmount,
    flashLoanFee: flashLoanFee
  )
}

/// Automatically find the best arbitrage route by testing common intermediate tokens
///
/// @param flashLoanAmount: Amount of FLOW to borrow
/// @return ComparisonResult with all routes tested and the best one highlighted
///
access(all) fun main(flashLoanAmount: UFix64): ComparisonResult {
  pre {
    flashLoanAmount > 0.0: "Flash loan amount must be greater than 0"
  }

  let flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier
  )
  let usdcKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
    vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier
  )

  let flashLoanFee = UFix64(SwapFactory.getFlashloanRateBps()) * flashLoanAmount / 10000.0
  let testedRoutes: [RouteResult] = []

  // Test direct route
  let directRoute = testRoute(
    routeName: "Direct: FLOW -> USDC -> FLOW",
    path: [flowKey, usdcKey, flowKey],
    loanAmount: flashLoanAmount,
    flashLoanFee: flashLoanFee
  )
  if directRoute != nil {
    testedRoutes.append(directRoute!)
  }

  // Define common intermediate tokens on Flow mainnet
  // These are well-known stablecoins and wrapped tokens with good liquidity
  let commonIntermediateTokens: {String: String} = {
    "stgUSDC": "A.1e4aa0b87d10b141.EVMVMBridgedToken_f1815bd50389c46847f0bda824ec8da914045d14.Vault",
    "stFlow": "A.d6f80565193ad727.stFlowToken.Vault",
    "USDF": "A.1e4aa0b87d10b141.EVMVMBridgedToken_2aabea2058b5ac2d339b163c6ab6f2b6d53aabed.Vault"
    // Add more as needed - these are the most common
  }

  // Test all intermediate token routes
  for tokenName in commonIntermediateTokens.keys {
    let tokenIdentifier = commonIntermediateTokens[tokenName]!
    let intermediateKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
      vaultTypeIdentifier: tokenIdentifier
    )
    
    // Route 1: FLOW -> intermediate -> USDC -> intermediate -> FLOW (symmetric)
    let route1 = testRoute(
      routeName: "Multi-hop (".concat(tokenName).concat("): FLOW -> ").concat(tokenName).concat(" -> USDC -> ").concat(tokenName).concat(" -> FLOW"),
      path: [flowKey, intermediateKey, usdcKey, intermediateKey, flowKey],
      loanAmount: flashLoanAmount,
      flashLoanFee: flashLoanFee
    )
    if route1 != nil {
      testedRoutes.append(route1!)
    }

    // Route 2: FLOW -> intermediate -> USDC -> FLOW (3-hop)
    let route2 = testRoute(
      routeName: "3-hop (".concat(tokenName).concat("): FLOW -> ").concat(tokenName).concat(" -> USDC -> FLOW"),
      path: [flowKey, intermediateKey, usdcKey, flowKey],
      loanAmount: flashLoanAmount,
      flashLoanFee: flashLoanFee
    )
    if route2 != nil {
      testedRoutes.append(route2!)
    }

    // Route 3: FLOW -> USDC -> intermediate -> FLOW (3-hop reverse)
    let route3 = testRoute(
      routeName: "3-hop (".concat(tokenName).concat("): FLOW -> USDC -> ").concat(tokenName).concat(" -> FLOW"),
      path: [flowKey, usdcKey, intermediateKey, flowKey],
      loanAmount: flashLoanAmount,
      flashLoanFee: flashLoanFee
    )
    if route3 != nil {
      testedRoutes.append(route3!)
    }
  }

  return ComparisonResult(
    loanAmount: flashLoanAmount,
    flashLoanFee: flashLoanFee,
    testedRoutes: testedRoutes
  )
}

// Example usage:
// flow scripts execute ./cadence/scripts/FindBestArbitrageRoute_Auto.cdc --network mainnet 10000.0
// 
// This script will:
// 1. Test the direct FLOW -> USDC -> FLOW route
// 2. Automatically test routes through stgUSDC
// 3. Automatically test routes through USDT
// 4. Return the best route with profit calculations
//
// No need to specify intermediate tokens - it's all automatic!

