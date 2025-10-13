import "FlowTransactionScheduler"

access(all) struct ActionStatus {
    access(all) let id: UInt64
    access(all) let status: String
    access(all) let timestamp: UFix64
    access(all) let priority: String
    access(all) let executionEffort: UInt64
    access(all) let scheduledBy: Address
    access(all) let exists: Bool

    init(
        id: UInt64,
        status: String,
        timestamp: UFix64,
        priority: String,
        executionEffort: UInt64,
        scheduledBy: Address,
        exists: Bool
    ) {
        self.id = id
        self.status = status
        self.timestamp = timestamp
        self.priority = priority
        self.executionEffort = executionEffort
        self.scheduledBy = scheduledBy
        self.exists = exists
    }
}

access(all) fun main(transactionId: UInt64): ActionStatus {
    let txData = FlowTransactionScheduler.getTransactionData(id: transactionId)
    
    if txData == nil {
        return ActionStatus(
            id: transactionId,
            status: "NOT_FOUND",
            timestamp: 0.0,
            priority: "UNKNOWN",
            executionEffort: 0,
            scheduledBy: Address(0x0),
            exists: false
        )
    }

    let data = txData!
    var priorityString = "UNKNOWN"
    
    switch data.priority {
        case FlowTransactionScheduler.Priority.Low:
            priorityString = "LOW"
        case FlowTransactionScheduler.Priority.Medium:
            priorityString = "MEDIUM"
        case FlowTransactionScheduler.Priority.High:
            priorityString = "HIGH"
    }

    var statusString = "UNKNOWN"
    switch data.status {
        case FlowTransactionScheduler.Status.Scheduled:
            statusString = "SCHEDULED"
        case FlowTransactionScheduler.Status.Executed:
            statusString = "EXECUTED"
        case FlowTransactionScheduler.Status.Canceled:
            statusString = "CANCELED"
    }

    return ActionStatus(
        id: transactionId,
        status: statusString,
        timestamp: data.scheduledTimestamp,
        priority: priorityString,
        executionEffort: data.executionEffort,
        scheduledBy: data.handlerAddress,
        exists: true
    )
}
