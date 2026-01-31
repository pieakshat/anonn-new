import http from 'http';
import { URL } from 'url';

const port = Number(process.env.OAUTH_PORT || 8787);
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const twitterClientId = process.env.TWITTER_CLIENT_ID;
const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET;

if (!githubClientId || !githubClientSecret) {
  console.warn('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET. GitHub token exchange will fail.');
}

if (!twitterClientId || !twitterClientSecret) {
  console.warn('Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET. Twitter token exchange will fail.');
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/twitter/token') {
    try {
      const { code, redirect_uri, code_verifier } = await readJson(req);

      if (!code || !redirect_uri || !code_verifier) {
        sendJson(res, 400, { error: 'Missing code, redirect_uri, or code_verifier' });
        return;
      }

      if (!twitterClientId || !twitterClientSecret) {
        sendJson(res, 500, { error: 'Twitter OAuth client not configured' });
        return;
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
        sendJson(res, tokenResponse.status, { error: tokenJson.error || 'Token exchange failed', details: tokenJson });
        return;
      }

      sendJson(res, 200, tokenJson);
      return;
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
      return;
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/github/token') {
    try {
      const { code, redirect_uri, code_verifier } = await readJson(req);

      if (!code || !redirect_uri) {
        sendJson(res, 400, { error: 'Missing code or redirect_uri' });
        return;
      }

      if (!githubClientId || !githubClientSecret) {
        sendJson(res, 500, { error: 'GitHub OAuth client not configured' });
        return;
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
        sendJson(res, tokenResponse.status, { error: tokenJson.error || 'Token exchange failed', details: tokenJson });
        return;
      }

      sendJson(res, 200, tokenJson);
      return;
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
      return;
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`OAuth server listening on http://localhost:${port}`);
});
