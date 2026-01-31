import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ProofResult } from '../components/ProofResult';
import type { ProofOutput } from '../sdk/types';

export function ProofSuccessPage() {
  const { proofPda } = useParams<{ proofPda: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const proofResult = (location.state as { proofResult?: ProofOutput } | null)?.proofResult ?? null;

  const handleReset = () => navigate('/');

  if (!proofResult) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-16">
        <span className="material-symbols-outlined text-[#a0a0a0] text-5xl">search</span>
        <h2 className="text-xl font-bold text-white">Proof Not Found</h2>
        <p className="text-[#a0a0a0] text-sm">
          Proof PDA: <code className="font-mono text-xs">{proofPda}</code>
        </p>
        <p className="text-slate-500 text-xs">Navigate here from the verify page to see proof details.</p>
        <button
          onClick={handleReset}
          className="text-[#e8622c] hover:underline text-sm font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <ProofResult
        status="completed"
        result={proofResult}
        error={null}
        onReset={handleReset}
      />
    </div>
  );
}
