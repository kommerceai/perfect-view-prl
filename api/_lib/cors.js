const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'https://perfectviewprl.com',
  'https://perfect-view-prl.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Webhook-Secret');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

function verifySecret(req, res) {
  const secret = req.headers['x-webhook-secret'];
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    res.status(401).json({ error: 'Unauthorized — invalid or missing X-Webhook-Secret' });
    return false;
  }
  return true;
}

module.exports = { cors, verifySecret };
