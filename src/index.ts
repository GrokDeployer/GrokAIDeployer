import 'dotenv/config';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { AnchorProvider } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { PumpFunSDK } from 'pumpdotfun-sdk';
import OpenAI from 'openai';
import readline from 'readline';
import axios from 'axios';

const { RPC, DEPLOYER_KEYPAIR, OPEN_API_KEY, GROK_API_KEY } = process.env;
const GITHUB_URL = 'https://replace_url';
const BUY_AMOUNT = 0;

const openai = new OpenAI({ apiKey: OPEN_API_KEY });

const generateKeypair = () => new Keypair();

const parseTokenMetadata = (rawResponse: string) => {
    const nameMatch = rawResponse.match(/Name:\s*(.+)$/m);
    const symbolMatch = rawResponse.match(/Symbol:\s*(.+)$/m);
    const descriptionMatch = rawResponse.match(/Description:\s*(.+)$/m);

    const name = nameMatch ? nameMatch[1].trim() : '';
    const symbol = symbolMatch ? symbolMatch[1].trim() : '';
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    console.log(`Parsed Metadata - Name: ${name}, Symbol: ${symbol}, Description: ${description}`); // Log parsed values

    return { name, symbol, description };
};

const askGrok = async () => {
    const API_KEY = GROK_API_KEY;
    const url = 'https://api.x.ai/v1/chat/completions';

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
    };
    console.log('Requesting name and symbol from Grok API...');
    const data = {
        messages: [{
            role: 'system',
            content: `With the given schema, generate token metadata. I need this token to be an edgy retarded meme that fits in well with the current trends and curren twitter memes. Make some online research if you have web access. Do not make a direct copy of the existing projects like doge, pepe etc. I want you to come up with something fresh, new. Name should suggest that the token is a real funny degen coin with twitter inspiration. Make sure description is a little memey and retarded - do not come up with anything over the top in terms of description, up to 15 words will suffice. The token should be animal-themed. 
            
            Schema: 
            {
                name: string,
                symbol: string,
                description: string,
            }
            
            Where name can contain a maximum of 32 letters, symbol can contain a maximum of around 4-6 letters, and description can contain a maximum of 100 letters. Symbol should be an abbreviation of the name.
            Return only json object.`
        }],
        model: 'grok-beta',
        stream: false,
        temperature: 1
    };

    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error('Error occurred:', error.response ? error.response.data : error.message);
    }
};

const fetchTokenMetadata = async () => {
    
    const response = await askGrok(); // Call the askGrok function

    if (!response || !response.choices || response.choices.length === 0) {
        console.error('No response received from OpenAI.');
        return;
    }

    const grokresult = response.choices[0].message.content.replace(/^```json\n/, "").replace(/\n```$/, "");

    console.log('Metadata generation complete.');
    let metadata = JSON.parse(grokresult);
    
    console.dir(metadata);

    const iconPrompt = `Create a cartoonish logo representing the token data (name, symbol, description) without text. 
    Name: ${metadata.name}, Symbol: ${metadata.symbol}, Description: ${metadata.description}`;

    console.log('Requesting icon from OpenAI...');
    const iconResponse = await openai.images.generate({
        prompt: iconPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        model: 'dall-e-3',
    });
    console.log('Icon generation complete.');

    const iconUrl = iconResponse.data[0].url;
    if (!iconUrl) throw new Error('Icon image URL not found.');

    console.log(`Icon image URL: ${iconUrl}`);
    const imageBlob = await fetch(iconUrl).then(res => res.blob());

    return {
        ...metadata,
        file: imageBlob,
        twitter: GITHUB_URL,
        telegram: GITHUB_URL,
        website: GITHUB_URL,
    };
};

const pauseForUserInput = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Press any key to continue with the deployment...', () => {
            rl.close();
            resolve(null);
        });
    });
};

const main = async () => {
    console.log('Starting script...');
    const connection = new Connection(RPC || '');
    const secretKey = bs58.decode(DEPLOYER_KEYPAIR || '');
    const wallet = Keypair.fromSecretKey(secretKey);
    const anchorWallet = new NodeWallet(wallet);
    const provider = new AnchorProvider(connection, anchorWallet, { commitment: 'finalized' });

    const sdk = new PumpFunSDK(provider);
    console.log('Generating token metadata...');

    try {
        const tokenMetadata = await fetchTokenMetadata();
        console.log('Token metadata ready:');
        console.dir(tokenMetadata);

        const mintKeypair = generateKeypair();
        console.log(`Token mint: ${mintKeypair.publicKey}`);

        await pauseForUserInput(); // Wait for user input before continuing

        console.log('Deploying token...');
        
        /*
        const createResults = await sdk.createAndBuy(
            wallet,
            mintKeypair,
            tokenMetadata,
            BigInt(BUY_AMOUNT * LAMPORTS_PER_SOL),
            BigInt(100),
            {
                unitLimit: 250000,
                unitPrice: 1000000,
            }
        );

        if (createResults.success) {
            console.log('Deployment finished successfully.');
            console.log(`View token at: https://pump.fun/${mintKeypair.publicKey.toBase58()}`);
        } else {
            console.error('Deployment failed:', createResults);
        }
        */
            
    } catch (error) {
        console.error('Error during execution:', error);
    }
};

main();
