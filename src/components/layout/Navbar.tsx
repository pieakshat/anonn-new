import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Protocol-only pages
const protocolLinks = [
  { to: '/rules/create', label: 'Create Rule' },
  { to: '/company', label: 'Profiles' },
];

// Pages that are part of the protocol flow
const protocolPaths = ['/rules/create', '/company'];

// Pages that are part of the user flow
const userPaths = ['/verify'];

export function Navbar() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isProtocolPage = protocolPaths.some(path => location.pathname.startsWith(path));
  const isUserPage = userPaths.some(path => location.pathname.startsWith(path));
  const isPlayground = location.pathname === '/playground';

  return (
    <nav className="bg-[#0c0c0c]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
          <img src="/anonn.svg" alt="Anonn" className="w-7 h-7" />
          Anonn
        </Link>

        {/* Protocol navigation - only show on protocol pages */}
        {isProtocolPage && (
          <div className="hidden md:flex items-center gap-1">
            {protocolLinks.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'text-white bg-white/10'
                    : 'text-[#a0a0a0] hover:text-white hover:bg-white/5'
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side - wallet button for non-landing pages */}
        {!isLandingPage && (
          <div className="flex items-center gap-3">
            {(isUserPage || isPlayground) && (
              <Link
                to="/"
                className="text-[#a0a0a0] hover:text-white text-sm font-medium transition-colors hidden md:block"
              >
                Back to Home
              </Link>
            )}
            <WalletMultiButton />
          </div>
        )}
      </div>
    </nav>
  );
}
