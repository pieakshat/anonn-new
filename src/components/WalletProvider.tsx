import { useCallback, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { SOLANA_RPC_URL, SOLANA_NETWORK } from '../lib/constants';

/**
 * Solana wallet provider with adapter configuration
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network =
    SOLANA_NETWORK === 'mainnet-beta'
      ? WalletAdapterNetwork.Mainnet
      : SOLANA_NETWORK === 'testnet'
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet;

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network]
  );

  // Delay autoConnect to avoid WalletConnectionError from wallet extensions
  // that aren't fully initialized on page load
  const [autoConnect, setAutoConnect] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAutoConnect(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const onError = useCallback((error: WalletError) => {

    if (error.name === 'WalletConnectionError') return;
    console.error('Wallet error:', error);
  }, []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect={autoConnect}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
