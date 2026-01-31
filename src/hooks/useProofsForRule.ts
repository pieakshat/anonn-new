import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from './useProgram';
import type { ProofRecord } from '../sdk/types';

export interface ProofWithPda extends ProofRecord {
  pda: string;
}

interface UseProofsForRuleReturn {
  proofs: ProofWithPda[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    total: number;
    tier0: number;
    tier1: number;
    tier2: number;
    active: number;
    expired: number;
  };
}

export function useProofsForRule(rulePda: string | null): UseProofsForRuleReturn {
  const { program } = useProgram();
  const [proofs, setProofs] = useState<ProofWithPda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program || !rulePda) {
      setProofs([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rulePubkey = new PublicKey(rulePda);

      // Fetch all proof accounts filtered by rule
      // The rule field is at offset 8 (discriminator) + 32 (owner) = 40
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts = await (program.account as any).proof.all([
        {
          memcmp: {
            offset: 8 + 32, // After discriminator + owner pubkey
            bytes: rulePubkey.toBase58(),
          },
        },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed: ProofWithPda[] = accounts.map((acc: any) => ({
        pda: acc.publicKey.toBase58(),
        owner: acc.account.owner,
        rule: acc.account.rule,
        epoch: acc.account.epoch?.toNumber?.() ?? acc.account.epoch,
        tier: acc.account.tier,
        conditionsMet: acc.account.conditionsMet,
        generatedAt: acc.account.generatedAt?.toNumber?.() ?? acc.account.generatedAt,
        expiresAt: acc.account.expiresAt?.toNumber?.() ?? acc.account.expiresAt,
        isFinalized: acc.account.isFinalized ?? false,
      }));

      // Sort by generatedAt descending (most recent first)
      parsed.sort((a, b) => b.generatedAt - a.generatedAt);

      setProofs(parsed);
    } catch (err) {
      console.error('Failed to fetch proofs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch proofs');
    } finally {
      setLoading(false);
    }
  }, [program, rulePda]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Calculate stats
  const now = Math.floor(Date.now() / 1000);
  const stats = {
    total: proofs.length,
    tier0: proofs.filter(p => p.tier === 0).length,
    tier1: proofs.filter(p => p.tier === 1).length,
    tier2: proofs.filter(p => p.tier === 2).length,
    active: proofs.filter(p => p.isFinalized && p.expiresAt > now).length,
    expired: proofs.filter(p => p.expiresAt <= now).length,
  };

  return { proofs, loading, error, refetch, stats };
}
