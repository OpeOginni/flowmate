import "FungibleToken"
import "FlowToken"
import "USDCFlow"
import "stFlowToken"
import "FungibleTokenMetadataViews"

access(all) fun main(address: Address, token: String): UFix64 {

    if token != "FlowToken" && token != "USDCFlow" && token != "stFlowToken" {
        panic("Invalid token")
    }

    var balance: UFix64 = 0.0

    let FlowTokenVaultData: FungibleTokenMetadataViews.FTVaultData = FlowToken.resolveContractView(resourceType: nil, viewType: Type<FungibleTokenMetadataViews.FTVaultData>()) as! FungibleTokenMetadataViews.FTVaultData?
        ?? panic("Could not get FTVaultData view for the FooToken contract")

    let USDCFlowVaultData: FungibleTokenMetadataViews.FTVaultData = USDCFlow.resolveContractView(resourceType: nil, viewType: Type<FungibleTokenMetadataViews.FTVaultData>()) as! FungibleTokenMetadataViews.FTVaultData?
        ?? panic("Could not get FTVaultData view for the USDCFlow contract")

    let stFlowTokenVaultData: FungibleTokenMetadataViews.FTVaultData = stFlowToken.resolveContractView(resourceType: nil, viewType: Type<FungibleTokenMetadataViews.FTVaultData>()) as! FungibleTokenMetadataViews.FTVaultData?
        ?? panic("Could not get FTVaultData view for the stFlowToken contract")
        
    if token == "FlowToken" {
        balance = getAccount(address).capabilities.borrow<&{FungibleToken.Balance}>(
            FlowTokenVaultData.metadataPath
        )?.balance ?? 0.0
    } else if token == "USDCFlow" {
        balance = getAccount(address).capabilities.borrow<&{FungibleToken.Balance}>(
            USDCFlowVaultData.metadataPath
        )?.balance ?? 0.0
    } else if token == "stFlowToken" {
        balance = getAccount(address).capabilities.borrow<&{FungibleToken.Balance}>(
            stFlowTokenVaultData.metadataPath
        )?.balance ?? 0.0
    }

    return balance
}

// flow scripts execute -n mainnet ./cadence/scripts/GetBalance.cdc 0x136a10c590912ef8