import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "FungibleToken"
import "DeFiActions"

transaction {

  let swapAmount: UFix64
  let flowKey: String
  let usdcFlowKey: String
  let swapper: IncrementFiSwapConnectors.Swapper
  let quote: {DeFiActions.Quote}
  let initialFlowBalance: UFix64
  let flowVaultCap: auth(FungibleToken.Withdraw) &{FungibleToken.Vault}?

  prepare(acct: auth(Storage, BorrowValue) &Account) {
    // Initialize swap parameters
    self.swapAmount = 5.0

    // Derive the path keys from the token types
    self.flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier)
    self.usdcFlowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier)

    // Create swapper for Flow -> USDCFlow
    self.swapper = IncrementFiSwapConnectors.Swapper(
      path: [self.flowKey, self.usdcFlowKey],
      inVault: Type<@FlowToken.Vault>(),
      outVault: Type<@USDCFlow.Vault>(),
      uniqueID: nil
    )

    // Get quote for the swap
    self.quote = self.swapper.quoteOut(forProvided: self.swapAmount, reverse: false)

    // Borrow withdraw capability and store initial balance
    if acct.storage.check<@{FungibleToken.Vault}>(from: /storage/flowTokenVault) {
      self.flowVaultCap = acct.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(from: /storage/flowTokenVault)
      self.initialFlowBalance = self.flowVaultCap!.balance
    } else {
      self.flowVaultCap = nil
      self.initialFlowBalance = 0.0
    }

    // Perform the swap with storage operations (since storage access is required)
    if self.flowVaultCap != nil {
      let flowVault <- self.flowVaultCap!.withdraw(amount: self.swapAmount)
      let returnedVault <- self.swapper.swap(quote: self.quote, inVault: <-flowVault)

      // Save the returned vault to storage
      acct.storage.save(<-returnedVault, to: /storage/flowTokenVault)
    }
  }

  pre {
    // Check that the account has a FLOW vault
    self.flowVaultCap != nil: "Account does not have a FLOW vault"

    // Check that the account has sufficient FLOW balance
    self.flowVaultCap!.balance >= self.swapAmount: "Insufficient FLOW balance for swap"

    // Check that the quote is valid
    self.quote.outAmount > 0.0: "Invalid swap quote"
  }

  execute {
    // Main transaction logic - in this case, the swap setup is already done
    // Additional business logic could go here if needed
  }

  post {
    // Verify that FLOW balance decreased by swap amount
    self.flowVaultCap!.balance == self.initialFlowBalance - self.swapAmount: "FLOW balance after swap is incorrect"
  }
}

// flow transactions send -n mainnet ./cadence/transactions/SwapperAction.cdc --signer testnet