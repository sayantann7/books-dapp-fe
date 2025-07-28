import React, { useState } from 'react';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';
import { Oval } from 'react-loader-spinner';
import toast from 'react-hot-toast';
import { getContract, checkISBN } from '../utils/contract';
import { uploadToIPFS } from '../utils/ipfs';

const BookVerification = () => {
  const { authenticated, login, logout, user, ready, wallet } = usePrivy();
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookData, setBookData] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!authenticated) {
        await login();
        return;
      }
      if (!wallet?.address || !wallet?.ethereumProvider) {
        throw new Error('No wallet connected');
      }
      setWalletAddress(wallet.address);
      return {
        ethersProvider: new ethers.providers.Web3Provider(wallet.ethereumProvider, 'any'),
        address: wallet.address,
      };
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

  const mintBook = async () => {
    try {
      setLoading(true);
      if (!authenticated) {
        await login();
        return;
      }
      if (!wallet?.address || !wallet?.ethereumProvider) {
        throw new Error('No wallet connected');
      }
      const ethersProvider = new ethers.providers.Web3Provider(wallet.ethereumProvider, 'any');
      const signer = ethersProvider.getSigner();
      const contract = getContract(signer);
      const bookDetails = {
        isbn,
        title: `Book ${isbn}`,
        author: 'Unknown Author',
      };
      toast.loading('Uploading metadata to IPFS...');
      const ipfsUri = await uploadToIPFS(bookDetails);
      toast.loading('Minting NFT...');
      const tx = await contract.mintBook(
        wallet.address,
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
              {!authenticated ? (
                <div>
                  <p className="mb-4">Login to mint this book as an NFT:</p>
                  <button
                    onClick={login}
                    disabled={loading || !ready}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Login with Privy
                  </button>
                </div>
              ) : (
                <button
                  onClick={mintBook}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mint NFT
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {authenticated && wallet?.address && (
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            Connected: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
            <button onClick={logout} className="ml-4 px-2 py-1 bg-gray-200 rounded">Logout</button>
          </p>
        </div>
      )}
    </div>
  );
};

export default BookVerification;