import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';

export const initWeb3Auth = async () => {
  try {
    const chainConfig = {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: process.env.NEXT_PUBLIC_CHAIN_ID_HEX,
      rpcTarget: process.env.NEXT_PUBLIC_GETBLOCK_RPC_URL,
      displayName: "Ethereum Sepolia",
      blockExplorer: "https://sepolia.etherscan.io",
      ticker: "ETH",
      tickerName: "Ethereum",
    };

    const web3auth = new Web3AuthNoModal({
      clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
      web3AuthNetwork: "sapphire_devnet",
      chainConfig,
    });

    const openloginAdapter = new OpenloginAdapter({
      adapterSettings: {
        uxMode: "popup",
        whiteLabel: {
          appName: "Book NFT Platform",
        },
      },
    });

    web3auth.configureAdapter(openloginAdapter);
    
    await web3auth.init();
    return web3auth;
  } catch (error) {
    console.error('Web3Auth initialization error:', error);
    throw error;
  }
};