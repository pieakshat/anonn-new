import { useCallback, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { SOLANA_RPC_URL, SOLANA_NETWORK } from '../lib/constants';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Solana wallet provider with adapter configuration
 * Supports: Phantom, Solflare, and any Standard Wallet (auto-detected)
 */
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network =
    SOLANA_NETWORK === 'mainnet-beta'
      ? WalletAdapterNetwork.Mainnet
      : SOLANA_NETWORK === 'testnet'
        ? WalletAdapterNetwork.Testnet
        : WalletAdapterNetwork.Devnet;

  // Configure wallet adapters
  // Standard wallets (Phantom, Backpack, etc.) are auto-detected
  // We explicitly add Phantom and Solflare for better mobile support
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  // Delay autoConnect to avoid WalletConnectionError from wallet extensions
  // that aren't fully initialized on page load
  const [autoConnect, setAutoConnect] = useState(false);
  useEffect(() => {
    // Only auto-connect if we're in a browser with potential wallet extensions
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => setAutoConnect(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const onError = useCallback((error: WalletError) => {
    // Silently ignore connection errors (user rejected, wallet not found, etc.)
    if (error.name === 'WalletConnectionError') return;
    if (error.name === 'WalletNotReadyError') return;
    if (error.name === 'WalletNotFoundError') return;
    console.error('Wallet error:', error);
  }, []);

  return (
    <ConnectionProvider
      endpoint={SOLANA_RPC_URL}
      config={{ commitment: 'confirmed' }}
    >
      <SolanaWalletProvider
        wallets={wallets}
        onError={onError}
        autoConnect={autoConnect}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
