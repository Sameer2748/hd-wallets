"use client"
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const HomePage = () => {
  const chains = [
    { name: 'Solana', path: '/solana' },
    { name: 'Ethereum', path: '/ethereum' }
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-gray-300">Create</span>{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Hierarchical
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Deterministic (HD)
            </span>{' '}
            <span className="text-white">Wallets</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mt-8">
            Secure and scalable wallets supporting multiple blockchains.
          </p>
        </motion.div>

        {/* Chain Selection Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {chains.map((chain, index) => (
            <Link key={chain.name} href={chain.path}>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gray-200 text-black font-medium rounded-lg hover:bg-white transition-colors duration-200"
              >
                {chain.name}
              </motion.button>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;