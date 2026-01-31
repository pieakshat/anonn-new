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

    if (!code || !redirect_uri || !code_verifier) {
      return res.status(400).json({ error: 'Missing code, redirect_uri, or code_verifier' });
    }

    const twitterClientId = process.env.TWITTER_CLIENT_ID;
    const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!twitterClientId || !twitterClientSecret) {
      return res.status(500).json({ error: 'Twitter OAuth client not configured' });
    }

    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: twitterClientId,
      redirect_uri,
      code_verifier,
    });

    const authHeader = Buffer.from(`${twitterClientId}:${twitterClientSecret}`).toString('base64');

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
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
