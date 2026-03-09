const express = require('express');
const router = express.Router();
const ghl = require('../services/ghl');

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, propertyType, service, state, projectDetails, source, submittedAt, tags } = req.body;

    /* ── Validate required fields ──────── */
    const missing = [];
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (!email) missing.push('email');
    if (!phone) missing.push('phone');
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    /* ── 1. Create / update contact ────── */
    const contact = await ghl.createOrUpdateContact({
      firstName,
      lastName,
      email,
      phone,
      propertyType,
      service,
      state,
      projectDetails,
      source,
    });

    const contactId = contact.contact?.id || contact.id;
    console.log(`[LEAD] Contact created/updated: ${contactId}`);

    /* ── 2. Add tags ───────────────────── */
    const contactTags = ['website-lead', 'free-estimate'];
    if (service) {
      const svcSlug = service
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      contactTags.push(`svc-${svcSlug}`);
    }
    if (state) {
      const stateSlug = state
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      contactTags.push(`state-${stateSlug}`);
    }
    if (tags && Array.isArray(tags)) {
      tags.forEach((t) => { if (!contactTags.includes(t)) contactTags.push(t); });
    }

    await ghl.addContactTags(contactId, contactTags);
    console.log(`[LEAD] Tags added: ${contactTags.join(', ')}`);

    /* ── 3. Create opportunity ─────────── */
    const { pipeline, stage } = await ghl.findPipelineAndStage('Estimate Funnel', 'New Lead');
    if (pipeline && stage) {
      await ghl.createOpportunity(contactId, pipeline.id, stage.id, {
        firstName,
        lastName,
        service,
      });
      console.log(`[LEAD] Opportunity created in Estimate Funnel → New Lead`);
    } else {
      console.warn('[LEAD] Pipeline "Estimate Funnel" or stage "New Lead" not found — skipping opportunity');
    }

    /* ── 4. Enroll in nurture workflow ─── */
    await ghl.findAndEnrollWorkflow(contactId, 'Lead Nurture 14-Day');

    res.status(200).json({
      success: true,
      contactId,
      message: 'Lead processed successfully',
    });
  } catch (err) {
    console.error('[LEAD] Error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to process lead',
      details: err.response?.data?.message || err.message,
    });
  }
});

module.exports = router;
