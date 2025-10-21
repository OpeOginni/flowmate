import "FungibleToken"
import "FlowToken"
import "USDCFlow"
import "FungibleTokenMetadataViews"

access(all) fun main(address: Address): UFix64 {
    let vaultData = USDCFlow.resolveContractView(resourceType: nil, viewType: Type<FungibleTokenMetadataViews.FTVaultData>()) as! FungibleTokenMetadataViews.FTVaultData?
        ?? panic("Could not get FTVaultData view for the FooToken contract")

    return getAccount(address).capabilities.borrow<&{FungibleToken.Balance}>(
            vaultData.metadataPath
        )?.balance
        ?? panic("Could not borrow a reference to the FooToken Vault in account "
            .concat(address.toString()).concat(" at path ").concat(vaultData.metadataPath.toString())
            .concat(". Make sure you are querying an address that has an FooToken Vault set up properly."))
}

// flow scripts execute -n mainnet ./cadence/scripts/GetBalance.cdc 0x136a10c590912ef8