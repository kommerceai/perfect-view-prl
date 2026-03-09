const express = require('express');
const router = express.Router();
const ghl = require('../services/ghl');

const PIPELINE_NAME = 'Estimate Funnel';
const PIPELINE_STAGES = [
  'New Lead',
  'Estimate Scheduled',
  'Proposal Sent',
  'Negotiating',
  'Job Complete',
  'Closed Lost',
];

const CUSTOM_FIELDS = [
  { name: 'service_needed', type: 'TEXT' },
  { name: 'property_type', type: 'TEXT' },
  { name: 'project_state', type: 'TEXT' },
  { name: 'project_details', type: 'LARGE_TEXT' },
];

const TAGS = [
  'website-lead',
  'free-estimate',
  'ghl-calendar',
  'phone-inquiry',
  'svc-roofing',
  'svc-painting',
  'svc-construction',
  'svc-landscaping',
  'svc-restoration',
  'estimate-scheduled',
  'proposal-sent',
  'job-active',
  'job-complete',
  'reviewed',
  'nurture-active',
  'nurture-complete',
  'do-not-contact',
  'long-term-nurture',
];

router.get('/', async (req, res) => {
  const report = { pipeline: null, customFields: [], tags: [] };

  /* ── 1. Pipeline ─────────────────────── */
  try {
    const existing = await ghl.getPipelines();
    const found = existing.find((p) => p.name === PIPELINE_NAME);
    if (found) {
      report.pipeline = { status: 'exists', id: found.id };
      console.log(`[SETUP] Pipeline "${PIPELINE_NAME}" already exists (${found.id})`);
    } else {
      const created = await ghl.createPipeline(PIPELINE_NAME, PIPELINE_STAGES);
      report.pipeline = { status: 'created', id: created.pipeline?.id || created.id };
      console.log(`[SETUP] Pipeline "${PIPELINE_NAME}" created`);
    }
  } catch (err) {
    report.pipeline = { status: 'error', message: err.response?.data?.message || err.message };
    console.error('[SETUP] Pipeline error:', err.response?.data || err.message);
  }

  /* ── 2. Custom fields ────────────────── */
  let existingFields = [];
  try {
    existingFields = await ghl.getCustomFields();
  } catch (err) {
    console.error('[SETUP] Failed to fetch custom fields:', err.message);
  }

  for (const field of CUSTOM_FIELDS) {
    try {
      const exists = existingFields.find((f) => f.name === field.name);
      if (exists) {
        report.customFields.push({ name: field.name, status: 'exists', id: exists.id });
        console.log(`[SETUP] Custom field "${field.name}" already exists`);
      } else {
        const created = await ghl.createCustomField(field.name, field.type);
        report.customFields.push({ name: field.name, status: 'created', id: created.customField?.id || created.id });
        console.log(`[SETUP] Custom field "${field.name}" created`);
      }
    } catch (err) {
      report.customFields.push({ name: field.name, status: 'error', message: err.response?.data?.message || err.message });
      console.error(`[SETUP] Custom field "${field.name}" error:`, err.response?.data || err.message);
    }
  }

  /* ── 3. Tags ─────────────────────────── */
  let existingTags = [];
  try {
    existingTags = await ghl.getTags();
  } catch (err) {
    console.error('[SETUP] Failed to fetch tags:', err.message);
  }

  const existingTagNames = existingTags.map((t) => t.name.toLowerCase());

  for (const tag of TAGS) {
    try {
      if (existingTagNames.includes(tag.toLowerCase())) {
        report.tags.push({ name: tag, status: 'exists' });
        console.log(`[SETUP] Tag "${tag}" already exists`);
      } else {
        await ghl.createTag(tag);
        report.tags.push({ name: tag, status: 'created' });
        console.log(`[SETUP] Tag "${tag}" created`);
      }
    } catch (err) {
      report.tags.push({ name: tag, status: 'error', message: err.response?.data?.message || err.message });
      console.error(`[SETUP] Tag "${tag}" error:`, err.response?.data || err.message);
    }
  }

  /* ── Summary ─────────────────────────── */
  const created = report.tags.filter((t) => t.status === 'created').length
    + report.customFields.filter((f) => f.status === 'created').length
    + (report.pipeline?.status === 'created' ? 1 : 0);

  const errors = report.tags.filter((t) => t.status === 'error').length
    + report.customFields.filter((f) => f.status === 'error').length
    + (report.pipeline?.status === 'error' ? 1 : 0);

  console.log(`[SETUP] Complete — ${created} created, ${errors} errors`);
  res.json({ success: errors === 0, created, errors, report });
});

module.exports = router;
