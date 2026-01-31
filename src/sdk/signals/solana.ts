import { Connection, PublicKey } from '@solana/web3.js';
import type { RawSignals } from '../types';

// ============================================================================
// Solana Signal Fetching
// ============================================================================

/**
 * Fetch wallet signals from Solana
 * - Wallet age: time since first transaction
 * - Transaction count: total number of transactions
 */
export async function fetchSolanaSignals(
  connection: Connection,
  publicKey: PublicKey
): Promise<Partial<RawSignals>> {
  // Get all signatures for this wallet
  const signatures = await connection.getSignaturesForAddress(publicKey, {
    limit: 1000,
  });

  if (signatures.length === 0) {
    // New wallet with no transactions
    return {
      walletCreatedAt: new Date(), // Treat as just created
      txCount: 0,
    };
  }

  // Get the first transaction to determine wallet age
  const firstSignature = signatures[signatures.length - 1];
  let walletCreatedAt: Date;

  if (firstSignature.blockTime) {
    walletCreatedAt = new Date(firstSignature.blockTime * 1000);
  } else {
    // Fallback to current time if block time not available
    walletCreatedAt = new Date();
  }

  // Get total transaction count
  const txCount = signatures.length;

  return {
    walletCreatedAt,
    txCount,
  };
}

/**
 * Get wallet age in days (for display purposes)
 */
export function getWalletAgeInDays(createdAt: Date): number {
  const ageMs = Date.now() - createdAt.getTime();
  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

/**
 * Format wallet age for display
 */
export function formatWalletAge(createdAt: Date): string {
  const days = getWalletAgeInDays(createdAt);

  if (days < 30) {
    return `${days} days`;
  } else if (days < 90) {
    return `${Math.floor(days / 30)} month${days > 30 ? 's' : ''}`;
  } else if (days < 365) {
    return `${Math.floor(days / 90)} quarter${days > 90 ? 's' : ''}`;
  } else if (days < 730) {
    return '1 year';
  } else {
    return `${Math.floor(days / 365)} years`;
  }
}
