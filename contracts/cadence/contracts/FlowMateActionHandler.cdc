import "FlowTransactionScheduler"
import "FungibleToken"
import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "DeFiActions"
import "MetadataViews"

access(all) contract FlowMateActionHandler {

    access(all) let HandlerStoragePath: StoragePath
    access(all) let HandlerPublicPath: PublicPath

    access(all) event ActionExecuted(id: UInt64, actionType: String, success: Bool, message: String)
    access(all) event SendTokenExecuted(id: UInt64, recipient: Address, amount: UFix64, tokenType: String)
    access(all) event SwapTokenExecuted(id: UInt64, fromToken: String, toToken: String, amountIn: UFix64, amountOut: UFix64)
    access(all) event RecurringPaymentExecuted(id: UInt64, recipient: Address, amount: UFix64, tokenType: String)
    access(all) event BatchSendExecuted(id: UInt64, recipientCount: Int, totalAmount: UFix64)

    access(all) struct ActionData {
        access(all) let type: String
        access(all) let parameters: {String: AnyStruct}

        init(type: String, parameters: {String: AnyStruct}) {
            self.type = type
            self.parameters = parameters
        }
    }

    access(all) resource Handler: FlowTransactionScheduler.TransactionHandler {
        
        access(all) let flowVaultCap: Capability<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>
        access(all) let usdcVaultCap: Capability<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>

        init(
            flowVaultCap: Capability<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>,
            usdcVaultCap: Capability<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>
        ) {
            self.flowVaultCap = flowVaultCap
            self.usdcVaultCap = usdcVaultCap
        }

        access(FlowTransactionScheduler.Execute) 
        fun executeTransaction(id: UInt64, data: AnyStruct?) {
            let actionData = data as? ActionData
                ?? panic("Invalid action data provided")

            switch actionData.type {
                case "send_token":
                    self.executeSendToken(id: id, params: actionData.parameters)
                case "swap_token":
                    self.executeSwapToken(id: id, params: actionData.parameters)
                case "recurring_payment":
                    self.executeRecurringPayment(id: id, params: actionData.parameters)
                case "batch_send":
                    self.executeBatchSend(id: id, params: actionData.parameters)
                default:
                    emit ActionExecuted(id: id, actionType: actionData.type, success: false, message: "Unknown action type")
                    panic("Unknown action type: ".concat(actionData.type))
            }
        }

        access(self) fun executeSendToken(id: UInt64, params: {String: AnyStruct}) {
            let recipient = params["recipient"] as? Address
                ?? panic("Missing or invalid recipient address")
            let amount = params["amount"] as? UFix64
                ?? panic("Missing or invalid amount")
            let tokenType = params["tokenType"] as? String ?? "FlowToken"

            let vaultCap = tokenType == "FlowToken" ? self.flowVaultCap : self.usdcVaultCap
            let vault = vaultCap.borrow()
                ?? panic("Could not borrow vault capability")

            if vault.balance < amount {
                emit ActionExecuted(id: id, actionType: "send_token", success: false, message: "Insufficient balance")
                panic("Insufficient balance")
            }

            let paymentVault <- vault.withdraw(amount: amount)

            let receiverPath = tokenType == "FlowToken" 
                ? /public/flowTokenReceiver 
                : USDCFlow.ReceiverPublicPath

            let receiverCap = getAccount(recipient)
                .capabilities.borrow<&{FungibleToken.Receiver}>(receiverPath)
                ?? panic("Recipient does not have a receiver capability")

            receiverCap.deposit(from: <-paymentVault)

            emit SendTokenExecuted(id: id, recipient: recipient, amount: amount, tokenType: tokenType)
            emit ActionExecuted(id: id, actionType: "send_token", success: true, message: "Token sent successfully")
        }

        access(self) fun executeSwapToken(id: UInt64, params: {String: AnyStruct}) {
            let fromToken = params["fromToken"] as? String ?? "FlowToken"
            let toToken = params["toToken"] as? String ?? "USDCFlow"
            let amount = params["amount"] as? UFix64
                ?? panic("Missing or invalid amount")

            let fromVaultCap = fromToken == "FlowToken" ? self.flowVaultCap : self.usdcVaultCap
            let toVaultCap = toToken == "FlowToken" ? self.flowVaultCap : self.usdcVaultCap

            let fromVault = fromVaultCap.borrow()
                ?? panic("Could not borrow source vault")

            if fromVault.balance < amount {
                emit ActionExecuted(id: id, actionType: "swap_token", success: false, message: "Insufficient balance for swap")
                panic("Insufficient balance for swap")
            }

            let fromKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
                vaultTypeIdentifier: fromToken == "FlowToken" 
                    ? Type<@FlowToken.Vault>().identifier 
                    : Type<@USDCFlow.Vault>().identifier
            )
            let toKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(
                vaultTypeIdentifier: toToken == "FlowToken" 
                    ? Type<@FlowToken.Vault>().identifier 
                    : Type<@USDCFlow.Vault>().identifier
            )

            let swapper = IncrementFiSwapConnectors.Swapper(
                path: [fromKey, toKey],
                inVault: fromToken == "FlowToken" ? Type<@FlowToken.Vault>() : Type<@USDCFlow.Vault>(),
                outVault: toToken == "FlowToken" ? Type<@FlowToken.Vault>() : Type<@USDCFlow.Vault>(),
                uniqueID: nil
            )

            let quote = swapper.quoteOut(forProvided: amount, reverse: false)

            if quote.outAmount <= 0.0 {
                emit ActionExecuted(id: id, actionType: "swap_token", success: false, message: "Invalid swap quote")
                panic("Invalid swap quote")
            }

            let inputVault <- fromVault.withdraw(amount: amount)
            let outputVault <- swapper.swap(quote: quote, inVault: <-inputVault)

            let amountOut = outputVault.balance

            let toVault = toVaultCap.borrow()
                ?? panic("Could not borrow destination vault")
            toVault.deposit(from: <-outputVault)

            emit SwapTokenExecuted(id: id, fromToken: fromToken, toToken: toToken, amountIn: amount, amountOut: amountOut)
            emit ActionExecuted(id: id, actionType: "swap_token", success: true, message: "Swap executed successfully")
        }

        access(self) fun executeRecurringPayment(id: UInt64, params: {String: AnyStruct}) {
            self.executeSendToken(id: id, params: params)
            emit RecurringPaymentExecuted(
                id: id, 
                recipient: params["recipient"] as! Address, 
                amount: params["amount"] as! UFix64, 
                tokenType: params["tokenType"] as? String ?? "FlowToken"
            )
        }

        access(self) fun executeBatchSend(id: UInt64, params: {String: AnyStruct}) {
            let recipients = params["recipients"] as? {Address: UFix64}
                ?? panic("Missing or invalid recipients")
            let tokenType = params["tokenType"] as? String ?? "FlowToken"

            let vaultCap = tokenType == "FlowToken" ? self.flowVaultCap : self.usdcVaultCap
            let vault = vaultCap.borrow()
                ?? panic("Could not borrow vault capability")

            var totalAmount: UFix64 = 0.0
            for amount in recipients.values {
                totalAmount = totalAmount + amount
            }

            if vault.balance < totalAmount {
                emit ActionExecuted(id: id, actionType: "batch_send", success: false, message: "Insufficient balance for batch send")
                panic("Insufficient balance for batch send")
            }

            let receiverPath = tokenType == "FlowToken" 
                ? /public/flowTokenReceiver 
                : USDCFlow.ReceiverPublicPath

            for recipient in recipients.keys {
                let amount = recipients[recipient]!
                let paymentVault <- vault.withdraw(amount: amount)

                let receiverCap = getAccount(recipient)
                    .capabilities.borrow<&{FungibleToken.Receiver}>(receiverPath)
                    ?? panic("Recipient ".concat(recipient.toString()).concat(" does not have a receiver capability"))

                receiverCap.deposit(from: <-paymentVault)
            }

            emit BatchSendExecuted(id: id, recipientCount: recipients.length, totalAmount: totalAmount)
            emit ActionExecuted(id: id, actionType: "batch_send", success: true, message: "Batch send completed successfully")
        }

        access(all) view fun getViews(): [Type] {
            return [
                Type<StoragePath>(), 
                Type<PublicPath>(), 
                Type<MetadataViews.Display>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<StoragePath>():
                    return FlowMateActionHandler.HandlerStoragePath
                case Type<PublicPath>():
                    return FlowMateActionHandler.HandlerPublicPath
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "FlowMate Universal Action Handler",
                        description: "Handles all scheduled actions for FlowMate including send, swap, recurring payments, and batch operations",
                        thumbnail: MetadataViews.HTTPFile(url: "")
                    )
                default:
                    return nil
            }
        }
    }

    access(all) fun createHandler(
        flowVaultCap: Capability<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>,
        usdcVaultCap: Capability<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>
    ): @Handler {
        return <- create Handler(flowVaultCap: flowVaultCap, usdcVaultCap: usdcVaultCap)
    }

    init() {
        self.HandlerStoragePath = /storage/flowMateActionHandler
        self.HandlerPublicPath = /public/flowMateActionHandler
    }
}
