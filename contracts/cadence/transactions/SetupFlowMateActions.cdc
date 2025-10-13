import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowMateActionHandler"
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

        if !signer.storage.check<@FlowMateActionHandler.Handler>(from: FlowMateActionHandler.HandlerStoragePath) {
            
            let flowVaultCap = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(
                /storage/flowTokenVault
            )

            let usdcVaultCap = signer.capabilities.storage.issue<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>(
                USDCFlow.VaultStoragePath
            )

            let handler <- FlowMateActionHandler.createHandler(
                flowVaultCap: flowVaultCap,
                usdcVaultCap: usdcVaultCap
            )

            signer.storage.save(<-handler, to: FlowMateActionHandler.HandlerStoragePath)

            let executeHandlerCap = signer.capabilities.storage.issue<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>(
                FlowMateActionHandler.HandlerStoragePath
            )

            let publicHandlerCap = signer.capabilities.storage.issue<&{FlowTransactionScheduler.TransactionHandler}>(
                FlowMateActionHandler.HandlerStoragePath
            )
            signer.capabilities.publish(publicHandlerCap, at: FlowMateActionHandler.HandlerPublicPath)
        }
    }
}
