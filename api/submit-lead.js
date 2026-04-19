/*
 * /api/submit-lead
 *
 * Thin forwarder: accepts a lead payload from the website's multi-step form
 * and forwards it to the GoHighLevel inbound webhook (NEXT_PUBLIC_GHL_WEBHOOK_URL).
 *
 * The brief specified NEXT_PUBLIC_GHL_WEBHOOK_URL even though this is not a
 * Next.js app — honoring the exact env var name for cross-team consistency.
 *
 * If the webhook URL is not set, we log a clear warning and still return 200
 * so that the client form still renders the success state during early setup.
 */

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'https://perfectviewprl.com',
  'https://perfect-view-prl.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { firstName, lastName, email, phone } = body;

  // Server-side validation of required fields (client also validates)
  const missing = [];
  if (!firstName) missing.push('firstName');
  if (!lastName) missing.push('lastName');
  if (!email) missing.push('email');
  if (!phone) missing.push('phone');
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  const webhookUrl = process.env.NEXT_PUBLIC_GHL_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      '[submit-lead] NEXT_PUBLIC_GHL_WEBHOOK_URL is not set. ' +
      'Lead received but NOT forwarded to GoHighLevel. ' +
      'Set this env var in Vercel to enable delivery. Payload:',
      JSON.stringify({ firstName, lastName, email, phone })
    );
    return res.status(200).json({
      success: true,
      forwarded: false,
      message: 'Lead captured (webhook not configured)',
    });
  }

  try {
    const forwardRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        submittedAt: body.submittedAt || new Date().toISOString(),
        source: body.source || 'website',
      }),
    });

    if (!forwardRes.ok) {
      const text = await forwardRes.text().catch(() => '');
      console.error('[submit-lead] GHL webhook responded non-2xx:', forwardRes.status, text);
      return res.status(502).json({ error: 'Upstream webhook error', status: forwardRes.status });
    }

    return res.status(200).json({ success: true, forwarded: true });
  } catch (err) {
    console.error('[submit-lead] Forward failed:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to forward lead' });
  }
};
