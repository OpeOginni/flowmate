import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowMateActionHandler"
import "FlowToken"
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
        
        let manager = signer.storage.borrow<auth(FlowTransactionSchedulerUtils.Owner) &{FlowTransactionSchedulerUtils.Manager}>(
            from: FlowTransactionSchedulerUtils.managerStoragePath
        ) ?? panic("Manager not found. Run SetupFlowMateActions.cdc first")

        var handlerCap: Capability<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>? = nil
        
        let controllers = signer.capabilities.storage.getControllers(forPath: FlowMateActionHandler.HandlerStoragePath)
        
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

        let actionData = FlowMateActionHandler.ActionData(
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
