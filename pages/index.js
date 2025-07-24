import React, { useEffect, useState } from 'react';
import BookVerification from '../components/BookVerification';
import { initWeb3Auth } from '../utils/web3auth';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  const [web3auth, setWeb3auth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setInitError(null);
        const web3authInstance = await initWeb3Auth();
        
        // Give Web3Auth extra time to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setWeb3auth(web3authInstance);
      } catch (error) {
        console.error('Failed to initialize Web3Auth:', error);
        setInitError(error.message);
        setWeb3auth(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!web3auth && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to initialize Web3Auth</p>
          {initError && (
            <p className="text-sm text-gray-600 mb-4">Error: {initError}</p>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <div className="container mx-auto py-12">
        <BookVerification web3auth={web3auth} />
      </div>
    </div>
  );
}