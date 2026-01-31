import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAnonn } from '../hooks/useAnonn';
import {
  RULE_AUTHORITY,
  RULE_ID,
  PROOF_EPOCH_SECONDS,
  PROOF_EPOCH_OVERRIDE,
} from '../lib/constants';

export function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ruleFromQuery = searchParams.get('rule');

  const { publicKey, connected } = useWallet();
  const {
    bucketedSignals,
    proofStatus,
    proofResult,
    error,
    connectTwitter,
    connectGitHub,
    generateProof,
    clearSignals,
    hasAllSignals,
    program,
  } = useAnonn();

  const isProgramLoaded = program !== null;
  const isComputing = proofStatus === 'computing' || proofStatus === 'encrypting';
  const isCompleted = proofStatus === 'completed' && proofResult;

  const connectedCount = [
    bucketedSignals.walletAgeBucket !== undefined,
    bucketedSignals.twitterAgeBucket !== undefined,
    bucketedSignals.githubAgeBucket !== undefined,
  ].filter(Boolean).length;

  const isRuleConfigured = Boolean(ruleFromQuery || (RULE_ID && RULE_AUTHORITY));

  const handleGenerateProof = async () => {
    if (!publicKey || !program) return;

    let rulePda: PublicKey;
    if (ruleFromQuery) {
      rulePda = new PublicKey(ruleFromQuery);
    } else {
      const authority = new PublicKey(RULE_AUTHORITY);
      [rulePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('rule'), authority.toBuffer(), Buffer.from(RULE_ID)],
        program.programId
      );
    }

    const epoch = PROOF_EPOCH_OVERRIDE ?? Math.floor(Date.now() / 1000 / PROOF_EPOCH_SECONDS);
    await generateProof(rulePda, epoch);
  };

  // Navigate to proof page on completion
  if (isCompleted && proofResult.proofPda) {
    const pdaStr = typeof proofResult.proofPda === 'string'
      ? proofResult.proofPda
      : proofResult.proofPda.toBase58();
    navigate('/proof/' + pdaStr, { state: { proofResult: { ...proofResult, proofPda: pdaStr } } });
  }

  const truncateAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Verify Identity</h1>
        <p className="text-[#a0a0a0] text-sm">Connect your signals and generate a zero-knowledge proof.</p>
        {ruleFromQuery && (
          <p className="text-xs text-[#e8622c] font-mono">Rule: {truncateAddress(ruleFromQuery)}</p>
        )}
      </div>

      {!connected ? (
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-8 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[#a0a0a0] text-4xl">account_balance_wallet</span>
          <p className="text-[#a0a0a0] text-sm text-center">Connect your Solana wallet to begin verification</p>
          <WalletMultiButton />
        </div>
      ) : (
        <>
          {/* Step 1: Connect Signals */}
          <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-[#e8622c] tracking-widest uppercase">Step 1: Connect Signals</h2>
              <span className="text-[10px] text-emerald-400/80 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {connectedCount}/3 CONNECTED
              </span>
            </div>

            {/* Wallet */}
            {bucketedSignals.walletAgeBucket !== undefined ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#e8622c]/10 border border-[#e8622c]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e8622c]/20 flex items-center justify-center text-[#e8622c] border border-[#e8622c]/20">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-semibold">Solana Wallet</span>
                    <span className="text-[#e8622c] text-[11px] font-mono">{publicKey ? truncateAddress(publicKey.toBase58()) : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#e8622c] bg-[#e8622c]/10 px-2 py-1 rounded text-[10px] font-medium border border-[#e8622c]/20">
                  <span className="material-symbols-outlined text-[14px] icon-filled">verified_user</span>
                  SECURE
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#222222] flex items-center justify-center text-[#a0a0a0] border border-white/5">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-200 text-sm font-medium">Solana Wallet</span>
                    <span className="text-slate-500 text-xs">Loading signals...</span>
                  </div>
                </div>
                <div className="w-4 h-4 border-2 border-[#e8622c] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Twitter */}
            {bucketedSignals.twitterAgeBucket !== undefined ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#e8622c]/10 border border-[#e8622c]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e8622c]/20 flex items-center justify-center text-[#e8622c] border border-[#e8622c]/20">
                    <span className="material-symbols-outlined">alternate_email</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-semibold">X (Twitter)</span>
                    <span className="text-[#e8622c] text-[11px] font-mono">Verified</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#e8622c] bg-[#e8622c]/10 px-2 py-1 rounded text-[10px] font-medium border border-[#e8622c]/20">
                  <span className="material-symbols-outlined text-[14px] icon-filled">verified_user</span>
                  SECURE
                </div>
              </div>
            ) : (
              <button
                onClick={connectTwitter}
                className="group flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-white/5 transition-all hover:border-white/20 hover:bg-[#222222] w-full text-left focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#222222] flex items-center justify-center text-[#a0a0a0] group-hover:text-white transition-colors border border-white/5">
                    <span className="material-symbols-outlined">alternate_email</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-200 text-sm font-medium group-hover:text-white transition-colors">Connect X (Twitter)</span>
                    <span className="text-slate-500 text-xs">Verify handle ownership</span>
                  </div>
                </div>
                <div className="text-slate-600 group-hover:text-slate-400 transition-colors pr-1">
                  <span className="material-symbols-outlined">shield</span>
                </div>
              </button>
            )}

            {/* GitHub */}
            {bucketedSignals.githubAgeBucket !== undefined ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#e8622c]/10 border border-[#e8622c]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e8622c]/20 flex items-center justify-center text-[#e8622c] border border-[#e8622c]/20">
                    <span className="material-symbols-outlined">code</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-semibold">GitHub</span>
                    <span className="text-[#e8622c] text-[11px] font-mono">Verified</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#e8622c] bg-[#e8622c]/10 px-2 py-1 rounded text-[10px] font-medium border border-[#e8622c]/20">
                  <span className="material-symbols-outlined text-[14px] icon-filled">verified_user</span>
                  SECURE
                </div>
              </div>
            ) : (
              <button
                onClick={connectGitHub}
                className="group flex items-center justify-between p-3 rounded-xl bg-[#1a1a1a] border border-white/5 transition-all hover:border-white/20 hover:bg-[#222222] w-full text-left focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#222222] flex items-center justify-center text-[#a0a0a0] group-hover:text-white transition-colors border border-white/5">
                    <span className="material-symbols-outlined">code</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-200 text-sm font-medium group-hover:text-white transition-colors">Connect GitHub</span>
                    <span className="text-slate-500 text-xs">Verify commit history</span>
                  </div>
                </div>
                <div className="text-slate-600 group-hover:text-slate-400 transition-colors pr-1">
                  <span className="material-symbols-outlined">shield</span>
                </div>
              </button>
            )}
          </div>

          {/* Step 2: Private Evaluation */}
          <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-[#a0a0a0] tracking-widest uppercase">Step 2: Private Evaluation</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-[#f5a623] bg-[#e8622c]/10 px-2 py-0.5 rounded border border-[#e8622c]/20">
                <span className="material-symbols-outlined text-[12px] animate-pulse icon-filled">bolt</span>
                ARCIUM MPC {isProgramLoaded ? 'READY' : 'OFFLINE'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111111] border border-white/10 flex flex-col gap-4 shadow-inner">
              {isComputing ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end text-xs">
                    <span className="text-white font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#e8622c] animate-pulse" />
                      {proofStatus === 'encrypting' ? 'Encrypting Signals' : 'Evaluating via MPC'}
                    </span>
                    <span className="text-[#e8622c] font-mono font-bold text-[10px]">
                      {proofStatus === 'encrypting' ? 'STEP 1/2' : 'STEP 2/2'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#e8622c] rounded-full shadow-[0_0_12px_rgba(232,98,44,0.8)] relative overflow-hidden animate-pulse" style={{ width: '100%' }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-shimmer" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-500 text-sm py-2">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>Waiting for signals to begin evaluation</span>
                </div>
              )}

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="material-symbols-outlined text-[#a0a0a0] text-sm mt-0.5 shrink-0">lock</span>
                <p className="text-[11px] text-[#a0a0a0] leading-relaxed">
                  Your data is encrypted and bucketed locally before processing. No raw PII leaves this device.
                </p>
              </div>
            </div>
          </div>

          {/* Errors/Warnings */}
          {proofStatus === 'error' && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-red-400 text-[18px] mt-0.5">error</span>
              <div>
                <p className="text-red-300 text-sm font-medium">Proof generation failed</p>
                <p className="text-red-400/70 text-xs mt-1">{error || 'Unknown error'}</p>
              </div>
            </div>
          )}

          {!isProgramLoaded && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-400 text-[18px] mt-0.5">warning</span>
              <div>
                <p className="text-amber-300 text-sm font-medium">Program not deployed</p>
                <p className="text-amber-400/70 text-xs mt-1">
                  Run <code className="px-1.5 py-0.5 bg-amber-500/10 rounded text-amber-300 font-mono">arcium build && arcium deploy</code>
                </p>
              </div>
            </div>
          )}

          {!isRuleConfigured && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-400 text-[18px] mt-0.5">warning</span>
              <div>
                <p className="text-amber-300 text-sm font-medium">Rule not configured</p>
                <p className="text-amber-400/70 text-xs mt-1">
                  Set <code className="px-1.5 py-0.5 bg-amber-500/10 rounded text-amber-300 font-mono">VITE_RULE_ID</code> and{' '}
                  <code className="px-1.5 py-0.5 bg-amber-500/10 rounded text-amber-300 font-mono">VITE_RULE_AUTHORITY</code>, or select a rule from the dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleGenerateProof}
              disabled={!hasAllSignals || isComputing || !isProgramLoaded || !isRuleConfigured}
              className="w-full bg-[#e8622c] hover:bg-[#d4841c] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl shadow-primary-glow transition-all active:scale-[0.99] flex items-center justify-center gap-2 border-t border-white/10"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isComputing ? 'hourglass_top' : 'verified'}
              </span>
              {isComputing ? 'Computing...' : 'Generate Private Proof'}
            </button>

            {connectedCount > 0 && (
              <button
                onClick={clearSignals}
                className="w-full text-slate-500 hover:text-slate-300 text-xs font-medium py-2 transition-colors"
              >
                Clear All Signals
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
