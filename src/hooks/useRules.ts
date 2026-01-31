import { useState, useEffect, useCallback } from 'react';
import { useProgram } from './useProgram';
import type { Rule } from '../sdk/types';

interface UseRulesReturn {
  rules: (Rule & { pda: string })[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRules(): UseRulesReturn {
  const { program } = useProgram();
  const [rules, setRules] = useState<(Rule & { pda: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program) {
      setRules([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts = await (program.account as any).rule.all();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = accounts.map((acc: any) => ({
        pda: acc.publicKey.toBase58(),
        id: acc.account.ruleId,
        authority: acc.account.authority,
        thresholds: {
          walletAgeThreshold: acc.account.walletAgeThreshold,
          txCountThreshold: acc.account.txCountThreshold,
          twitterAgeThreshold: acc.account.twitterAgeThreshold,
          githubAgeThreshold: acc.account.githubAgeThreshold,
          githubRepoThreshold: acc.account.githubRepoThreshold,
        },
        tierConfig: {
          tier1Min: acc.account.tier1Min,
          tier2Min: acc.account.tier2Min,
        },
        proofValiditySecs: acc.account.proofValiditySecs?.toNumber
          ? acc.account.proofValiditySecs.toNumber()
          : acc.account.proofValiditySecs,
        createdAt: acc.account.createdAt?.toNumber
          ? acc.account.createdAt.toNumber()
          : acc.account.createdAt,
      }));
      setRules(parsed);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rules, loading, error, refetch };
}
