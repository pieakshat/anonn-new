export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirect_uri, code_verifier } = req.body;

    if (!code || !redirect_uri) {
      return res.status(400).json({ error: 'Missing code or redirect_uri' });
    }

    const githubClientId = process.env.GITHUB_CLIENT_ID;
    const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!githubClientId || !githubClientSecret) {
      return res.status(500).json({ error: 'GitHub OAuth client not configured' });
    }

    const body = new URLSearchParams({
      client_id: githubClientId,
      client_secret: githubClientSecret,
      code,
      redirect_uri,
    });

    if (code_verifier) {
      body.set('code_verifier', code_verifier);
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const tokenJson = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({ 
        error: tokenJson.error || 'Token exchange failed', 
        details: tokenJson 
      });
    }

    return res.status(200).json(tokenJson);
  } catch (err) {
    return res.status(500).json({ 
      error: err instanceof Error ? err.message : 'Server error' 
    });
  }
}
