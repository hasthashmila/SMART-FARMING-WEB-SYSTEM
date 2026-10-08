# AgriPulse · Smart Farming Web System

Research artefact for **“Smart Farming Web System: An Autonomous AI-Agent and IoT-Driven Web Platform for Precision Agriculture and Global B2B Export Optimization”** (H.A.S. Thashmila, BSc (Hons) Software Engineering, NSBM Green University — supervisor Mr. Gayan Perera).

The application implements the six-layer architecture described in Chapter 3 of the thesis and is fully available in **English, Sinhala (සිංහල) and Tamil (தமிழ்)**.

| Thesis layer | Implementation |
| --- | --- |
| IoT sensor layer | ESP32-style nodes post the nine parameters (soil moisture, N, P, K, soil/air temperature, humidity, pH, rainfall). A built-in simulator stands in when no hardware is connected. |
| Network layer | `POST /api/ingest` over HTTP with per-device keys; MQTT topic convention documented in Settings for a broker bridge. |
| Data layer | Validation & data-preparation pipeline (`server/validate.js`): alias/unit normalisation, missing-value and range checks, timestamp standardisation, completeness scoring. JSON persistence with atomic writes. |
| AI-agent & decision layer | Rule-based decision intelligence with crop policies (`server/agent.js`). Every decision carries evidence, rule id and confidence (explainable AI). Workflow orchestration with approval → execute → verify (`server/workflows.js`), optional autonomous mode. NLP intent classifier for a trilingual assistant. |
| Web application layer | Digital-twin dashboard, zone twin, 24/72-hour analytics, agent console, evaluation page (Table 3.2 metrics, scenario suite, SUS questionnaire), settings. Live updates via Server-Sent Events. |
| Global B2B e-commerce layer | Product listings linked to live zone data, buyer–supplier inquiry threads, quotation → order conversion, seven-stage export tracking, document checklist and a payment-integration point. |

## Run locally

Requires Node.js 18 or newer. No dependencies to install.

```bash
npm start
```

Open <http://localhost:3000>. A demo database is seeded on first start at `data/db.json`.

| Role | Email | Password |
| --- | --- | --- |
| Farmer / farm manager | `farmer@agripulse.lk` | `Farm@123` |
| Buyer / importer | `buyer@agripulse.lk` | `Buyer@123` |

Other scripts: `npm test` (end-to-end API tests), `npm run dev` (auto-restart on change), `npm run reset` (drop the demo database).

## Deploy

**Docker**

```bash
docker build -t agripulse .
docker run -p 3000:3000 -v agripulse-data:/data agripulse
```

**Render (free demo)**

The repository includes a Render Blueprint. Open <https://dashboard.render.com/blueprint/new?repo=https://github.com/hasthashmila/SMART-FARMING-WEB-SYSTEM>, sign in, connect the GitHub repository, and deploy the Blueprint. The free service uses temporary storage, so its demo database can reset when Render restarts or redeploys the service. Use a paid instance with a persistent disk for data that must be retained.

**Any Node host (Render, Railway, Fly.io, a VPS with PM2/systemd)** — start command `node server.js`, set `PORT`, mount a persistent directory and point `DATA_DIR` at it, and set `SECURE_COOKIES=true` behind HTTPS. See `.env.example`.

## Connect real sensor nodes

1. Open **Settings → Sensor nodes** to copy each node's device key and the ingest URL.
2. From the ESP32 (HTTP) or an MQTT→HTTP bridge, send JSON readings:

```bash
curl -X POST http://<host>/api/ingest \
  -H "Content-Type: application/json" \
  -H "X-Device-Key: <device-key>" \
  -d '{"moisture":41.2,"nitrogen":42,"phosphorus":30,"potassium":36,"soilTemp":25.1,"airTemp":28.4,"humidity":70,"ph":6.4,"rainfall":0}'
```

Field aliases such as `soil_moisture`, `n`, `p`, `k`, `temperature`, `rain` are accepted; add `"units":{"temperature":"F"}` to send Fahrenheit. Invalid readings are rejected with per-field error codes and counted in the data-quality metric.

3. Turn off **Simulated sensor network** in Settings once real nodes are posting.

## API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET/PATCH /api/auth/me`, `POST /api/auth/password` |
| Farm & twin | `GET /api/dashboard`, `GET /api/events` (SSE), `GET /api/readings`, `GET /api/readings.csv`, `PATCH /api/farm`, `PATCH /api/zones/:id`, `GET /api/devices`, `POST /api/devices/:id/rotate`, `POST /api/simulate` |
| IoT ingest | `POST /api/ingest` (device key) |
| Agent & workflows | `GET /api/workflows`, `POST /api/workflows/:id/approve|reject|acknowledge`, `GET /api/alerts`, `POST /api/alerts/read`, `GET /api/logs`, `POST /api/assistant` |
| Evaluation | `GET /api/evaluation`, `POST /api/evaluation/run`, `POST /api/evaluation/sus` |
| B2B | `GET/POST /api/products`, `PATCH/DELETE /api/products/:id`, `POST /api/products/:id/inquiries`, `GET /api/inquiries`, `POST /api/inquiries/:id/messages|close|convert`, `GET /api/orders`, `POST /api/orders/:id/advance|documents|payment` |

Errors are returned as `{ "error": { "code": "…" } }`; the client translates codes into the active language.

## Project structure

```
server.js            HTTP server, static files, security headers
server/
  api.js             REST routes and session handling
  pipeline.js        ingest → validate → store → agent → alerts/workflows → SSE
  validate.js        data-preparation rules (thesis §3.6)
  agent.js           crop policies, decision rules, scenario suite, intent classifier
  workflows.js       workflow orchestration and verification
  simulator.js       ESP32 field-node simulator
  seed.js / db.js    demo data and JSON persistence
public/
  index.html, styles.css, app.js, i18n.js (en / si / ta), manifest, icon
test/api.test.js     end-to-end API tests (node:test)
```

Recommendations are decision support only and do not replace professional agronomic advice.
