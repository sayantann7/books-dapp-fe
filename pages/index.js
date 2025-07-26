import React from 'react';
import BookVerification from '../components/BookVerification';
import { Toaster } from 'react-hot-toast';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <div className="container mx-auto py-12">
        <BookVerification />
      </div>
    </div>
  );
}