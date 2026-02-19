const https = require('https');
const { appendOutbox } = require('./storage');

function postJson({ host, path, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: host,
        path,
        method: 'POST',
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 500, data });
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendEmailResult(config, toEmail, subject, text) {
  const entry = {
    toEmail,
    subject,
    text,
    sentAt: new Date().toISOString()
  };

  if (!config.email.apiKey) {
    appendOutbox({ ...entry, mode: 'dry-run' });
    return { ok: true, dryRun: true };
  }

  const payload = JSON.stringify({
    from: config.email.from,
    to: [toEmail],
    subject,
    text
  });

  const response = await postJson({
    host: config.email.host,
    path: config.email.path,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.email.apiKey}`,
      'Content-Length': Buffer.byteLength(payload)
    },
    body: payload
  });

  const ok = response.statusCode >= 200 && response.statusCode < 300;
  appendOutbox({
    ...entry,
    mode: ok ? 'sent' : 'failed',
    statusCode: response.statusCode,
    response: response.data
  });

  return { ok, statusCode: response.statusCode };
}

module.exports = {
  sendEmailResult
};
