export const fetchWalletBalance = async (rpcUrl:string, publicKey:string, blockchain = 'solana') => {
    try {
      let balance = 0;
      let symbol = '';
      
      switch (blockchain.toLowerCase()) {
        case 'solana':
          const solanaBalance = await fetchSolanaBalance(rpcUrl, publicKey);
          return {
            balance: solanaBalance,
            symbol: 'SOL',
            decimals: 9,
            success: true
          };
          
        case 'ethereum':
          const ethBalance = await fetchEthereumBalance(rpcUrl, publicKey);
          return {
            balance: ethBalance,
            symbol: 'ETH',
            decimals: 18,
            success: true
          };
          
        
        default:
          throw new Error(`Unsupported blockchain: ${blockchain}`);
      }
    } catch (error: any) {
      console.error('Error fetching wallet balance:', error);
      return {
        balance: 0,
        symbol: '',
        decimals: 0,
        success: false,
        error: error.message
      };
    }
  };
// Solana balance fetcher
const fetchSolanaBalance = async (rpcUrl:string, publicKey:string,) => {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [publicKey]
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
    return data.result.value / 1000000000;
  };
  
  // Ethereum balance fetcher
  const fetchEthereumBalance = async (rpcUrl:string, publicKey:string,) => {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [publicKey, 'latest']
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    // Convert wei to ETH (1 ETH = 10^18 wei)
    const balanceInWei = parseInt(data.result, 16);
    return balanceInWei / Math.pow(10, 18);
  };