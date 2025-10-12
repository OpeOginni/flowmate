import "FlowToken"
import "USDCFlow"
import "SwapConfig"
import "IncrementFiSwapConnectors"
import "DeFiActions"

access(all) fun main(): {String: {DeFiActions.Quote}} {
    // Derive the path keys from the token types
    let flowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@FlowToken.Vault>().identifier)
    let usdcFlowKey = SwapConfig.SliceTokenTypeIdentifierFromVaultType(vaultTypeIdentifier: Type<@USDCFlow.Vault>().identifier)

    // Minimal path Flow -> USDCFlow
    let swapper = IncrementFiSwapConnectors.Swapper(
      path: [
        flowKey,
        usdcFlowKey
      ],
      inVault: Type<@FlowToken.Vault>(),
      outVault: Type<@USDCFlow.Vault>(),
      uniqueID: nil
    )

    // Example: quote how much USDCFlow you'd get for 10.0 FLOW
    let qOut = swapper.quoteOut(forProvided: 5.0, reverse: false)
    // Note: Logs are only visible in the emulator console

    // // Example: quote how much FLOW you'd need to get 25.0 USDCFlow
    // let qIn = swapper.quoteIn(forDesired: 25.0, reverse: false)
    // // Note: Logs are only visible in the emulator console

    return {
        "qOut": qOut
        // "qIn": qIn
    }
}
