const express = require('express');
const router = express.Router();
const ghl = require('../services/ghl');

router.post('/', async (req, res) => {
  try {
    const { contactId, service } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Missing required field: contactId' });
    }

    /* ── Add tags ──────────────────────── */
    const tags = ['reviewed', 'job-complete'];
    if (service) {
      const svcSlug = service
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      tags.push(`svc-${svcSlug}`);
    }
    await ghl.addContactTags(contactId, tags);
    console.log(`[REVIEW] Tags added to ${contactId}: ${tags.join(', ')}`);

    /* ── Enroll in review workflow ─────── */
    await ghl.findAndEnrollWorkflow(contactId, 'Review Request Sequence');

    res.status(200).json({
      success: true,
      contactId,
      message: 'Review request workflow triggered',
    });
  } catch (err) {
    console.error('[REVIEW] Error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to trigger review request',
      details: err.response?.data?.message || err.message,
    });
  }
});

module.exports = router;
