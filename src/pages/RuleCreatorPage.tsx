import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from '../hooks/useProgram';
import { AnonnDeveloper } from '../sdk/developer';
import { useConnection } from '@solana/wallet-adapter-react';
import type { RuleDefinition } from '../sdk/types';

export function RuleCreatorPage() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();

  const [ruleId, setRuleId] = useState('');
  const [walletAgeThreshold, setWalletAgeThreshold] = useState(0);
  const [txCountThreshold, setTxCountThreshold] = useState(0);
  const [twitterAgeThreshold, setTwitterAgeThreshold] = useState(0);
  const [githubAgeThreshold, setGithubAgeThreshold] = useState(0);
  const [githubRepoThreshold, setGithubRepoThreshold] = useState(0);
  const [tier1Min, setTier1Min] = useState(2);
  const [tier2Min, setTier2Min] = useState(4);
  const [proofValiditySecs, setProofValiditySecs] = useState(86400);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ruleDef: RuleDefinition = {
    ruleId,
    walletAgeThreshold: walletAgeThreshold as RuleDefinition['walletAgeThreshold'],
    txCountThreshold: txCountThreshold as RuleDefinition['txCountThreshold'],
    twitterAgeThreshold: twitterAgeThreshold as RuleDefinition['twitterAgeThreshold'],
    githubAgeThreshold: githubAgeThreshold as RuleDefinition['githubAgeThreshold'],
    githubRepoThreshold: githubRepoThreshold as RuleDefinition['githubRepoThreshold'],
    tier1Min,
    tier2Min,
    proofValiditySecs,
  };

  const derivedPda = useMemo(() => {
    if (!ruleId || !publicKey || !program) return null;
    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('rule'), publicKey.toBuffer(), Buffer.from(ruleId)],
        program.programId
      );
      return pda.toBase58();
    } catch {
      return null;
    }
  }, [ruleId, publicKey, program]);

  const handleSubmit = async () => {
    if (!program || !publicKey || !ruleId) return;
    setSubmitting(true);
    setError(null);
    try {
      const developer = new AnonnDeveloper(connection, program, publicKey);
      await developer.registerRule(ruleDef);
      navigate('/');
    } catch (err) {
      console.error('Failed to register rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to register rule');
    } finally {
      setSubmitting(false);
    }
  };

  const sliderField = (
    label: string,
    value: number,
    setter: (v: number) => void,
    max: number,
    description: string
  ) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-white font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => setter(Number(e.target.value))}
        className="w-full accent-[#e8622c]"
      />
      <p className="text-[11px] text-slate-500">{description}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Form */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Create Rule</h1>
          <p className="text-[#a0a0a0] text-sm mt-1">Define eligibility thresholds for your verification rule.</p>
        </div>

        {!connected && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            Connect your wallet to create a rule.
          </div>
        )}

        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6 space-y-5">
          {/* Rule ID */}
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium">Rule ID</label>
            <input
              type="text"
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value)}
              placeholder="e.g. priority_v1"
              className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
            />
          </div>

          {/* Threshold Sliders */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-[#e8622c] tracking-widest uppercase">Signal Thresholds</h3>
            {sliderField('Wallet Age', walletAgeThreshold, setWalletAgeThreshold, 5, '0=any, 5=>2 years')}
            {sliderField('TX Count', txCountThreshold, setTxCountThreshold, 4, '0=any, 4=>200 txs')}
            {sliderField('Twitter Age', twitterAgeThreshold, setTwitterAgeThreshold, 5, '0=any, 5=>2 years')}
            {sliderField('GitHub Age', githubAgeThreshold, setGithubAgeThreshold, 5, '0=any, 5=>2 years')}
            {sliderField('GitHub Repos', githubRepoThreshold, setGithubRepoThreshold, 4, '0=any, 4=>200 repos')}
          </div>

          {/* Tier Config */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-[#e8622c] tracking-widest uppercase">Tier Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Tier 1 Min</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={tier1Min}
                  onChange={(e) => setTier1Min(Number(e.target.value))}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Tier 2 Min</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={tier2Min}
                  onChange={(e) => setTier2Min(Number(e.target.value))}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
                />
              </div>
            </div>
          </div>

          {/* Proof Validity */}
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300 font-medium">Proof Validity (seconds)</label>
            <input
              type="number"
              min={60}
              value={proofValiditySecs}
              onChange={(e) => setProofValiditySecs(Number(e.target.value))}
              className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
            />
            <p className="text-[11px] text-slate-500">{Math.floor(proofValiditySecs / 3600)}h {Math.floor((proofValiditySecs % 3600) / 60)}m</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!connected || !program || !ruleId || submitting}
            className="w-full bg-[#e8622c] hover:bg-[#d4841c] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting ? 'Registering...' : 'Register Rule'}
          </button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Rule Preview</h2>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-6">
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap overflow-auto">
            {JSON.stringify(ruleDef, null, 2)}
          </pre>
        </div>
        {derivedPda && (
          <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-4 space-y-1">
            <p className="text-xs text-[#a0a0a0] uppercase tracking-wider font-medium">Derived PDA</p>
            <p className="text-sm font-mono text-white break-all">{derivedPda}</p>
          </div>
        )}
      </div>
    </div>
  );
}
