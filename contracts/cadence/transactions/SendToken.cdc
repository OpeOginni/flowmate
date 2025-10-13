import "FlowToken"
import "USDCFlow"
import "FungibleToken"

transaction(recipient: Address, amount: UFix64, tokenType: String) {

  var withdrawCap: auth(FungibleToken.Withdraw) &{FungibleToken.Vault}?
  var initialBalance: UFix64
  var receiverPath: PublicPath

  prepare(acct: auth(BorrowValue) &Account) {
    self.withdrawCap = nil
    self.initialBalance = 0.0
    self.receiverPath = /public/placeholder

    if tokenType == "FlowToken" {
      self.receiverPath = /public/flowTokenReceiver
      if acct.storage.check<@{FungibleToken.Vault}>(from: /storage/flowTokenVault) {
        self.withdrawCap = acct.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(from: /storage/flowTokenVault)
        self.initialBalance = self.withdrawCap!.balance
      } else {
        self.withdrawCap = nil
        self.initialBalance = 0.0
      }
    } else if tokenType == "USDCFlow" {
      self.receiverPath = USDCFlow.ReceiverPublicPath
      if acct.storage.check<@{FungibleToken.Vault}>(from: USDCFlow.VaultStoragePath) {
        self.withdrawCap = acct.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(from: USDCFlow.VaultStoragePath)
        self.initialBalance = self.withdrawCap!.balance
      } else {
        self.withdrawCap = nil
        self.initialBalance = 0.0
      }
    } else {
      panic("Unsupported token type: ".concat(tokenType))
    }
  }

  pre {
    self.withdrawCap != nil: "Account does not have a ".concat(tokenType).concat(" vault")
    self.withdrawCap!.balance >= amount: "Insufficient ".concat(tokenType).concat(" balance")
    getAccount(recipient).capabilities.get<&{FungibleToken.Receiver}>(self.receiverPath) != nil: "Recipient does not have a ".concat(tokenType).concat(" receiver")
  }

  execute {
    let paymentVault <- self.withdrawCap!.withdraw(amount: amount)
    let recipientReceiverCap = getAccount(recipient).capabilities.borrow<&{FungibleToken.Receiver}>(self.receiverPath)!
    recipientReceiverCap.deposit(from: <-paymentVault)
  }

  post {
    self.withdrawCap!.balance == self.initialBalance - amount: "Balance after transaction is incorrect"
  }
}