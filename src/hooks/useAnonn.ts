import { useState, useCallback, useEffect, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import type { RawSignals, UserSignals, ProofOutput, ProofStatus } from '../sdk/types';
import { bucketSignals } from '../sdk/bucketing';
import { fetchSolanaSignals } from '../sdk/signals/solana';
import { AnonnUser } from '../sdk/user';
import { useProgram } from './useProgram';

interface UseAnonnReturn {
  isConnected: boolean;
  rawSignals: Partial<RawSignals>;
  bucketedSignals: Partial<UserSignals>;
  proofStatus: ProofStatus;
  proofResult: ProofOutput | null;
  error: string | null;
  collectWalletSignals: () => Promise<void>;
  connectTwitter: () => Promise<boolean>;
  connectGitHub: () => Promise<boolean>;
  generateProof: (rulePda: PublicKey, epoch: number) => Promise<void>;
  clearSignals: () => void;
  hasAllSignals: boolean;
  program: anchor.Program | null;  // Expose program state
}

/**
 * React hook for managing Anonn proof generation
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isConnected,
 *     bucketedSignals,
 *     generateProof,
 *     connectTwitter
 *   } = useAnonn();
 *
 *   return (
 *     <div>
 *       <button onClick={() => connectTwitter()}>Connect Twitter</button>
 *       <button onClick={() => generateProof(rulePda, 1)}>Generate Proof</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAnonn(): UseAnonnReturn {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const { program, provider } = useProgram();

  const [rawSignals, setRawSignals] = useState<Partial<RawSignals>>({});
  const [bucketedSignals, setBucketedSignals] = useState<Partial<UserSignals>>({});
  const [proofStatus, setProofStatus] = useState<ProofStatus>('idle');
  const [proofResult, setProofResult] = useState<ProofOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create AnonnUser SDK instance
  const anonnUser = useMemo(() => new AnonnUser(connection), [connection]);

  // Update bucketed signals when raw signals change
  useEffect(() => {
    setBucketedSignals(bucketSignals(rawSignals));
  }, [rawSignals]);

  // Auto-collect wallet signals when wallet connects (only if not already collected)
  useEffect(() => {
    if (connected && publicKey && anonnUser && rawSignals.walletCreatedAt === undefined) {
      collectWalletSignals();
    }
  }, [connected, publicKey, rawSignals.walletCreatedAt]);

  const collectWalletSignals = useCallback(async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    try {
      setProofStatus('collecting');
      setError(null);

      const signals = await fetchSolanaSignals(connection, publicKey);
      setRawSignals((prev) => ({ ...prev, ...signals }));

      setProofStatus('idle');
    } catch (err) {
      console.error('Error collecting wallet signals:', err);
      setError(err instanceof Error ? err.message : 'Failed to collect wallet signals');
      setProofStatus('error');
    }
  }, [connection, publicKey]);

  const connectTwitter = useCallback(async (): Promise<boolean> => {
    try {
      setProofStatus('collecting');
      setError(null);

      const success = await anonnUser.connectTwitter();

      if (success) {
        setRawSignals(anonnUser.getRawSignals());
        setBucketedSignals(anonnUser.getBucketedSignals());
        setProofStatus('idle');
      } else {
        setError('Failed to connect Twitter');
        setProofStatus('error');
      }

      return success;
    } catch (err) {
      console.error('Error connecting Twitter:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect Twitter');
      setProofStatus('error');
      return false;
    }
  }, [anonnUser]);

  const connectGitHub = useCallback(async (): Promise<boolean> => {
    try {
      setProofStatus('collecting');
      setError(null);

      const success = await anonnUser.connectGitHub();

      if (success) {
        setRawSignals(anonnUser.getRawSignals());
        setBucketedSignals(anonnUser.getBucketedSignals());
        setProofStatus('idle');
      } else {
        setError('Failed to connect GitHub');
        setProofStatus('error');
      }

      return success;
    } catch (err) {
      console.error('Error connecting GitHub:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect GitHub');
      setProofStatus('error');
      return false;
    }
  }, [anonnUser]);

  const generateProof = useCallback(async (rulePda: PublicKey, epoch: number) => {
    setProofStatus('computing');
    setError(null);

    try {
      if (!provider) {
        throw new Error('Wallet not connected');
      }

      if (!program) {
        throw new Error('Program not loaded. Please ensure the Anonn program is deployed.');
      }

      // Check if we have all signals
      const signals = bucketedSignals as UserSignals;
      if (
        signals.walletAgeBucket === undefined ||
        signals.txCountBucket === undefined ||
        signals.twitterAgeBucket === undefined ||
        signals.githubAgeBucket === undefined ||
        signals.githubRepoBucket === undefined
      ) {
        throw new Error('Not all signals collected');
      }

      // Production implementation with deployed program
      anonnUser.setWallet(publicKey!);
      anonnUser.setProgram(program);
      
      // Sync bucketed signals from React state to AnonnUser instance
      anonnUser.setBucketedSignals(signals);

      const proof = await anonnUser.generateProof(
        { ruleId: 'priority_v1', rulePda, epoch },
        provider
      );

      setProofResult(proof);
      setProofStatus('completed');
    } catch (err) {
      console.error('Proof generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate proof');
      setProofStatus('error');
    }
  }, [provider, program, publicKey, bucketedSignals, anonnUser]);

  const clearSignals = useCallback(() => {
    setRawSignals({});
    setBucketedSignals({});
    setProofResult(null);
    setError(null);
    setProofStatus('idle');
  }, []);

  const hasAllSignals =
    bucketedSignals.walletAgeBucket !== undefined &&
    bucketedSignals.txCountBucket !== undefined &&
    bucketedSignals.twitterAgeBucket !== undefined &&
    bucketedSignals.githubAgeBucket !== undefined &&
    bucketedSignals.githubRepoBucket !== undefined;

  return {
    isConnected: connected,
    rawSignals,
    bucketedSignals,
    proofStatus,
    proofResult,
    error,
    collectWalletSignals,
    connectTwitter,
    connectGitHub,
    generateProof,
    clearSignals,
    hasAllSignals,
    program, // Expose program state so UI can check if it's loaded
  };
}
