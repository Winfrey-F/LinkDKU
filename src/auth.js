const crypto = require('crypto');
const https = require('https');

function randomString() {
  return crypto.randomBytes(20).toString('hex');
}

function buildOAuthUrl(config, state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.dukeOAuth.clientId,
    redirect_uri: config.dukeOAuth.redirectUri,
    scope: 'openid profile email',
    state
  });
  return `${config.dukeOAuth.authUrl}?${params.toString()}`;
}

function postForm(urlString, params) {
  const url = new URL(urlString);
  const body = params.toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({});
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(urlString, token) {
  const url = new URL(urlString);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'GET',
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({});
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function exchangeCodeForUser(config, code) {
  const token = await postForm(
    config.dukeOAuth.tokenUrl,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.dukeOAuth.redirectUri,
      client_id: config.dukeOAuth.clientId,
      client_secret: config.dukeOAuth.clientSecret
    })
  );

  const userInfo = await getJson(config.dukeOAuth.userInfoUrl, token.access_token);
  return {
    netid: userInfo.netid || userInfo.preferred_username || userInfo.sub,
    email: userInfo.email
  };
}

module.exports = {
  randomString,
  buildOAuthUrl,
  exchangeCodeForUser
};
