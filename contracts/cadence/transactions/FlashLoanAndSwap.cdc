// import "FlowToken"
// import "USDCFlow"
// import "SwapConfig"
// import "IncrementFiSwapConnectors"
// import "IncrementFiFlashloanConnectors"
// import "FungibleToken"
// import "DeFiActions"
// import "SwapInterfaces"

// transaction(flashLoanAmount: UFix64, pairAddress: Address) {

//   let flasher: IncrementFiFlashloanConnectors.Flasher
//   let swapper1: IncrementFiSwapConnectors.Swapper
//   let swapper2: IncrementFiSwapConnectors.Swapper
//   let flowVaultCap: &{FungibleToken.Vault}
//   let usdcVaultCap: &{FungibleToken.Vault}
//   let flowKey: String
//   let usdcFlowKey: String
//   let initialFlowBalance: UFix64
//   let executor: Capability<&{SwapInterfaces.FlashLoanExecutor}>

//   prepare(acct: auth(Storage, BorrowValue) &Account) {

//     self.flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier)
//     self.usdcFlowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier)

//     if !acct.storage.check<@{FungibleToken.Vault}>(from: /storage/flowTokenVault) {
//       panic("FlowToken vault not found")
//     }

//     if !acct.storage.check<@{FungibleToken.Vault}>(from: USDCFlow.VaultStoragePath) {
//       panic("USDCFlow vault not found")
//     }

//     self.flowVaultCap = acct.storage.borrow<&{FungibleToken.Vault}>(from: /storage/flowTokenVault)!
//     self.usdcVaultCap = acct.storage.borrow<&{FungibleToken.Vault}>(from: USDCFlow.VaultStoragePath)!
//     self.initialFlowBalance = self.flowVaultCap.balance
//     self.executor = acct.capabilities.borrow<&{SwapInterfaces.FlashLoanExecutor}>(from: IncrementFiFlashloanConnectors.ExecutorStoragePath)!

//     self.flasher = IncrementFiFlashloanConnectors.Flasher(
//       pairAddress: pairAddress,
//       type: Type<@FlowToken.Vault>(),
//       executor: self.executor,
//       uniqueID: nil
//     )

//     self.swapper1 = IncrementFiSwapConnectors.Swapper(
//       path: [self.flowKey, self.usdcFlowKey],
//       inVault: Type<@FlowToken.Vault>(),
//       outVault: Type<@USDCFlow.Vault>(),
//       uniqueID: nil
//     )

//     self.swapper2 = IncrementFiSwapConnectors.Swapper(
//       path: [self.usdcFlowKey, self.flowKey],
//       inVault: Type<@USDCFlow.Vault>(),
//       outVault: Type<@FlowToken.Vault>(),
//       uniqueID: nil
//     )
//   }

//   pre {
//     flashLoanAmount > 0.0: "Flash loan amount must be greater than 0"
//   }

//   execute {
//     let callback = fun(loanedVault: @{FungibleToken.Vault}): @{FungibleToken.Vault} {
//       let quote1 = self.swapper1.quoteOut(forProvided: loanedVault.balance, reverse: false)
      
//       let usdcVault <- self.swapper1.swap(quote: quote1, inVault: <-loanedVault)
      
//       let quote2 = self.swapper2.quoteOut(forProvided: usdcVault.balance, reverse: false)
      
//       let flowVault <- self.swapper2.swap(quote: quote2, inVault: <-usdcVault)
      
//       return <-flowVault
//     }

//     self.flasher.flashLoan(amount: flashLoanAmount, data: nil, callback: callback)
//   }

//   post {
//     self.flowVaultCap.balance >= self.initialFlowBalance: "Flash loan arbitrage should not decrease balance"
//   }
// }
