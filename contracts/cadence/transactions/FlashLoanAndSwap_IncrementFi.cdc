import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "IncrementFiFlashloanConnectors"
import "FungibleToken"
import "DeFiActions"
import "SwapInterfaces"
import "SwapConnectors"

/// Flash loan arbitrage transaction using only IncrementFi protocol
/// Route: FLOW -> USDC -> FLOW via IncrementFi swaps
transaction(flashLoanAmount: UFix64, incrementFiPairAddress: Address) {

  let flasher: IncrementFiFlashloanConnectors.Flasher
  let multiSwapper: SwapConnectors.MultiSwapper
  let flowVaultCap: &{FungibleToken.Vault}
  let flowKey: String
  let usdcFlowKey: String
  let initialFlowBalance: UFix64
  let executor: Capability<&{SwapInterfaces.FlashLoanExecutor}>

  prepare(acct: auth(Storage, BorrowValue, Capabilities) &Account) {

    self.flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier)
    self.usdcFlowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier)

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

    // Initialize flash loan connector
    self.flasher = IncrementFiFlashloanConnectors.Flasher(
      pairAddress: incrementFiPairAddress,
      type: Type<@FlowToken.Vault>(),
      executor: self.executor,
      uniqueID: nil
    )

    // Create swapper for FLOW -> USDC
    let swapper1 = IncrementFiSwapConnectors.Swapper(
      path: [self.flowKey, self.usdcFlowKey],
      inVault: Type<@FlowToken.Vault>(),
      outVault: Type<@USDCFlow.Vault>(),
      uniqueID: nil
    )

    // Create swapper for USDC -> FLOW
    let swapper2 = IncrementFiSwapConnectors.Swapper(
      path: [self.usdcFlowKey, self.flowKey],
      inVault: Type<@USDCFlow.Vault>(),
      outVault: Type<@FlowToken.Vault>(),
      uniqueID: nil
    )

    // Combine swappers into multi-swapper for optimized routing
    self.multiSwapper = SwapConnectors.MultiSwapper(
      inVault: Type<@FlowToken.Vault>(),
      outVault: Type<@FlowToken.Vault>(),
      swappers: [swapper1, swapper2],
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
        
        // STEP 2: Execute arbitrage through multi-swap (FLOW -> USDC -> FLOW)
        // If profitable, returnedVault will have MORE than loanAmount + fee
        let quote = self.multiSwapper.quoteOut(forProvided: loanedVault.balance, reverse: false)
        let returnedVault <- self.multiSwapper.swap(quote: quote, inVault: <-loanedVault)
        
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

