import React, { useState } from 'react';
import { ethers } from 'ethers';
import { PrimeSdk, Web3WalletProvider } from '@etherspot/prime-sdk';
import { WALLET_ADAPTERS } from '@web3auth/base';
import { Oval } from 'react-loader-spinner';
import toast from 'react-hot-toast';
import { getContract, checkISBN } from '../utils/contract';
import { uploadToIPFS } from '../utils/ipfs';

const BookVerification = ({ web3auth }) => {
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [web3authReady, setWeb3authReady] = useState(false);

  // Check Web3Auth ready state
  React.useEffect(() => {
    const checkReadyState = async () => {
      if (web3auth && web3auth.status === 'ready') {
        // Additional check to ensure adapters are ready
        try {
          const adapters = web3auth.walletAdapters;
          const openloginAdapter = adapters[WALLET_ADAPTERS.OPENLOGIN];
          if (openloginAdapter && openloginAdapter.status === 'ready') {
            setWeb3authReady(true);
            return;
          }
        } catch (error) {
          console.log('Adapter not ready yet:', error);
        }
      }
      setWeb3authReady(false);
    };

    checkReadyState();
    
    // Poll for ready state if not ready
    const interval = setInterval(checkReadyState, 1000);
    
    return () => clearInterval(interval);
  }, [web3auth]);

  const connectWallet = async (loginProvider, retryCount = 0) => {
    try {
      setLoading(true);
      
      if (!web3auth) {
        throw new Error('Web3Auth is not initialized');
      }

      // Wait a bit more and retry if not ready
      if (!web3authReady) {
        if (retryCount < 3) {
          console.log(`Web3Auth not ready, retrying... (${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return await connectWallet(loginProvider, retryCount + 1);
        }
        throw new Error('Web3Auth is not ready yet. Please refresh the page and try again.');
      }
      
      // Check if already connected
      if (web3auth.connected) {
        console.log('Already connected to Web3Auth');
      } else {
        // Double-check adapter status before connecting
        const adapters = web3auth.walletAdapters;
        const openloginAdapter = adapters[WALLET_ADAPTERS.OPENLOGIN];
        
        if (!openloginAdapter || openloginAdapter.status !== 'ready') {
          throw new Error('OpenLogin adapter is not ready. Please wait and try again.');
        }
        
        // Connect to Web3Auth
        await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
          loginProvider,
          mfaLevel: 'none',
        });
      }

      const mappedProvider = new Web3WalletProvider(web3auth.provider);
      await mappedProvider.refresh();

      const etherspotPrimeSdk = new PrimeSdk(mappedProvider, {
        chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID_HEX)
      });

      const address = await etherspotPrimeSdk.getCounterFactualAddress();
      setWalletAddress(address);
      setIsConnected(true);
      
      return { mappedProvider, address };
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const verifyISBN = async () => {
    if (!isbn) {
      toast.error('Please enter an ISBN');
      return;
    }

    try {
      setLoading(true);
      
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_GETBLOCK_RPC_URL);
      const contract = getContract(provider);
      
      const result = await checkISBN(contract, isbn);
      setBookData(result);
      
      if (result.exists) {
        toast.success('Book NFT found!');
      } else {
        toast('This ISBN has not been minted yet', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Error verifying ISBN');
    } finally {
      setLoading(false);
    }
  };

  const mintBook = async (loginProvider) => {
    try {
      setLoading(true);
      
      let provider;
      if (!isConnected) {
        const connection = await connectWallet(loginProvider);
        if (!connection) return;
        provider = connection.mappedProvider;
      } else {
        provider = new Web3WalletProvider(web3auth.provider);
      }

      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();
      const contract = getContract(signer);

      const bookDetails = {
        isbn,
        title: `Book ${isbn}`,
        author: 'Unknown Author'
      };

      toast.loading('Uploading metadata to IPFS...');
      const ipfsUri = await uploadToIPFS(bookDetails);

      toast.loading('Minting NFT...');
      const tx = await contract.mintBook(
        walletAddress,
        bookDetails.isbn,
        bookDetails.title,
        bookDetails.author,
        ipfsUri
      );

      toast.loading('Waiting for confirmation...');
      await tx.wait();

      toast.success('Book NFT minted successfully!');
      
      await verifyISBN();
    } catch (error) {
      console.error('Minting error:', error);
      toast.error('Failed to mint NFT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Book NFT Verification</h1>
      
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Enter ISBN</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="978-0-123456-78-9"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={verifyISBN}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Verify
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <Oval height={40} width={40} color="#4F46E5" />
        </div>
      )}

      {bookData && !loading && (
        <div className="bg-gray-50 p-6 rounded-lg">
          {bookData.exists ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">Book NFT Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Token ID:</span> {bookData.tokenId}</p>
                <p><span className="font-medium">Owner:</span> {bookData.owner}</p>
                <p><span className="font-medium">Title:</span> {bookData.metadata.title}</p>
                <p><span className="font-medium">Author:</span> {bookData.metadata.author}</p>
                <p><span className="font-medium">Minted:</span> {new Date(bookData.metadata.mintedAt * 1000).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">This ISBN has not been minted yet.</p>
              {!isConnected ? (
                <div>
                  <p className="mb-4">Login to mint this book as an NFT:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => mintBook('google')}
                      disabled={loading || !web3auth || !web3authReady}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {web3authReady ? 'Login with Google' : 'Initializing...'}
                    </button>
                    <button
                      onClick={() => mintBook('github')}
                      disabled={loading || !web3auth || !web3authReady}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
                    >
                      {web3authReady ? 'Login with GitHub' : 'Initializing...'}
                    </button>
                  </div>
                  {web3auth && !web3authReady && (
                    <p className="text-sm text-gray-500 mt-2">Initializing Web3Auth... Please wait.</p>
                  )}
                  {!web3auth && (
                    <p className="text-sm text-gray-500 mt-2">Loading Web3Auth...</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => mintBook()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mint NFT
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isConnected && (
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
      )}
    </div>
  );
};

export default BookVerification;