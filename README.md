# Grok Token Generator

This project is designed to make token creation and deployment on Solana incredibly straightforward. It harnesses the power of the new Grok API from X and OpenAI to generate a unique logo for each token, ensuring every launch has its own visual identity. After the logo is set, the PumpFun SDK steps in to handle the deployment process seamlessly on Solana. It’s a streamlined solution, giving you an efficient path from design to deployment, all while making sure your token stands out on the blockchain.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```
   RPC=<your_rpc_url>
   DEPLOYER_KEYPAIR=<your_deployer_keypair>
   OPEN_API_KEY=<your_openai_api_key>
   GROK_API_KEY=<your_grok_api_key>
   ```

## Usage

To run the project, execute the following command:
```bash
npx tsx src/index.ts
```

The script will generate token metadata and deploy the token on the Solana blockchain. Follow the prompts in the console to proceed with the deployment.
