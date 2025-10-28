import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowMateScheduledActionsHandler"
import "FlowToken"
import "USDCFlow"
import "FungibleToken"

transaction() {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        if !signer.storage.check<@{FlowTransactionSchedulerUtils.Manager}>(from: FlowTransactionSchedulerUtils.managerStoragePath) {
            let manager <- FlowTransactionSchedulerUtils.createManager()
            signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

            let managerCap = signer.capabilities.storage.issue<&{FlowTransactionSchedulerUtils.Manager}>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )
            signer.capabilities.publish(managerCap, at: FlowTransactionSchedulerUtils.managerPublicPath)
        }

        if !signer.storage.check<@FlowMateScheduledActionsHandler.Handler>(from: FlowMateScheduledActionsHandler.HandlerStoragePath) {
            
            let flowVaultCap = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(
                /storage/flowTokenVault
            )

            let usdcVaultCap = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(
                USDCFlow.VaultStoragePath
            )

            let handler <- FlowMateScheduledActionsHandler.createHandler(
                flowVaultCap: flowVaultCap,
                usdcVaultCap: usdcVaultCap
            )

            signer.storage.save(<-handler, to: FlowMateScheduledActionsHandler.HandlerStoragePath)

            let executeHandlerCap = signer.capabilities.storage.issue<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>(
                FlowMateScheduledActionsHandler.HandlerStoragePath
            )

            let publicHandlerCap = signer.capabilities.storage.issue<&{FlowTransactionScheduler.TransactionHandler}>(
                FlowMateScheduledActionsHandler.HandlerStoragePath
            )
            signer.capabilities.publish(publicHandlerCap, at: FlowMateScheduledActionsHandler.HandlerPublicPath)
        }
    }
}
