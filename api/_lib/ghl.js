const axios = require('axios');

const ghl = axios.create({
  baseURL: 'https://rest.gohighlevel.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const locationId = () => process.env.GHL_LOCATION_ID;

/* ── CONTACTS ──────────────────────────── */

async function createOrUpdateContact(data) {
  const res = await ghl.post('/contacts/', {
    locationId: locationId(),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    source: data.source || 'website',
    customField: {
      service_needed: data.service,
      property_type: data.propertyType,
      project_state: data.state,
      project_details: data.projectDetails,
    },
  });
  return res.data;
}

async function addContactTags(contactId, tags) {
  const res = await ghl.post(`/contacts/${contactId}/tags/`, { tags });
  return res.data;
}

/* ── PIPELINES ─────────────────────────── */

async function getPipelines() {
  const res = await ghl.get('/pipelines/', {
    params: { locationId: locationId() },
  });
  return res.data.pipelines || [];
}

async function createPipeline(name, stages) {
  const res = await ghl.post('/pipelines/', {
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
    eventStartTime: new Date().toISOString(),
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
  const res = await ghl.get('/custom-fields/', {
    params: { locationId: locationId() },
  });
  return res.data.customFields || [];
}

async function createCustomField(name, type = 'TEXT') {
  const res = await ghl.post('/custom-fields/', {
    locationId: locationId(),
    name,
    dataType: type,
    position: 0,
  });
  return res.data;
}

/* ── TAGS ──────────────────────────────── */

async function getTags() {
  const res = await ghl.get('/tags/', {
    params: { locationId: locationId() },
  });
  return res.data.tags || [];
}

async function createTag(name) {
  const res = await ghl.post('/tags/', {
    locationId: locationId(),
    name,
  });
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
