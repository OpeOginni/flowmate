# Flow Mate - Your personal Butler of the Flow Bloackchain

![example use](https://github.com/OpeOginni/flowmate/blob/main/media/FlowMate_Demo.png)


Flow Mate is a personal helper **built on the Flow Blockchain** that helps you with multiple tasks on the blockchain from sending tokens to swapping tokens in seconds. You dont have to click buttons or interact with Defi UI's to get what you want done. 

## Features

- **Flow Forte Actions Integration**: Makes use of Flow Actions brought in during the Flow Forte Upgrade, making it easier for transactions to be made for users to handle different types of operations on the blockchain, without having them interact with a custom contracts.
    - Sending Flow or USDCFlow to different addresses
    - Swapping between Flow, USDCFlow and stFlow on IncrementFi
    - Get your Flow or USDCFlow balance on ask
    - Schedule Transfers and Swaps

- **AI-Powered Operations**: Handles AI operations using the Vercel AI SDK and implements agentic-tools. Based on the request of the user, it knows the correct tool to use and then generates the transaction the user needs to reach their goals. With this flow we can always append to the tools and Actions possible easily.

### Available Networks

The system can be used both on **Mainnet** and **Testnet**, best to test Swapping on Mainnet due to lack of proper trading liquidity on Testnet. Scheduler not deployed on Testnet yet.

### Deployed Flow Mate Scheduler Actions Contract

- Mainnet - [`0x136a10c590912ef8`](https://www.flowscan.io/contract/A.136a10c590912ef8.FlowMateScheduledActionsHandler)

### Future Plans

- [ ] Add more Tools with the release of Flow Forte Upgrade on mainnet
    - [ ] Staking and Unstaking Flow
    - [ ] Engagging in Flash loan and swap operations (best for simple traders)
- [x] Add feature for model to create scheduled transactions
    - [x] For Swapping Tokens
    - [x] For Sending Tokens
- [x] Used Smarter Model that is still cheap enough but good with understanding tool calls
- [ ] Add more defi systems than IncrementFi once other implement Flow Actions
- [ ] Improve UI/UX

### Tech Stack

- NextJs
- Tailwind
- AI SDK
- Cadence
- Flow Blockchain
- Flow React SDK `@onflow/react-sdk`
- Flow fcl `@onflow/fcl`

**Built by [Opeyemi](https://x.com/BrightOginni) during the Forte Hacks by Flow Hackathon**
