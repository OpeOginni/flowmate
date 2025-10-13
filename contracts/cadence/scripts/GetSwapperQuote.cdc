import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "DeFiActions"

access(all) fun main(amount: UFix64, fromToken: String, toToken: String, reverse: Bool): UFix64 {
    
    var fromKey: String = ""
    var toKey: String = ""
    var inVaultType: Type? = nil
    var outVaultType: Type? = nil

    if fromToken == "FlowToken" {
        fromKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier)
        inVaultType = Type<@FlowToken.Vault>()
    } else if fromToken == "USDCFlow" {
        fromKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier)
        inVaultType = Type<@USDCFlow.Vault>()
    } else {
        panic("Unsupported fromToken: ".concat(fromToken))
    }

    if toToken == "FlowToken" {
        toKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier)
        outVaultType = Type<@FlowToken.Vault>()
    } else if toToken == "USDCFlow" {
        toKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier)
        outVaultType = Type<@USDCFlow.Vault>()
    } else {
        panic("Unsupported toToken: ".concat(toToken))
    }

    if inVaultType == nil {
        panic("Unsupported inVaultType: ".concat(inVaultType!.identifier))
    }
    if outVaultType == nil {
        panic("Unsupported outVaultType: ".concat(outVaultType!.identifier))
    }

    let swapper = IncrementFiSwapConnectors.Swapper(
        path: [fromKey, toKey],
        inVault: inVaultType!,
        outVault: outVaultType!,
        uniqueID: nil
    )

    let quote = swapper.quoteOut(forProvided: amount, reverse: reverse)
    
    return quote.outAmount
}
