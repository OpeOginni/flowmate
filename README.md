# Flow Mate (Your personal Butler of the Flow Bloackchain)

Flow Mate is a personal helper on Flow that helps you with multiple tasks on the blockchain from sending tokens to swapping tokens in seconds. You dont have to click buttons or interact with Defi UI's to get what you want done. 

## Features

- **Flow Forte Actions Integration**: Makes use of Flow Actions brought in during the Flow Forte Upgrade, making it easier for transactions to be made for users to handle different types of operations on the blockchain, without having them interact with a custom contracts.
    - Sending Flow or USDCFlow to different addresses
    - Swapping between Flow and USDCFlow on IncrementFi
    - Get your Flow or USDCFlow balance on ask

- **AI-Powered Operations**: Handles AI operations using the Vercel AI SDK and implements agentic-tools. Based on the request of the user, it knows the correct tool to use and then generates the transaction the user needs to reach their goals. With this flow we can always append to the tools and Actions possible easily.

### Available Networks

The system can be used both on **Mainnet** and **Testnet**, best to test Swapping on Mainnet due to lack of proper trading liquidity on Testnet.

### Future Plans

- [ ] Add more Tools with the relsease of Flow Forte Upgrade on mainnet
    - [ ] Staking and Unstaking Flow
    - [ ] Engagging in Flash loan and swap operations (best for simple traders)
- [ ] Add feature for model to create scheduled transactions
- [ ] Add more defi systems than IncrementFi once other implement Flow Actions

### Tech Stack

- NextJs
- Tailwind
- AI SDK
- Cadence
- Flow Blockchain
- Flow React SDK `@onflow/react-sdk`
- Flow fcl `@onflow/fcl`

### Media

![Demo use](https://github.com/OpeOginni/flowmate/blob/main/media/FlowMate_Demo.png)
**Built during the Forte Hacks by Flow Hackathon**