import { fetchWalletBalance } from "@/utils/lib";
import React from "react";

type WalletBalanceResult = {
  balance: number;
  symbol: string;
  decimals: number;
  success: boolean;
  error?: any;
};

export const useWalletBalance = (
  rpcUrl: string,
  publicKey: string,
  blockchain: string,
  autoFetch = true
) => {
  const [balance, setBalance] = React.useState<WalletBalanceResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchBalance = React.useCallback(async () => {
    if (!rpcUrl || !publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchWalletBalance(rpcUrl, publicKey, blockchain);
      setBalance(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [rpcUrl, publicKey, blockchain]);

  React.useEffect(() => {
    if (autoFetch) {
      fetchBalance();
    }
  }, [fetchBalance, autoFetch]);

  return { balance, loading, error, refetch: fetchBalance };
};
