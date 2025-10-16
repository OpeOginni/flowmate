import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "FungibleToken"
import "DeFiActions"

transaction(amount: UFix64, fromToken: String, toToken: String) {

  let swapAmount: UFix64
  let fromKey: String
  let toKey: String
  let swapper: IncrementFiSwapConnectors.Swapper
  let quote: {DeFiActions.Quote}
  let initialFromBalance: UFix64
  let fromVaultCap: auth(FungibleToken.Withdraw) &{FungibleToken.Vault}?
  let toVaultCap: &{FungibleToken.Vault}?
  var fromVaultType: Type?
  var toVaultType: Type?
  var fromStoragePath: StoragePath?
  var toStoragePath: StoragePath?

  prepare(acct: auth(Storage, BorrowValue) &Account) {
    // Initialize swap parameters
    self.swapAmount = amount
    self.fromVaultType = nil
    self.toVaultType = nil
    self.fromStoragePath = nil
    self.toStoragePath = nil

    // Determine vault types and storage paths based on token names
    if fromToken == "FlowToken" {
      self.fromVaultType = Type<@FlowToken.Vault>()
      self.fromStoragePath = /storage/flowTokenVault
    } else if fromToken == "USDCFlow" {
      self.fromVaultType = Type<@USDCFlow.Vault>()
      self.fromStoragePath = USDCFlow.VaultStoragePath
    } else {
      panic("Unsupported fromToken: ".concat(fromToken))
    }

    if toToken == "FlowToken" {
      self.toVaultType = Type<@FlowToken.Vault>()
      self.toStoragePath = /storage/flowTokenVault
    } else if toToken == "USDCFlow" {
      self.toVaultType = Type<@USDCFlow.Vault>()
      self.toStoragePath = USDCFlow.VaultStoragePath
    } else {
      panic("Unsupported toToken: ".concat(toToken))
    }

    if self.fromVaultType == nil {
      panic("Unsupported fromVaultType: ".concat(self.fromVaultType!.identifier))
    }
    if self.toVaultType == nil {
      panic("Unsupported toVaultType: ".concat(self.toVaultType!.identifier))
    }
    if self.fromStoragePath == nil {
      panic("Unsupported fromStoragePath")
    }
    if self.toStoragePath == nil {
      panic("Unsupported toStoragePath")
    }

    // Derive the path keys from the token types
    self.fromKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: self.fromVaultType!.identifier)
    self.toKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: self.toVaultType!.identifier)

    // Create swapper with dynamic token types
    self.swapper = IncrementFiSwapConnectors.Swapper(
      path: [self.fromKey, self.toKey],
      inVault: self.fromVaultType!,
      outVault: self.toVaultType!,
      uniqueID: nil
    )

    // Get quote for the swap
    self.quote = self.swapper.quoteOut(forProvided: self.swapAmount, reverse: false)

    if self.fromStoragePath == nil {
      panic("Unsupported fromStoragePath")
    }
    if self.toStoragePath == nil {
      panic("Unsupported toStoragePath")
    }

    // Borrow withdraw capability and store initial balance
    if acct.storage.check<@{FungibleToken.Vault}>(from: self.fromStoragePath!) {
      self.fromVaultCap = acct.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(from: self.fromStoragePath!)
      self.toVaultCap = acct.storage.borrow<&{FungibleToken.Vault}>(from: self.toStoragePath!)
      self.initialFromBalance = self.fromVaultCap!.balance
    } else {
      self.fromVaultCap = nil
      self.toVaultCap = nil
      self.initialFromBalance = 0.0
    }

    // Check that the account has the source token vault
    if self.fromVaultCap == nil {
      panic("Account does not have the source token vault")
    }

    // Check that the account has sufficient balance
    if self.fromVaultCap!.balance < self.swapAmount {
      panic("Insufficient balance for swap")
    }

    // Perform the swap with storage operations (since storage access is required)
    if self.fromVaultCap != nil {
      let fromVault <- self.fromVaultCap!.withdraw(amount: self.swapAmount)
      let returnedVault <- self.swapper.swap(quote: self.quote, inVault: <-fromVault)

      if self.toVaultCap != nil {
        self.toVaultCap!.deposit(from: <-returnedVault)
      } else {
        acct.storage.save(<-returnedVault, to: self.toStoragePath!)
      }
    }
  }

  pre {
    // Check that the quote is valid
    self.quote.outAmount > 0.0: "Invalid swap quote"

    self.fromVaultCap != nil: "Account does not have the source token vault"
  }

  execute {
    // Main transaction logic - in this case, the swap setup is already done
    // Additional business logic could go here if needed
  }

  post {
    // Verify that source token balance decreased by swap amount
    self.fromVaultCap!.balance == self.initialFromBalance - self.swapAmount: "Source token balance after swap is incorrect"
  }
}

// flow transactions send -n mainnet ./cadence/transactions/SwapperAction.cdc --signer mainnet