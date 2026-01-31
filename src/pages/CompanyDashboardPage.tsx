import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { PublicKey } from '@solana/web3.js';
import { useProofsForRule } from '../hooks/useProofsForRule';
import { useProgram } from '../hooks/useProgram';
import { useRules } from '../hooks/useRules';
import type { Rule } from '../sdk/types';

export function CompanyDashboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rulePda = searchParams.get('rule');
  const { program } = useProgram();
  const { rules, loading: rulesLoading } = useRules();
  const { proofs, loading, error, stats, refetch } = useProofsForRule(rulePda);
  const [rule, setRule] = useState<(Rule & { pda: string }) | null>(null);
  const [ruleLoading, setRuleLoading] = useState(false);

  const handleRuleSelect = (pda: string) => {
    navigate(`/company?rule=${pda}`);
  };

  // Fetch rule details
  useEffect(() => {
    async function fetchRule() {
      if (!program || !rulePda) return;
      setRuleLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const acc = await (program.account as any).rule.fetch(new PublicKey(rulePda));
        setRule({
          pda: rulePda,
          id: acc.ruleId,
          authority: acc.authority,
          thresholds: {
            walletAgeThreshold: acc.walletAgeThreshold,
            txCountThreshold: acc.txCountThreshold,
            twitterAgeThreshold: acc.twitterAgeThreshold,
            githubAgeThreshold: acc.githubAgeThreshold,
            githubRepoThreshold: acc.githubRepoThreshold,
          },
          tierConfig: {
            tier1Min: acc.tier1Min,
            tier2Min: acc.tier2Min,
          },
          proofValiditySecs: acc.proofValiditySecs?.toNumber?.() ?? acc.proofValiditySecs,
          createdAt: acc.createdAt?.toNumber?.() ?? acc.createdAt,
        });
      } catch (err) {
        console.error('Failed to fetch rule:', err);
      } finally {
        setRuleLoading(false);
      }
    }
    fetchRule();
  }, [program, rulePda]);

  const truncate = (s: string) => `${s.slice(0, 4)}...${s.slice(-4)}`;
  const now = Math.floor(Date.now() / 1000);

  const getTierBadge = (tier: number) => {
    switch (tier) {
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            Tier 2
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Tier 1
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Tier 0
          </span>
        );
    }
  };

  const getStatusBadge = (expiresAt: number, isFinalized: boolean) => {
    if (!isFinalized) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Pending
        </span>
      );
    }
    if (expiresAt > now) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        Expired
      </span>
    );
  };

  // Rule selector component
  const RuleSelector = () => (
    <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Select a Rule</h3>
      {rulesLoading ? (
        <p className="text-[#a0a0a0]">Loading rules...</p>
      ) : rules.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-[#a0a0a0] mb-3">No rules registered yet.</p>
          <Link to="/rules/create" className="text-[#e8622c] hover:underline font-medium">
            Create a Rule
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {rules.map((r) => (
            <button
              key={r.pda}
              onClick={() => handleRuleSelect(r.pda)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                rulePda === r.pda
                  ? 'bg-[#e8622c]/10 border-[#e8622c]/30 text-white'
                  : 'bg-[#1a1a1a] border-white/5 text-[#a0a0a0] hover:bg-[#252525] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-medium">{r.id}</p>
                  <p className="text-xs mt-1 opacity-60">
                    T1: {r.tierConfig.tier1Min}+ / T2: {r.tierConfig.tier2Min}+ conditions
                  </p>
                </div>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (!rulePda) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Company Dashboard</h1>
          <p className="text-[#a0a0a0]">View all wallets that have generated proofs for your rules</p>
        </div>
        <RuleSelector />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Company Dashboard</h1>
          <p className="text-[#a0a0a0] text-sm">
            View all wallets that have generated proofs for your rules
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* Rule Selector Dropdown */}
      <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-4">
        <div className="flex items-center gap-4">
          <label className="text-[#a0a0a0] text-sm font-medium shrink-0">Select Rule:</label>
          <select
            value={rulePda || ''}
            onChange={(e) => handleRuleSelect(e.target.value)}
            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-[#e8622c]/50"
          >
            <option value="" disabled>Choose a rule...</option>
            {rules.map((r) => (
              <option key={r.pda} value={r.pda}>
                {r.id} (T1: {r.tierConfig.tier1Min}+, T2: {r.tierConfig.tier2Min}+)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rule Info Card */}
      {ruleLoading ? (
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6">
          <p className="text-[#a0a0a0]">Loading rule details...</p>
        </div>
      ) : rule ? (
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Rule ID</p>
              <p className="text-white font-mono text-sm">{rule.id}</p>
            </div>
            <div>
              <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Authority</p>
              <a
                href={`https://solscan.io/account/${rule.authority.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e8622c] font-mono text-sm hover:underline"
              >
                {truncate(rule.authority.toBase58())}
              </a>
            </div>
            <div>
              <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Tier Config</p>
              <p className="text-white text-sm">T1: {rule.tierConfig.tier1Min}+ / T2: {rule.tierConfig.tier2Min}+</p>
            </div>
            <div>
              <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Validity</p>
              <p className="text-white text-sm">{Math.floor(rule.proofValiditySecs / 3600)}h</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-4">
          <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Total Proofs</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-4">
          <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Active</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-4">
          <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Expired</p>
          <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
        </div>
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-4">
          <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Tier 2</p>
          <p className="text-2xl font-bold text-green-400">{stats.tier2}</p>
        </div>
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-4">
          <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Tier 1</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.tier1}</p>
        </div>
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-4">
          <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Tier 0</p>
          <p className="text-2xl font-bold text-gray-400">{stats.tier0}</p>
        </div>
      </div>

      {/* Proofs Table */}
      <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Verified Wallets</h2>
          <p className="text-[#a0a0a0] text-sm">All wallets that have generated proofs for this rule</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#a0a0a0]">
            <span className="material-symbols-outlined text-[32px] animate-spin mb-2">progress_activity</span>
            <p>Loading proofs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <span className="material-symbols-outlined text-[32px] mb-2">error</span>
            <p>{error}</p>
          </div>
        ) : proofs.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#a0a0a0] mb-2">inbox</span>
            <p className="text-[#a0a0a0]">No proofs generated yet for this rule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[#a0a0a0] text-xs uppercase tracking-wider">
                  <th className="text-left p-4">Wallet</th>
                  <th className="text-left p-4">Tier</th>
                  <th className="text-left p-4">Conditions</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Generated</th>
                  <th className="text-left p-4">Expires</th>
                  <th className="text-left p-4">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {proofs.map((proof) => (
                  <tr key={proof.pda} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <a
                        href={`https://solscan.io/account/${proof.owner.toBase58()}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#e8622c] font-mono text-xs hover:underline"
                      >
                        {truncate(proof.owner.toBase58())}
                      </a>
                    </td>
                    <td className="p-4">{getTierBadge(proof.tier)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-medium">{proof.conditionsMet}</span>
                        <span className="text-[#a0a0a0]">/ 5</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(proof.expiresAt, proof.isFinalized)}</td>
                    <td className="p-4 text-[#a0a0a0] text-xs">
                      {new Date(proof.generatedAt * 1000).toLocaleString()}
                    </td>
                    <td className="p-4 text-[#a0a0a0] text-xs">
                      {new Date(proof.expiresAt * 1000).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <a
                        href={`https://solscan.io/account/${proof.pda}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#a0a0a0] hover:text-[#e8622c] transition-colors"
                        title="View on Solscan"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Section */}
      {proofs.length > 0 && (
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Export Data</h3>
              <p className="text-[#a0a0a0] text-sm">Download proof data for integration with your systems</p>
            </div>
            <button
              onClick={() => {
                const data = proofs.map(p => ({
                  wallet: p.owner.toBase58(),
                  tier: p.tier,
                  conditionsMet: p.conditionsMet,
                  generatedAt: new Date(p.generatedAt * 1000).toISOString(),
                  expiresAt: new Date(p.expiresAt * 1000).toISOString(),
                  isActive: p.isFinalized && p.expiresAt > now,
                  proofPda: p.pda,
                }));
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `proofs-${rule?.id || 'export'}-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#e8622c] hover:bg-[#d4841c] text-white font-medium rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
