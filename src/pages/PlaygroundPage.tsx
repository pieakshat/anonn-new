import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useProgram } from '../hooks/useProgram';
import { useRules } from '../hooks/useRules';
import { AnonnDeveloper } from '../sdk/developer';
import type { VerifyResult } from '../sdk/types';

export function PlaygroundPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useProgram();
  const { rules, loading: rulesLoading } = useRules();

  const [selectedRule, setSelectedRule] = useState('');
  const [proofPdaInput, setProofPdaInput] = useState('');
  const [epochInput, setEpochInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!program || !publicKey || !selectedRule || !proofPdaInput || !epochInput) return;
    setVerifying(true);
    setError(null);
    setResult(null);
    try {
      const developer = new AnonnDeveloper(connection, program, publicKey);
      const res = await developer.verifyProof(
        new PublicKey(proofPdaInput),
        new PublicKey(selectedRule),
        Number(epochInput)
      );
      setResult(res);
    } catch (err) {
      console.error('Verification failed:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Playground</h1>
        <p className="text-[#a0a0a0] text-sm mt-1">Verify proofs on-chain using the Anonn SDK.</p>
      </div>

      {/* Input Section */}
      <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6 space-y-4">
        <h2 className="text-xs font-bold text-[#e8622c] tracking-widest uppercase">Verify a Proof</h2>

        <div className="space-y-1.5">
          <label className="text-sm text-slate-300 font-medium">Rule</label>
          <select
            value={selectedRule}
            onChange={(e) => setSelectedRule(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
          >
            <option value="">Select a rule...</option>
            {rulesLoading ? (
              <option disabled>Loading...</option>
            ) : (
              rules.map((r) => (
                <option key={r.pda} value={r.pda}>
                  {r.id} ({r.pda.slice(0, 8)}...)
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-slate-300 font-medium">Proof PDA</label>
          <input
            type="text"
            value={proofPdaInput}
            onChange={(e) => setProofPdaInput(e.target.value)}
            placeholder="Enter proof PDA address"
            className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-slate-300 font-medium">Epoch</label>
          <input
            type="number"
            value={epochInput}
            onChange={(e) => setEpochInput(e.target.value)}
            placeholder="e.g. 1"
            className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#e8622c]/50"
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={!program || !selectedRule || !proofPdaInput || !epochInput || verifying}
          className="w-full bg-[#e8622c] hover:bg-[#d4841c] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {verifying ? 'Verifying...' : 'Verify Proof'}
        </button>
      </div>

      {/* Result */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6 space-y-4">
          <h2 className="text-xs font-bold text-[#e8622c] tracking-widest uppercase">Result</h2>
          <div className="bg-[#111111] border border-white/10 rounded-lg p-4">
            <pre className="text-sm text-slate-300 font-mono">{JSON.stringify(result, null, 2)}</pre>
          </div>
          <div className="flex items-center gap-3">
            {result.valid ? (
              <span className="inline-flex items-center gap-1.5 text-green-400 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Proof is valid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-red-400 text-sm font-medium">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Proof is invalid {result.expired && '(expired)'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Code Example */}
      <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6 space-y-3">
        <h2 className="text-xs font-bold text-[#a0a0a0] tracking-widest uppercase">SDK Usage</h2>
        <div className="bg-[#111111] border border-white/10 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre">{`import { AnonnDeveloper } from '@anonn/sdk';

const developer = new AnonnDeveloper(connection, program, authority);

// Verify a proof on-chain
const result = await developer.verifyProof(
  proofPda,   // PublicKey - the proof account
  rulePda,    // PublicKey - the rule account
  epoch       // number - expected epoch
);

console.log(result);
// { valid: true, tier: 2, expired: false }`}</pre>
        </div>
      </div>
    </div>
  );
}
