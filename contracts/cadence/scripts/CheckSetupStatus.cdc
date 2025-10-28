import "FlowTransactionSchedulerUtils"
import "FlowMateScheduledActionsHandler"

/// Check if a user has completed the FlowMate setup
/// Returns { "hasManager": Bool, "hasHandler": Bool, "isSetup": Bool }
access(all) fun main(address: Address): {String: Bool} {
    let account = getAccount(address)
    
    // Check if the transaction scheduler manager exists
    let hasManager = account.storage.check<@{FlowTransactionSchedulerUtils.Manager}>(
        from: FlowTransactionSchedulerUtils.managerStoragePath
    )
    
    // Check if the FlowMate action handler exists
    let hasHandler = account.storage.check<@FlowMateScheduledActionsHandler.Handler>(
        from: FlowMateScheduledActionsHandler.HandlerStoragePath
    )
    
    // Both must exist for full setup
    let isSetup = hasManager && hasHandler
    
    return {
        "hasManager": hasManager,
        "hasHandler": hasHandler,
        "isSetup": isSetup
    }
}

