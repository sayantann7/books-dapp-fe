import { ethers } from 'ethers';
import BookNFTABI from '../contracts/BookNFT.json';
import contractAddress from './contractAddress.json';

export const getContract = (signer) => {
  return new ethers.Contract(
    contractAddress.BookNFT,
    BookNFTABI.abi,
    signer
  );
};

export const checkISBN = async (contract, isbn) => {
  try {
    // First check if contract is accessible
    const code = await contract.provider.getCode(contract.address);
    if (code === '0x') {
      throw new Error('Contract not deployed at this address');
    }
    
    const exists = await contract.isbnExists(isbn);
    console.log(`ISBN ${isbn} exists:`, exists);
    
    if (exists) {
      const data = await contract.getBookByISBN(isbn);
      return {
        exists: true,
        tokenId: data.tokenId.toString(),
        owner: data.owner,
        metadata: data.metadata
      };
    }
    return { exists: false };
  } catch (error) {
    console.error('Error checking ISBN:', error);
    if (error.message.includes('contract')) {
      throw new Error('Smart contract not accessible. Please check if it\'s deployed to MegaETH testnet.');
    }
    throw error;
  }
};