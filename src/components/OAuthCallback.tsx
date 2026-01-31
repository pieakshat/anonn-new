import { type FC, useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/constants';
import { exchangeTwitterCode, fetchTwitterUser } from '../sdk/signals/twitter';
import { fetchGitHubUser } from '../sdk/signals/github';

type Provider = 'twitter' | 'github';

interface OAuthCallbackProps {
  provider: Provider;
}

export const OAuthCallback: FC<OAuthCallbackProps> = ({ provider }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');

      if (errorParam) {
        setError(errorParam);
        setStatus('error');
        window.opener?.postMessage({ type: 'OAUTH_ERROR', error: errorParam }, window.location.origin);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setStatus('error');
        window.opener?.postMessage({ type: 'OAUTH_ERROR', error: 'No authorization code received' }, window.location.origin);
        return;
      }

      try {
        if (provider === 'twitter') {
          await handleTwitterCallback(code, state);
        } else if (provider === 'github') {
          await handleGitHubCallback(code, state);
        }
        setStatus('success');
        // Close popup after a short delay
        setTimeout(() => window.close(), 1500);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'OAuth callback failed';
        setError(errorMsg);
        setStatus('error');
        window.opener?.postMessage({ type: 'OAUTH_ERROR', error: errorMsg }, window.location.origin);
      }
    };

    handleCallback();
  }, [provider]);

  const handleTwitterCallback = async (code: string, state: string | null) => {
    // Verify state
    const savedState = localStorage.getItem('twitter_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid OAuth state');
    }

    const codeVerifier = localStorage.getItem('twitter_code_verifier');
    if (!codeVerifier) {
      throw new Error('Missing code verifier');
    }

    // Exchange code for token
    const accessToken = await exchangeTwitterCode(
      code,
      `${window.location.origin}/oauth/callback/twitter`,
      codeVerifier
    );

    // Fetch user data
    const userData = await fetchTwitterUser(accessToken);

    // Clean up
    localStorage.removeItem('twitter_oauth_state');
    localStorage.removeItem('twitter_code_verifier');

    // Send data to opener
    window.opener?.postMessage({
      type: 'TWITTER_OAUTH_SUCCESS',
      createdAt: userData.createdAt.toISOString(),
    }, window.location.origin);
  };

  const handleGitHubCallback = async (code: string, state: string | null) => {
    // Verify state
    const savedState = localStorage.getItem('github_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid OAuth state');
    }

    const codeVerifier = localStorage.getItem('github_code_verifier');
    if (!codeVerifier) {
      throw new Error('Missing code verifier');
    }

    // GitHub OAuth requires server-side token exchange due to client_secret
    // This calls your backend token exchange endpoint.
    const tokenEndpoint = API_BASE_URL ? `${API_BASE_URL}/api/github/token` : '/api/github/token';
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        redirect_uri: `${window.location.origin}/oauth/callback/github`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange GitHub code for token. Backend endpoint required.');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user data
    const userData = await fetchGitHubUser(access_token);

    // Clean up
    localStorage.removeItem('github_oauth_state');
    localStorage.removeItem('github_code_verifier');

    // Send data to opener
    window.opener?.postMessage({
      type: 'GITHUB_OAUTH_SUCCESS',
      createdAt: userData.createdAt.toISOString(),
      publicRepos: userData.publicRepos,
    }, window.location.origin);
  };

  return (
    <div className="min-h-screen bg-[#101622] flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-white/10">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-[#e8622c] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Connecting to {provider === 'twitter' ? 'X (Twitter)' : 'GitHub'}...
            </h2>
            <p className="text-slate-400">Please wait while we verify your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Successfully Connected!
            </h2>
            <p className="text-slate-400">This window will close automatically.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-[#e8622c] text-white rounded-lg hover:bg-[#d4841c] transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
};
