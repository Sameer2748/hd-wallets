
"use client"
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Copy, Trash2, Sun, Moon, Grid3X3, List } from 'lucide-react';
import { Keypair } from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { toast } from 'sonner';
import Link from 'next/link';
import { fetchWalletBalance } from '@/utils/lib';

type WalletKeyPair = {
  publicKey: string;
  privateKey: string;
  balance:string;
};

export default function SolanaWalletComponent() {
  const [mnemonic, setMnemonic] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [wallets, setWallets] = useState<WalletKeyPair[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<Set<number>>(new Set());
  const [isGridView, setIsGridView] = useState(true);

  useEffect(() => {
    const loadWalletsAndBalances = async () => {
      const localMnemonic = localStorage.getItem("mnemonic");
      const localWallets = localStorage.getItem("wallets");
  
      if (localMnemonic) {
        setMnemonic(localMnemonic);
      }
  
      if (localWallets) {
        const parsedWallets: WalletKeyPair[] = JSON.parse(localWallets);
        if (parsedWallets.length === 0) return;
  
        console.log(`Fetching balances for ${parsedWallets.length} Solana wallets...`);
  
        try {
          const balancePromises = parsedWallets.map(async (wallet, index) => {
            try {
              const res = await fetch(`/api/get-sol-balance?publicKey=${encodeURIComponent(wallet.publicKey)}`);
              if (!res.ok) {
                console.error(`API error for wallet ${index + 1}:`, res.status);
                return { ...wallet, balance: '0' };
              }
              const result = await res.json();
              const balance = result.success ? result.balance.toString() : '0';
              console.log(`Wallet ${index + 1}: ${balance} SOL`);
              return { ...wallet, balance };
            } catch (err) {
              console.error(`Error fetching balance for wallet ${index + 1}:`, err);
              return { ...wallet, balance: '0' };
            }
          });
  
          const walletsWithBalances = await Promise.all(balancePromises);
  
          setWallets(walletsWithBalances);
          localStorage.setItem("wallets", JSON.stringify(walletsWithBalances));
  
          console.log("All Solana wallet balances fetched successfully!");
        } catch (error) {
          console.error("Error fetching wallet balances:", error);
        }
      }
    };
  
    loadWalletsAndBalances();
  }, []);
  
  
  const createMnemonic = () => {
    let localMnemonic = localStorage.getItem("mnemonic");
    if (localMnemonic) {
      toast.error("You already have a mnemonic phrase!");
      return;
    }
    const newMnemonic = generateMnemonic();
    if (newMnemonic) {
      setMnemonic(newMnemonic);
      localStorage.setItem("mnemonic", newMnemonic);
      toast.success("Secret phrase generated successfully!");
    } else {
      toast.error("Error creating mnemonic. Please try again!");
    }
  }

  const deleteMnemonic = () => {
    setMnemonic("");
    setWallets([]);
    setCurrentIndex(0);
    localStorage.removeItem("mnemonic");
    localStorage.removeItem("wallets");
    toast.success("All wallets and mnemonic cleared successfully!");
  }

  const createWallet = async () => {
    if (!mnemonic) {
      createMnemonic();
      return;
    }
  
    try {
      const seed = await mnemonicToSeed(mnemonic);
      const path = `m/44'/501'/${currentIndex}'/0'`;
      const derivedPath = derivePath(path, seed.toString("hex")).key;
      const secret = nacl.sign.keyPair.fromSeed(derivedPath).secretKey;
      const keyPair = Keypair.fromSecretKey(secret);
  
      const publicKey = keyPair.publicKey.toBase58();
      const privateKey = bs58.encode(keyPair.secretKey);
  
      if (publicKey && privateKey) {
        // Create the wallet object first
        const newWallet = { 
          publicKey, 
          privateKey,
          balance: 'Loading...' // Show loading state initially
        };
  
        // Add wallet to state immediately
        setWallets(prev => {
          const updatedWallets = [...prev, newWallet];
          localStorage.setItem("wallets", JSON.stringify(updatedWallets));
          return updatedWallets;
        });
  
        setCurrentIndex(prev => prev + 1);
        toast.success(`Wallet ${currentIndex + 1} created successfully!`);
  
        // Fetch balance for the new wallet
        try {
          console.log(`Fetching balance for new Solana wallet: ${publicKey}`);
        
          const res = await fetch(`/api/get-sol-balance?publicKey=${encodeURIComponent(publicKey)}`);
          const result = await res.json();
        
          const balance = result.success ? result.balance.toString() : '0';
          console.log(`New wallet balance: ${balance} SOL`);
        
          setWallets(prev => {
            const updatedWallets = prev.map((wallet, index) =>
              index === prev.length - 1 ? { ...wallet, balance } : wallet
            );
            localStorage.setItem("wallets", JSON.stringify(updatedWallets));
            return updatedWallets;
          });
        
          toast.success(`Balance loaded: ${balance} SOL`);
        } catch (balanceError) {
          console.error("Error fetching balance for new wallet:", balanceError);
        
          setWallets(prev => {
            const updatedWallets = prev.map((wallet, index) =>
              index === prev.length - 1 ? { ...wallet, balance: '0' } : wallet
            );
            localStorage.setItem("wallets", JSON.stringify(updatedWallets));
            return updatedWallets;
          });
        
          toast.error("Failed to fetch balance for new wallet");
        }
        
      } else {
        toast.error("Wallet creation failed. Please try again!");
      }
    } catch (error) {
      toast.error("Failed to create wallet. Please try again!");
    }
  };
  

  const deleteWallet = (idx: number) => {
    setWallets(prev => {
      const updatedWallets = prev.filter((_, i) => i !== idx);
      localStorage.setItem("wallets", JSON.stringify(updatedWallets));
      return updatedWallets;
    });
    toast.success(`Wallet ${idx + 1} deleted successfully!`);
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error("Failed to copy to clipboard!");
    }
  }

  const togglePrivateKeyVisibility = (index: number) => {
    setVisiblePrivateKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }

  const mnemonicWords = mnemonic ? mnemonic.split(" ") : [];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0a] text-[#ffffff]' : 'bg-[#ffffff] text-[#0a0a0a]'}`}>
      <div className="container mx-auto px-8 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isDarkMode ? 'bg-[#ffffff]' : 'bg-[#0a0a0a]'} rounded-xl flex items-center justify-center`}>
              <div className={`w-6 h-6 border-1 ${isDarkMode ? 'border-[#0a0a0a]' : 'border-[#ffffff]'} rounded`}></div>
            </div>
            <Link href={"/"}>
            <span className="text-3xl font-bold">Solana Wallets</span>
              </Link>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Conditional Rendering based on mnemonic presence */}
        {!mnemonic ? (
          /* Seed Creation Section - Only shows when no mnemonic */
          <div className="mb-16">
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold mb-8">Create or Import Seed Phrase</h2>
              
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-left">
                    Import existing seed phrase (optional)
                  </label>
                  <textarea
                    id="mnemonicInput"
                    placeholder="Enter your 12-word seed phrase here, or leave empty to generate a new one"
                    className={`w-full p-4 rounded-xl text-sm border-1 resize-none h-24 ${
                      isDarkMode 
                        ? 'bg-[#161616] border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-black placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <button
                  onClick={() => {
                    const input = document.getElementById('mnemonicInput') as HTMLTextAreaElement;
                    const inputValue = input?.value.trim();
                    
                    if (inputValue) {
                      // Validate the imported mnemonic
                      const words = inputValue.split(/\s+/);
                      if (words.length !== 12) {
                        toast.error("Please enter exactly 12 words for the seed phrase!");
                        return;
                      }
                      setMnemonic(inputValue);
                      localStorage.setItem("mnemonic", inputValue);
                      toast.success("Seed phrase imported successfully!");
                      input.value = '';
                    } else {
                      createMnemonic();
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-xl transition-colors font-medium text-white"
                >
                  Create Seed Phrase
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Secret Phrase Section - Only shows when mnemonic exists */}
            <div className="mb-16  border-1 rounded-xl px-6 py-6 border-gray-700">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-bold">Your Secret Phrase</h2>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {mnemonicWords.map((word, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#161616] px-6 py-4 rounded-2xl text-center border-1 border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer"
                    onClick={() => copyToClipboard(mnemonic, "Secret phrase")}
                  >
                    <span className="font-medium text-lg text-white">{word}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className={`flex items-center gap-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Copy className="w-4 h-4" />
                <span>Click on any word to copy the entire phrase</span>
              </div>
            </div>

            {/* Wallets Section - Only shows when mnemonic exists */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
              
                <h2 className="text-3xl font-bold">Wallets</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsGridView(!isGridView)}
                    className={`p-3 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-xl transition-colors ${isGridView ? ' text-white' : ''}`}
                    title={isGridView ? 'Switch to list view' : 'Switch to grid view'}
                  >
                    {isGridView ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={createWallet}
                    className={`${isDarkMode ? 'bg-[#ffffff] text-[#0a0a0a] hover:bg-gray-200' : 'bg-[#0a0a0a] text-[#ffffff] hover:bg-gray-800'} px-6 py-3 rounded-xl transition-colors font-medium`}
                  >
                    Add Wallet
                  </button>
                  <button
                    onClick={deleteMnemonic}
                    className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl transition-colors font-medium text-white"
                  >
                    Clear Wallets
                  </button>
                </div>
              </div>

              {wallets.length > 0 ? (
                <div
                className={`grid gap-6 ${
                  isGridView ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
                }`}
              >
                {wallets.map((wallet, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#0F0F0F] rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300"
                  >
                    {/* Wallet Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-4xl font-bold text-white">
                        Wallet {index + 1}
                      </h3>
                      <button
                        onClick={() => deleteWallet(index)}
                        className="p-2 hover:bg-red-500 rounded-xl transition-colors text-red-400 hover:text-white"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
            
                    {/* Public Key */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 text-gray-400">
                        balance: {wallet.balance}
                      </label>
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 text-gray-400">
                        Public Key
                      </label>
                      <div className="bg-[#161616] rounded-xl px-4 py-3 text-sm text-gray-100 font-mono flex items-center justify-between break-all">
                        <span className="truncate">{wallet.publicKey}</span>
                        <button
                          onClick={() => copyToClipboard(wallet.publicKey, "Public key")}
                          className="ml-3 p-2 hover:bg-gray-700 rounded-xl transition-colors text-gray-300"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
            
                    {/* Private Key */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">
                        Private Key
                      </label>
                      <div className="bg-[#161616] rounded-xl px-4 py-3 text-sm text-gray-100 font-mono flex items-center justify-between break-all">
                        <span className="truncate">
                          {visiblePrivateKeys.has(index)
                            ? wallet.privateKey
                            : "•".repeat(64)}
                        </span>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            onClick={() => togglePrivateKeyVisibility(index)}
                            className="p-2 hover:bg-gray-700 rounded-xl transition-colors text-gray-300"
                          >
                            {visiblePrivateKeys.has(index) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(wallet.privateKey, "Private key")}
                            className="p-2 hover:bg-gray-700 rounded-xl transition-colors text-gray-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              ) : (
                <div className="text-center py-20">
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 text-lg`}>No wallets created yet</p>
                  <button
                    onClick={createWallet}
                    className="bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-xl transition-colors font-medium text-white"
                  >
                    Create Your First Wallet
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} border-t pt-6 mt-8`}>
          <p>Made by Sameer</p>
        </div>
      </div>
    </div>
  );
}