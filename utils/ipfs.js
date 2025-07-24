import axios from 'axios';

const TATUM_API_KEY = process.env.NEXT_PUBLIC_TATUM_API_KEY;

export const uploadToIPFS = async (metadata) => {
  try {
    const metadataString = JSON.stringify({
      name: metadata.title,
      description: `Digital ownership certificate for ISBN: ${metadata.isbn}`,
      image: 'https://via.placeholder.com/350x500/4F46E5/FFFFFF?text=Book+NFT',
      attributes: [
        { trait_type: 'ISBN', value: metadata.isbn },
        { trait_type: 'Title', value: metadata.title },
        { trait_type: 'Author', value: metadata.author },
        { trait_type: 'Mint Date', value: new Date().toISOString() }
      ],
      properties: {
        isbn: metadata.isbn,
        title: metadata.title,
        author: metadata.author,
        category: 'book',
        type: 'ownership-certificate'
      }
    });

    const formData = new FormData();
    const blob = new Blob([metadataString], { type: 'application/json' });
    formData.append('file', blob, 'metadata.json');

    const response = await axios.post('https://api.tatum.io/v3/ipfs', formData, {
      headers: {
        'x-api-key': TATUM_API_KEY,
        'Content-Type': 'multipart/form-data'
      }
    });

    return `ipfs://${response.data.ipfsHash}`;
  } catch (error) {
    console.error('Error uploading to Tatum IPFS:', error);
    throw error;
  }
};