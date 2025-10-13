import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"
import "FlowMateActionHandler"
import "FlowToken"
import "FungibleToken"

transaction(
    recipient: Address,
    amount: UFix64,
    timestamp: UFix64,
    priority: UInt8,
    executionEffort: UInt64,
    feeAmount: UFix64,
    tokenType: String
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
            type: "send_token",
            parameters: {
                "recipient": recipient,
                "amount": amount,
                "tokenType": tokenType
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
