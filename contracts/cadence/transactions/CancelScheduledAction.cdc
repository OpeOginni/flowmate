import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowToken"
import "FungibleToken"

transaction(transactionId: UInt64) {
    prepare(signer: auth(Storage, BorrowValue) &Account) {
        
        let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Manager not found. Run SetupFlowMateActions.cdc first")

        let vault = signer.storage.borrow<&FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")

        let refund <- manager.cancel(id: transactionId)
        vault.deposit(from: <-refund)
    }
}
