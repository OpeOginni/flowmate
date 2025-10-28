import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "IncrementFiFlashloanConnectors"
import "FungibleToken"
import "DeFiActions"
import "SwapInterfaces"
import "SwapConnectors"
import "EVM"
import "UniswapV2SwapConnectors"

/// Flash loan arbitrage transaction using mixed IncrementFi and UniswapV2 protocols
/// Route Option 1: FLOW -> USDC (IncrementFi) -> FLOW (UniswapV2)
/// Route Option 2: FLOW -> USDC (UniswapV2) -> FLOW (IncrementFi)
transaction(
  flashLoanAmount: UFix64, 
  incrementFiPairAddress: Address,
  uniswapRouterEVMAddress: String,
  flowEVMAddress: String,
  usdcEVMAddress: String,
  useIncrementFiFirst: Bool
) {

  let flasher: IncrementFiFlashloanConnectors.Flasher
  let incrementFiSwapper: IncrementFiSwapConnectors.Swapper
  let incrementFiSwapperReverse: IncrementFiSwapConnectors.Swapper
  let uniswapV2Swapper: UniswapV2SwapConnectors.Swapper
  let uniswapV2SwapperReverse: UniswapV2SwapConnectors.Swapper
  let flowVaultCap: &{FungibleToken.Vault}
  let flowKey: String
  let usdcFlowKey: String
  let initialFlowBalance: UFix64
  let executor: Capability<&{SwapInterfaces.FlashLoanExecutor}>
  let useIncrementFiFirst: Bool

  prepare(acct: auth(Storage, BorrowValue, Capabilities) &Account) {

    self.flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier)
    self.usdcFlowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier)
    self.useIncrementFiFirst = useIncrementFiFirst

    // Verify FlowToken vault exists
    if !acct.storage.check<@{FungibleToken.Vault}>(from: /storage/flowTokenVault) {
      panic("FlowToken vault not found")
    }

    // Verify USDCFlow vault exists
    if !acct.storage.check<@{FungibleToken.Vault}>(from: USDCFlow.VaultStoragePath) {
      panic("USDCFlow vault not found")
    }

    self.flowVaultCap = acct.storage.borrow<&{FungibleToken.Vault}>(from: /storage/flowTokenVault)!
    self.initialFlowBalance = self.flowVaultCap.balance
    
    // Create or get executor capability
    self.executor = acct.capabilities.storage.issue<&{SwapInterfaces.FlashLoanExecutor}>(IncrementFiFlashloanConnectors.ExecutorStoragePath)

    // Initialize flash loan connector for IncrementFi
    self.flasher = IncrementFiFlashloanConnectors.Flasher(
      pairAddress: incrementFiPairAddress,
      type: Type<@FlowToken.Vault>(),
      executor: self.executor,
      uniqueID: nil
    )

    // Create IncrementFi swapper for FLOW -> USDC
    self.incrementFiSwapper = IncrementFiSwapConnectors.Swapper(
      path: [self.flowKey, self.usdcFlowKey],
      inVault: Type<@FlowToken.Vault>(),
      outVault: Type<@USDCFlow.Vault>(),
      uniqueID: nil
    )

    // Create IncrementFi swapper for USDC -> FLOW
    self.incrementFiSwapperReverse = IncrementFiSwapConnectors.Swapper(
      path: [self.usdcFlowKey, self.flowKey],
      inVault: Type<@USDCFlow.Vault>(),
      outVault: Type<@FlowToken.Vault>(),
      uniqueID: nil
    )

    // Get or create COA capability for UniswapV2
    let coaCapability = acct.capabilities.get<auth(EVM.Owner) &EVM.CadenceOwnedAccount>(/public/evm)
    if !coaCapability.check() {
      panic("COA capability not found or invalid. Ensure you have set up a Cadence Owned Account for EVM interactions.")
    }

    // Parse EVM addresses
    let routerEVMAddr = EVM.addressFromString(uniswapRouterEVMAddress)
    let flowEVMAddr = EVM.addressFromString(flowEVMAddress)
    let usdcEVMAddr = EVM.addressFromString(usdcEVMAddress)

    // Create UniswapV2 swapper for FLOW -> USDC
    self.uniswapV2Swapper = UniswapV2SwapConnectors.Swapper(
      routerAddress: routerEVMAddr,
      path: [flowEVMAddr, usdcEVMAddr],
      inVault: Type<@FlowToken.Vault>(),
      outVault: Type<@USDCFlow.Vault>(),
      coaCapability: coaCapability,
      uniqueID: nil
    )

    // Create UniswapV2 swapper for USDC -> FLOW
    self.uniswapV2SwapperReverse = UniswapV2SwapConnectors.Swapper(
      routerAddress: routerEVMAddr,
      path: [usdcEVMAddr, flowEVMAddr],
      inVault: Type<@USDCFlow.Vault>(),
      outVault: Type<@FlowToken.Vault>(),
      coaCapability: coaCapability,
      uniqueID: nil
    )
  }

  pre {
    flashLoanAmount > 0.0: "Flash loan amount must be greater than 0"
  }

  execute {
    let callback = fun(fee: UFix64, loanedVault: @{FungibleToken.Vault}, data: AnyStruct?): @{FungibleToken.Vault} {
        // STEP 1: Receive flash loan of X FlowToken (must repay X + fee)
        let loanAmount = loanedVault.balance
        
        // STEP 2: Execute arbitrage - swap through two different DEXs
        var returnedVault: @{FungibleToken.Vault} <- (nil as @{FungibleToken.Vault}?)!
        
        if self.useIncrementFiFirst {
          // Route: FLOW -> USDC (IncrementFi) -> FLOW (UniswapV2)
          let quote1 = self.incrementFiSwapper.quoteOut(forProvided: loanedVault.balance, reverse: false)
          let usdcVault <- self.incrementFiSwapper.swap(quote: quote1, inVault: <-loanedVault)
          
          let quote2 = self.uniswapV2SwapperReverse.quoteOut(forProvided: usdcVault.balance, reverse: false)
          returnedVault <-! self.uniswapV2SwapperReverse.swap(quote: quote2, inVault: <-usdcVault)
        } else {
          // Route: FLOW -> USDC (UniswapV2) -> FLOW (IncrementFi)
          let quote1 = self.uniswapV2Swapper.quoteOut(forProvided: loanedVault.balance, reverse: false)
          let usdcVault <- self.uniswapV2Swapper.swap(quote: quote1, inVault: <-loanedVault)
          
          let quote2 = self.incrementFiSwapperReverse.quoteOut(forProvided: usdcVault.balance, reverse: false)
          returnedVault <-! self.incrementFiSwapperReverse.swap(quote: quote2, inVault: <-usdcVault)
        }
        
        // STEP 3: Calculate profit BEFORE repayment
        // Profit = returnedVault.balance - (loanAmount + fee)
        let repaymentAmount = loanAmount + fee
        let profit = returnedVault.balance - repaymentAmount
        
        // STEP 4: Extract profit and deposit into user's vault
        if profit > 0.0 {
            let profitVault <- returnedVault.withdraw(amount: profit)
            self.flowVaultCap.deposit(from: <-profitVault)
        }
        // Note: If profit <= 0, transaction will fail at post condition
        
        // STEP 5: Return loan + fee to flash loan provider
        // returnedVault now contains exactly repaymentAmount
        return <-returnedVault
    }

    self.flasher.flashLoan(amount: flashLoanAmount, data: nil, callback: callback)
  }

  post {
    self.flowVaultCap.balance >= self.initialFlowBalance: "Flash loan arbitrage should not decrease balance"
  }
}

