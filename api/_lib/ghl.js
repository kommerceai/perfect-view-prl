const axios = require('axios');

/* ── GHL API v2 Client ────────────────── */
const ghl = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const locationId = () => process.env.GHL_LOCATION_ID;

/* ── CONTACTS ──────────────────────────── */

async function createOrUpdateContact(data) {
  const body = {
    locationId: locationId(),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    source: data.source || 'website',
  };

  // Map custom fields by key (setup endpoint creates these)
  const customFields = [];
  if (data.service) customFields.push({ id: 'contact.service_needed', field_value: data.service });
  if (data.propertyType) customFields.push({ id: 'contact.property_type', field_value: data.propertyType });
  if (data.state) customFields.push({ id: 'contact.project_state', field_value: data.state });
  if (data.projectDetails) customFields.push({ id: 'contact.project_details', field_value: data.projectDetails });
  if (customFields.length) body.customFields = customFields;

  const res = await ghl.post('/contacts/upsert', body);
  return res.data;
}

async function addContactTags(contactId, tags) {
  const res = await ghl.post(`/contacts/${contactId}/tags`, { tags });
  return res.data;
}

/* ── PIPELINES ─────────────────────────── */

async function getPipelines() {
  const res = await ghl.get('/opportunities/pipelines', {
    params: { locationId: locationId() },
  });
  return res.data.pipelines || [];
}

async function createPipeline(name, stages) {
  const res = await ghl.post('/opportunities/pipelines', {
    locationId: locationId(),
    name,
    stages: stages.map((s, i) => ({ name: s, position: i })),
  });
  return res.data;
}

async function findPipelineAndStage(pipelineName, stageName) {
  const pipelines = await getPipelines();
  const pipeline = pipelines.find((p) => p.name === pipelineName);
  if (!pipeline) return { pipeline: null, stage: null };
  const stage = pipeline.stages.find((s) => s.name === stageName);
  return { pipeline, stage: stage || null };
}

/* ── OPPORTUNITIES ─────────────────────── */

async function createOpportunity(contactId, pipelineId, stageId, data = {}) {
  const res = await ghl.post('/opportunities/', {
    locationId: locationId(),
    pipelineId,
    pipelineStageId: stageId,
    contactId,
    name: `${data.firstName || ''} ${data.lastName || ''} - ${data.service || 'Estimate'}`.trim(),
    status: 'open',
    source: 'website',
  });
  return res.data;
}

/* ── WORKFLOWS ─────────────────────────── */

async function getWorkflows() {
  const res = await ghl.get('/workflows/', {
    params: { locationId: locationId() },
  });
  return res.data.workflows || [];
}

async function addContactToWorkflow(contactId, workflowId) {
  const res = await ghl.post(`/contacts/${contactId}/workflow/${workflowId}`, {
    eventStartTime: new Date().toISOString().replace('Z', '+00:00'),
  });
  return res.data;
}

async function findAndEnrollWorkflow(contactId, workflowName) {
  const workflows = await getWorkflows();
  const wf = workflows.find((w) => w.name === workflowName);
  if (!wf) {
    console.warn(`[GHL] Workflow "${workflowName}" not found — skipping enrollment`);
    return null;
  }
  return addContactToWorkflow(contactId, wf.id);
}

/* ── CUSTOM FIELDS ─────────────────────── */

async function getCustomFields() {
  const res = await ghl.get(`/locations/${locationId()}/customFields`);
  return res.data.customFields || [];
}

async function createCustomField(name, type = 'TEXT') {
  const res = await ghl.post(`/locations/${locationId()}/customFields`, {
    name,
    dataType: type,
    model: 'contact',
  });
  return res.data;
}

/* ── TAGS ──────────────────────────────── */

async function getTags() {
  const res = await ghl.get(`/locations/${locationId()}/tags`);
  return res.data.tags || [];
}

async function createTag(name) {
  const res = await ghl.post(`/locations/${locationId()}/tags`, { name });
  return res.data;
}

module.exports = {
  createOrUpdateContact,
  addContactTags,
  getPipelines,
  createPipeline,
  findPipelineAndStage,
  createOpportunity,
  getWorkflows,
  addContactToWorkflow,
  findAndEnrollWorkflow,
  getCustomFields,
  createCustomField,
  getTags,
  createTag,
};
