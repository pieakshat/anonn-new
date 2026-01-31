import { Link } from 'react-router-dom';
import { PROGRAM_ID, SOLANA_NETWORK } from '../lib/constants';

export function DashboardPage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl border border-white/5 py-20 px-8 text-center space-y-6">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#a0a0a0] text-xs font-medium tracking-wide">
          Verify eligibility. Assign priority. Prove reputation.
        </div>
        <h1 className="text-4xl md:text-6xl font-normal text-white tracking-tight leading-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
          Private Verification for<br />Onchain Users
        </h1>
        <p className="text-[#a0a0a0] text-lg max-w-2xl mx-auto">
          Without identity. Without data leaks. Without correlation.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            to="/verify"
            className="bg-white text-[#0c0c0c] font-semibold px-7 py-3 rounded-full transition-all hover:bg-white/90 inline-flex items-center gap-2"
          >
            Get Started <span className="text-lg">&#8594;</span>
          </Link>
          <Link
            to="/playground"
            className="bg-transparent hover:bg-white/5 text-white font-semibold px-7 py-3 rounded-full border border-white/20 transition-colors"
          >
            Learn More
          </Link>
        </div>
        <p className="text-[#a0a0a0]/60 text-sm pt-4">
          Powered by Arcium and Solana
        </p>
      </div>

      {/* Main Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Register as Protocol */}
        <Link
          to="/rules/create"
          className="group bg-[#141414] border border-[rgba(232,98,44,0.1)] hover:border-[#e8622c]/30 rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-[#1a1a1a]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#e8622c]/10 flex items-center justify-center mb-5 group-hover:bg-[#e8622c]/20 transition-colors">
            <span className="material-symbols-outlined text-[#e8622c] text-[32px]">shield</span>
          </div>
          <h3 className="text-white font-semibold text-xl mb-2">Setup Anonn as a Protocol</h3>
          <p className="text-[#a0a0a0] text-sm mb-6">
            Define custom verification rules, set thresholds for wallet age, transaction history,
            and social account tenure.
          </p>
          <span className="inline-flex items-center gap-2 text-[#e8622c] font-medium group-hover:gap-3 transition-all">
            Create Rule <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </span>
        </Link>

        {/* Verify as User */}
        <Link
          to="/verify"
          className="group bg-[#141414] border border-[rgba(232,98,44,0.1)] hover:border-[#e8622c]/30 rounded-xl p-8 flex flex-col items-center text-center transition-all hover:bg-[#1a1a1a]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#e8622c]/10 flex items-center justify-center mb-5 group-hover:bg-[#e8622c]/20 transition-colors">
            <span className="material-symbols-outlined text-[#e8622c] text-[32px]">verified_user</span>
          </div>
          <h3 className="text-white font-semibold text-xl mb-2">Verify as a User</h3>
          <p className="text-[#a0a0a0] text-sm mb-6">
            Generate privacy-preserving proofs of your reputation. Connect your wallet and social accounts
            to prove eligibility.
          </p>
          <span className="inline-flex items-center gap-2 text-[#e8622c] font-medium group-hover:gap-3 transition-all">
            Generate Proof <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </span>
        </Link>
      </div>

      {/* SDK Coming Soon */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[rgba(232,98,44,0.15)] rounded-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#e8622c]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#e8622c]/10 border border-[#e8622c]/20 text-[#e8622c] text-xs font-medium mb-4">
            Coming Soon
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">Anonn SDK</h3>
          <p className="text-[#a0a0a0] text-sm max-w-2xl mb-6">
            Integrate privacy-preserving verification directly into your application. Create custom rules,
            set your own thresholds, and let users verify their wallets on your frontend — all with a few lines of code.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#e8622c] text-[18px]">code</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Simple Integration</p>
                <p className="text-[#a0a0a0] text-xs mt-0.5">npm install and start verifying</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#e8622c] text-[18px]">tune</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Custom Rules</p>
                <p className="text-[#a0a0a0] text-xs mt-0.5">Define thresholds that fit your needs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#e8622c] text-[18px]">palette</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Your Branding</p>
                <p className="text-[#a0a0a0] text-xs mt-0.5">Embed verification in your UI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="bg-[#141414] border border-[rgba(232,98,44,0.1)] rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Network</p>
              <p className="text-white font-semibold capitalize">{SOLANA_NETWORK}</p>
            </div>
            <div className="w-px h-8 bg-white/10 hidden md:block" />
            <div>
              <p className="text-[#a0a0a0] text-xs font-medium uppercase tracking-wider mb-1">Program</p>
              <a
                href={`https://solscan.io/account/${PROGRAM_ID.toBase58()}?cluster=${SOLANA_NETWORK}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-mono text-sm hover:text-[#e8622c] transition-colors inline-flex items-center gap-1"
              >
                {PROGRAM_ID.toBase58().slice(0, 8)}...{PROGRAM_ID.toBase58().slice(-8)}
                <span className="material-symbols-outlined text-[14px] text-[#a0a0a0]">open_in_new</span>
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#a0a0a0] text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live on {SOLANA_NETWORK}
          </div>
        </div>
      </div>
    </div>
  );
}
