import "FlowTransactionScheduler"
import "FlowTransactionSchedulerUtils"

access(all) struct ScheduledActionInfo {
    access(all) let id: UInt64
    access(all) let timestamp: UFix64
    access(all) let status: String
    access(all) let priority: UInt8
    access(all) let executionEffort: UInt64

    init(
        id: UInt64,
        timestamp: UFix64,
        status: String,
        priority: UInt8,
        executionEffort: UInt64
    ) {
        self.id = id
        self.timestamp = timestamp
        self.status = status
        self.priority = priority
        self.executionEffort = executionEffort
    }
}

access(all) fun main(address: Address): [ScheduledActionInfo] {
    let account = getAccount(address)
    
    let managerRef = account.capabilities.borrow<&{FlowTransactionSchedulerUtils.Manager}>(
        FlowTransactionSchedulerUtils.managerPublicPath
    ) ?? panic("Manager not found for address")

    let scheduledIds = managerRef.getTransactionIDs()
    let actions: [ScheduledActionInfo] = []

    for id in scheduledIds {
        let txData = FlowTransactionScheduler.getTransactionData(id: id)
        if txData != nil {
            let info = ScheduledActionInfo(
                id: id,
                timestamp: txData!.scheduledTimestamp,
                status: txData!.status.rawValue.toString(),
                priority: txData!.priority.rawValue,
                executionEffort: txData!.executionEffort
            )
            actions.append(info)
        }
    }

    return actions
}
