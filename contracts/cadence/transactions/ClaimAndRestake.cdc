import "FungibleToken"
import "DeFiActions"
import "SwapConnectors"
import "IncrementFiStakingConnectors"
import "IncrementFiPoolLiquidityConnectors"
import "Staking"

transaction(pid: UInt64) {
    let userCertificateCap: Capability<&Staking.UserCertificate>
    let pool: &{Staking.PoolPublic}
    let startingStake: UFix64
    let swapSource: SwapConnectors.SwapSource
    let expectedStakeIncrease: UFix64
    let operationID: DeFiActions.UniqueIdentifier

    prepare(acct: auth(BorrowValue, SaveValue, IssueStorageCapabilityController) &Account) {
        self.pool = IncrementFiStakingConnectors.borrowPool(pid: pid)
            ?? panic("Pool with ID \(pid) not found or not accessible")
        
        self.startingStake = self.pool.getUserInfo(address: acct.address)?.stakingAmount
            ?? panic("No user info for address \(acct.address)")
        
        self.userCertificateCap = acct.capabilities.storage
            .issue<&Staking.UserCertificate>(Staking.UserCertificateStoragePath)

        self.operationID = DeFiActions.createUniqueIdentifier()

        let pair = IncrementFiStakingConnectors.borrowPairPublicByPid(pid: pid)
            ?? panic("Pair with ID \(pid) not found or not accessible")

        let token0Type = IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pair.getPairInfoStruct().token0Key)
        let token1Type = IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pair.getPairInfoStruct().token1Key)
        
        let rewardsSource = IncrementFiStakingConnectors.PoolRewardsSource(
            userCertificate: self.userCertificateCap,
            pid: pid,
            uniqueID: self.operationID
        )
        
        let reverse = rewardsSource.getSourceType() != token0Type
        
        let zapper = IncrementFiPoolLiquidityConnectors.Zapper(
            token0Type: reverse ? token1Type : token0Type,
            token1Type: reverse ? token0Type : token1Type,
            stableMode: pair.getPairInfoStruct().isStableswap,
            uniqueID: self.operationID
        )
        
        let lpSource = SwapConnectors.SwapSource(
            swapper: zapper,
            source: rewardsSource,
            uniqueID: self.operationID
        )

        self.swapSource = lpSource
        
        self.expectedStakeIncrease = zapper.quoteOut(
            forProvided: lpSource.minimumAvailable(),
            reverse: false
        ).outAmount
    }

    post {
        self.pool.getUserInfo(address: self.userCertificateCap.address)!.stakingAmount
            >= self.startingStake + self.expectedStakeIncrease:
            "Restake below expected amount"
    }

    execute {
        let poolSink = IncrementFiStakingConnectors.PoolSink(
            pid: pid,
            staker: self.userCertificateCap.address,
            uniqueID: self.operationID
        )

        let vault <- self.swapSource.withdrawAvailable(maxAmount: poolSink.minimumCapacity())
        
        poolSink.depositCapacity(from: &vault as auth(FungibleToken.Withdraw) &{FungibleToken.Vault})
        
        assert(vault.balance == 0.0, message: "Residual after deposit")
        destroy vault
    }
}
