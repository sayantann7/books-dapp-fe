import React, { createContext, useContext, useEffect, useState } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { getChainConfig } from '../utils/web3auth';

const Web3AuthContext = createContext({ web3auth: null });

export const Web3AuthProvider = ({ children }) => {
  const [web3auth, setWeb3auth] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = getChainConfig();
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig }
        });
        const web3authInstance = new Web3Auth({
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
          chainConfig,
          privateKeyProvider,
        });
        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: 'testnet', // or 'mainnet' if using mainnet
            uxMode: 'popup',
            whiteLabel: {
              appName: 'Book NFT Platform',
            },
          },
        });
        web3authInstance.configureAdapter(openloginAdapter);
        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);
      } catch (err) {
        console.error('Web3AuthProvider error:', err);
        if (err && err.stack) {
          console.error('Stack:', err.stack);
        }
      }
    };
    init();
  }, []);

  return (
    <Web3AuthContext.Provider value={{ web3auth }}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = () => useContext(Web3AuthContext); 