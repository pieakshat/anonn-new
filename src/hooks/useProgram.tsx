import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useConnection, useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';

interface ProgramContextValue {
  program: anchor.Program | null;
  provider: anchor.AnchorProvider | null;
  loading: boolean;
}

const ProgramContext = createContext<ProgramContextValue>({
  program: null,
  provider: null,
  loading: true,
});

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { connected } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [program, setProgram] = useState<anchor.Program | null>(null);
  const [loading, setLoading] = useState(true);

  const provider = useMemo(() => {
    if (!anchorWallet) return null;
    const p = new anchor.AnchorProvider(connection, anchorWallet, { commitment: 'confirmed' });
    anchor.setProvider(p);
    return p;
  }, [connection, anchorWallet]);

  useEffect(() => {
    if (!connected || !provider) {
      setProgram(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const loadProgram = async () => {
      try {
        const response = await fetch('/idl/anonn.json');
        if (!response.ok) throw new Error('IDL not found');
        const idl = await response.json();
        setProgram(new anchor.Program(idl as anchor.Idl, provider));
      } catch {
        console.warn('Anonn program IDL not found. Run "anchor build" to create it.');
        setProgram(null);
      } finally {
        setLoading(false);
      }
    };

    loadProgram();
  }, [connected, provider]);

  return (
    <ProgramContext.Provider value={{ program, provider, loading }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  return useContext(ProgramContext);
}
