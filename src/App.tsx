import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './components/WalletProvider';
import { ProgramProvider } from './hooks/useProgram';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { RuleCreatorPage } from './pages/RuleCreatorPage';
import { VerifyPage } from './pages/VerifyPage';
import { ProofSuccessPage } from './pages/ProofSuccessPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { CompanyDashboardPage } from './pages/CompanyDashboardPage';
import { OAuthCallback } from './components/OAuthCallback';
import './index.css';

function App() {
  return (
    <WalletProvider>
      <ProgramProvider>
        <BrowserRouter>
          <Routes>
            {/* OAuth callbacks - no layout */}
            <Route path="/oauth/callback/twitter" element={<OAuthCallback provider="twitter" />} />
            <Route path="/oauth/callback/github" element={<OAuthCallback provider="github" />} />

            {/* Main app with layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/rules/create" element={<RuleCreatorPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/proof/:proofPda" element={<ProofSuccessPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/company" element={<CompanyDashboardPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProgramProvider>
    </WalletProvider>
  );
}

export default App;
