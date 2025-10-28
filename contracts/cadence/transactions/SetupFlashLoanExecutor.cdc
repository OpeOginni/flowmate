import "IncrementFiFlashloanConnectors"
import "SwapInterfaces"

/// Setup transaction to create and store the FlashLoanExecutor resource
/// This must be run once before executing any flash loan transactions
transaction {
  prepare(acct: auth(Storage, Capabilities) &Account) {
    // Check if executor already exists
    if acct.storage.borrow<&IncrementFiFlashloanConnectors.Executor>(
      from: IncrementFiFlashloanConnectors.ExecutorStoragePath
    ) == nil {
      // Create and save the executor
      let executor <- IncrementFiFlashloanConnectors.createExecutor()
      acct.storage.save(<-executor, to: IncrementFiFlashloanConnectors.ExecutorStoragePath)
    }
  }
  
  execute {
    log("FlashLoanExecutor setup complete")
  }
}

// flow transactions send ./transactions/SetupFlashLoanExecutor.cdc

