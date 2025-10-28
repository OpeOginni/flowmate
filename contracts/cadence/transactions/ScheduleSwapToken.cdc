import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowMateScheduledActionsHandler"
import "FlowToken"
import "USDCFlow"
import "FungibleToken"

transaction(
    fromToken: String,
    toToken: String,
    amount: UFix64,
    timestamp: UFix64,
    priority: UInt8,
    executionEffort: UInt64,
    feeAmount: UFix64
) {
    prepare(signer: auth(Storage, BorrowValue, Capabilities) &Account) {
        
        // Auto-setup: Create manager if it doesn't exist
        if !signer.storage.check<@{FlowTransactionSchedulerUtils.Manager}>(from: FlowTransactionSchedulerUtils.managerStoragePath) {
            let manager <- FlowTransactionSchedulerUtils.createManager()
            signer.storage.save(<-manager, to: FlowTransactionSchedulerUtils.managerStoragePath)

            let managerCap = signer.capabilities.storage.issue<&{FlowTransactionSchedulerUtils.Manager}>(
                FlowTransactionSchedulerUtils.managerStoragePath
            )
            signer.capabilities.publish(managerCap, at: FlowTransactionSchedulerUtils.managerPublicPath)
        }

        // Auto-setup: Create handler if it doesn't exist
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
        
        let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Could not borrow manager after setup")

        var handlerCap: Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>? = nil
        
        let controllers = signer.capabilities.storage.getControllers(forPath: FlowMateScheduledActionsHandler.HandlerStoragePath)
        
        for controller in controllers {
            if let cap = controller.capability as? Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}> {
                handlerCap = cap
                break
            }
        }

        if handlerCap == nil {
            panic("Handler capability not found. Run SetupFlowMateActions.cdc first")
        }

        let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault")
        
        let fees <- vault.withdraw(amount: feeAmount) as! @FlowToken.Vault

        let priorityEnum = FlowTransactionScheduler.Priority(rawValue: priority)
            ?? FlowTransactionScheduler.Priority.Medium

        let actionData = FlowMateScheduledActionsHandler.ActionData(
            type: "swap_token",
            parameters: {
                "fromToken": fromToken,
                "toToken": toToken,
                "amount": amount
            }
        )

        var id = manager.schedule(
            handlerCap: handlerCap!,
            data: actionData,
            timestamp: timestamp,
            priority: priorityEnum,
            executionEffort: executionEffort,
            fees: <-fees
        )
    }
}
