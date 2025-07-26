import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';

export const getChainConfig = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID_HEX;
  const rpcTarget = process.env.NEXT_PUBLIC_GETBLOCK_RPC_URL;
  if (!chainId) throw new Error('Missing NEXT_PUBLIC_CHAIN_ID_HEX');
  if (!rpcTarget) throw new Error('Missing NEXT_PUBLIC_GETBLOCK_RPC_URL');
  return {
    chainNamespace: 'eip155',
    chainId,
    rpcTarget,
    displayName: 'MegaETH Testnet',
    blockExplorer: 'https://megaeth.blockscout.com',
    ticker: 'MEGA',
    tickerName: 'MegaETH',
  };
};