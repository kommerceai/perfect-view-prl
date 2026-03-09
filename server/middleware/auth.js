function verifyWebhookSecret(req, res, next) {
  const secret = req.headers['x-webhook-secret'];
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized — invalid or missing X-Webhook-Secret' });
  }
  next();
}

module.exports = verifyWebhookSecret;
