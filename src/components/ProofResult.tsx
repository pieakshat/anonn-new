import { useState } from 'react';
import type { ProofOutput, ProofStatus } from '../sdk/types';

interface ProofResultProps {
  status: ProofStatus;
  result: ProofOutput | null;
  error: string | null;
  onReset?: () => void;
}

export function ProofResult({ status, result, error, onReset }: ProofResultProps) {
  const [copied, setCopied] = useState(false);

  if (status === 'idle' || status === 'collecting') {
    return null;
  }

  if (status === 'error') {
    return (
      <div className="bg-[#141414] border border-red-500/20 rounded-xl p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center ring-1 ring-red-500/20">
            <span className="material-symbols-outlined text-[32px]">error</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Proof Generation Failed</h3>
            <p className="text-[#a0a0a0] text-sm">{error || 'An unknown error occurred'}</p>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="text-sm font-medium text-[#a0a0a0] hover:text-white transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'encrypting' || status === 'computing') {
    return (
      <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#e8622c]/10 text-[#e8622c] flex items-center justify-center ring-1 ring-[#e8622c]/20">
            <span className="material-symbols-outlined text-[32px] animate-spin">progress_activity</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Computing Proof</h3>
            <p className="text-[#a0a0a0] text-sm">Evaluating your signals over encrypted MPC network...</p>
          </div>
          {/* Progress Bar */}
          <div className="w-full">
            <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#e8622c] rounded-full shadow-[0_0_12px_rgba(232,98,44,0.8)] relative overflow-hidden transition-all duration-1000"
                style={{ width: status === 'encrypting' ? '35%' : '70%' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'completed' && result) {
    const getTierLabel = () => {
      switch (result.tier) {
        case 2: return 'Tier 2 Premium';
        case 1: return 'Tier 1 Verified';
        default: return 'Tier 0 Basic';
      }
    };

    const pdaToString = (pda: unknown) =>
      typeof pda === 'string' ? pda : pda && typeof (pda as any).toBase58 === 'function' ? (pda as any).toBase58() : '—';
    const proofId = result.proofPda ? pdaToString(result.proofPda) : '—';

    const handleCopy = async () => {
      const proofData = JSON.stringify({
        tier: result.tier,
        conditionsMet: result.conditionsMet,
        ruleId: result.ruleId,
        epoch: result.epoch,
        proofPda: result.proofPda ? pdaToString(result.proofPda) : undefined,
        generatedAt: result.generatedAt,
        expiresAt: result.expiresAt,
      }, null, 2);
      await navigator.clipboard.writeText(proofData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Status Header */}
        <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6 ring-1 ring-green-500/20">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Proof Generated</h1>
          <p className="text-[#a0a0a0] text-sm">Your zero-knowledge proof is ready for submission.</p>
        </div>

        {/* Proof Details List */}
        <div className="px-6 pb-6">
          <div className="bg-[#111111]/50 rounded-lg border border-white/5 divide-y divide-white/5">
            {/* Proof ID */}
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-2 text-[#a0a0a0] shrink-0">
                <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                <span className="text-sm font-medium">Proof ID</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <code className="text-sm font-mono text-slate-200 bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[180px]" title={proofId}>{proofId}</code>
                <a
                  href={`https://solscan.io/account/${proofId}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#a0a0a0] hover:text-[#e8622c] transition-colors shrink-0"
                  title="View on Solscan"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>
            </div>

            {/* Scope / Rule */}
            {result.ruleId && (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2 text-[#a0a0a0]">
                  <span className="material-symbols-outlined text-[18px]">dataset</span>
                  <span className="text-sm font-medium">Scope</span>
                </div>
                <span className="text-sm font-semibold text-white">{result.ruleId}</span>
              </div>
            )}

            {/* Tier */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-[#a0a0a0]">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span className="text-sm font-medium">Tier</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e8622c]/10 text-[#e8622c] border border-[#e8622c]/20">
                {getTierLabel()}
              </span>
            </div>

            {/* Conditions Met */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 text-[#a0a0a0]">
                <span className="material-symbols-outlined text-[18px]">checklist</span>
                <span className="text-sm font-medium">Conditions</span>
              </div>
              <span className="text-sm font-semibold text-white">{result.conditionsMet} / 5 met</span>
            </div>

            {/* Expires */}
            {result.expiresAt && (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2 text-[#a0a0a0]">
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                  <span className="text-sm font-medium">Expires</span>
                </div>
                <span className="text-sm font-mono text-[#f5a623]">
                  {new Date(result.expiresAt * 1000).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 pt-2 flex flex-col gap-4">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 h-12 bg-[#e8622c] hover:bg-[#d4841c] text-white font-semibold rounded-lg shadow-lg shadow-[#e8622c]/25 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
            <span>{copied ? 'Copied!' : 'Copy Proof to Clipboard'}</span>
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="text-center text-sm font-medium text-[#a0a0a0] hover:text-white transition-colors"
            >
              Return to Dashboard
            </button>
          )}
        </div>

        {/* Privacy Footer */}
        <div className="bg-[#111111] border-t border-white/5 p-4 flex gap-3 items-start">
          <span className="material-symbols-outlined text-[#a0a0a0] text-[20px] shrink-0 mt-0.5">security</span>
          <div>
            <p className="text-xs font-semibold text-slate-300">Zero-Knowledge Guarantee</p>
            <p className="text-[11px] leading-relaxed text-slate-500 mt-1">
              Raw identifiers stay in-browser. Only coarse buckets are encrypted and sent for MPC verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
