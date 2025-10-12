import "FlowToken"
import "FungibleToken"

transaction {

  let recipient: Address
  let amount: UFix64
  let withdrawCap: auth(FungibleToken.Withdraw) &{FungibleToken.Vault}?
  let initialBalance: UFix64

  prepare(acct: auth(BorrowValue) &Account) {
    // Initialize top-level variables
    self.recipient = Address(0xc98f078c5df34641)
    self.amount = 50.0

    // Borrow the withdraw capability and store initial balance
    if acct.storage.check<@{FungibleToken.Vault}>(from: /storage/flowTokenVault) {
      self.withdrawCap = acct.storage.borrow<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(from: /storage/flowTokenVault)
      self.initialBalance = self.withdrawCap!.balance
    } else {
      self.withdrawCap = nil
      self.initialBalance = 0.0
    }
  }

  pre {
    // Check that the account has a FLOW vault
    self.withdrawCap != nil: "Account does not have a FLOW vault"

    // Check that the account has sufficient balance
    self.withdrawCap!.balance >= self.amount: "Insufficient FLOW balance"

    // Check that recipient has a receiver capability
    getAccount(self.recipient).capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver) != nil: "Recipient does not have a FLOW receiver"
  }

  execute {
    // Withdraw the tokens
    let paymentVault <- self.withdrawCap!.withdraw(amount: self.amount)

    // Get recipient's receiver capability
    let recipientReceiverCap = getAccount(self.recipient).capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!

    // Deposit to recipient
    recipientReceiverCap.deposit(from: <-paymentVault)
  }

  post {
    // Verify that the balance decreased by the sent amount
    self.withdrawCap!.balance == self.initialBalance - self.amount: "Balance after transaction is incorrect"
  }
}

// flow transactions send -n mainnet ./cadence/transactions/SendToken.cdc --signer testnet