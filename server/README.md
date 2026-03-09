# Perfect View PRL — GHL Backend

Express server that integrates the Perfect View PRL website with GoHighLevel CRM.

## Features

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Health check |
| `/api/leads` | POST | Receives form submissions, creates GHL contact + opportunity, enrolls in nurture workflow |
| `/api/setup` | GET | One-time bootstrap: creates pipeline, custom fields, and tags in GHL |
| `/api/review-request` | POST | Triggers review request workflow for a completed job |

All inbound endpoints require the `X-Webhook-Secret` header.

---

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `GHL_API_KEY` | Your GoHighLevel API key (Settings → Business Profile → API Key) |
| `GHL_LOCATION_ID` | Your GHL sub-account / location ID |
| `WEBHOOK_SECRET` | Shared secret for authenticating inbound requests |
| `PORT` | Server port (default: `3001`) |
| `ALLOWED_ORIGIN` | Frontend domain for CORS (default: `https://perfectviewprl.com`) |

### 2. Install & Run

```bash
npm install
node server.js
```

For development with auto-reload:

```bash
npm run dev
```

### 3. Bootstrap GHL (run once)

After the server is running, call the setup endpoint to create the pipeline, custom fields, and tags in your GHL account:

```bash
curl -H "X-Webhook-Secret: YOUR_SECRET" http://localhost:3001/api/setup
```

This creates:
- **Pipeline** "Estimate Funnel" with stages: New Lead → Estimate Scheduled → Proposal Sent → Negotiating → Job Complete → Closed Lost
- **Custom fields**: service_needed, property_type, project_state, project_details
- **18 tags** for lead tracking and automation

### 4. Connect the Website

In `index.html`, update the webhook URL and add the secret header:

```js
const GHL_WEBHOOK = 'https://your-backend-url.com/api/leads';
const WEBHOOK_SECRET = 'your_shared_secret';
```

The form's `submitForm()` function sends a POST with the `X-Webhook-Secret` header.

---

## Deployment

### Railway (recommended)

1. Push the `server/` directory to a separate repo, or deploy from a subdirectory
2. Set environment variables in Railway dashboard
3. Railway auto-detects Node.js and deploys

### Render

1. Create a new Web Service
2. Set root directory to `server/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables

### Fly.io

```bash
cd server
fly launch
fly secrets set GHL_API_KEY=xxx GHL_LOCATION_ID=xxx WEBHOOK_SECRET=xxx
fly deploy
```

### Docker

```bash
cd server
docker build -t perfectview-backend .
docker run -p 3001:3001 --env-file .env perfectview-backend
```

---

## API Reference

### POST /api/leads

**Headers:** `X-Webhook-Secret: YOUR_SECRET`

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+17472532920",
  "propertyType": "Commercial",
  "service": "Commercial TPO Roofing",
  "state": "North Carolina",
  "projectDetails": "Need roof replacement on warehouse",
  "source": "Google Search",
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "tags": ["website-lead", "free-estimate"]
}
```

**Response:** `{ success: true, contactId: "...", message: "Lead processed successfully" }`

### POST /api/review-request

**Headers:** `X-Webhook-Secret: YOUR_SECRET`

**Body:**
```json
{
  "contactId": "ghl_contact_id",
  "service": "Commercial TPO Roofing"
}
```

**Response:** `{ success: true, contactId: "...", message: "Review request workflow triggered" }`
