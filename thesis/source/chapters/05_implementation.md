# CHAPTER 5 — DESIGN AND IMPLEMENTATION

## 5.1 Chapter Overview

This chapter describes in detail how the Smart Farming Web System was designed and built. It follows the six-layer architecture from the bottom up: the technology selections are justified first (Section 5.2), then the sensor nodes and simulator (Section 5.3), the data-preparation pipeline (Section 5.4), the AI-agent decision module (Section 5.5), the workflow-orchestration engine (Section 5.6), the web application and digital-twin interface, including the trilingual design (Section 5.7), the B2B export module (Section 5.8), the evaluation instrumentation (Section 5.9) and the security, persistence and deployment design (Section 5.10). Pseudocode, flowcharts and selected code excerpts are used to elaborate the logic, and screenshots synchronised with execution provide evidence that the features operate as described. In accordance with the Faculty guideline, basic features such as login and registration are described only briefly, and attention is concentrated on the features that embody the contribution of this research.

## 5.2 Technology Selection and Justification

Table 5.1 justifies the selection of each technology against the alternatives considered. The overriding criteria were: suitability for smallholder budgets and low-resource deployment, transparency and explainability, ease of reproduction by examiners and future researchers, and support for Sinhala and Tamil.

Table 5.1: Technology selection and justification
| Concern | Options considered | Selected | Justification |
| Programming language (backend) | Python (Flask/Django), Java (Spring), Node.js (JavaScript) | Node.js 18, JavaScript | Same language on client and server; built-in HTTP, crypto and file modules allow a zero-dependency backend; event loop suits many small concurrent sensor requests |
| Backend framework | Express, Fastify, NestJS, none | None (built-in http module) | Avoids 50+ transitive packages, supply-chain risk and version drift; the routing needs of the API are simple; start with one command on any host |
| Frontend framework | React, Vue, Angular, vanilla JavaScript | Vanilla JavaScript with template rendering | No build toolchain; fast first load on low-end Android phones; complete control of the trilingual rendering path |
| Real-time updates | WebSockets, Server-Sent Events, polling | Server-Sent Events | Unidirectional push is sufficient; automatic reconnection; plain HTTP works through proxies |
| Persistence | PostgreSQL, MongoDB, SQLite, JSON document store | JSON document store with atomic writes | Inspectable, zero-dependency and adequate for a prototype farm; schema versioning and a clear upgrade path to PostgreSQL or MongoDB are provided |
| Sensor microcontroller | Arduino Uno + Wi-Fi shield, Raspberry Pi, ESP32 | ESP32 | Integrated Wi-Fi, low cost, low power, broad sensor libraries |
| Field protocol | MQTT only, HTTP only, both | HTTP primary with MQTT convention and bridge | HTTP needs no broker; MQTT retained for queuing and offline buffering where required |
| Decision approach | Machine-learning models, rule-based decision intelligence, hybrid | Rule-based with evidence recording | No labelled data; explainability requirement; agronomists can inspect and adjust policies; ML planned as future work |
| Natural-language assistant | Cloud large-language-model API, local keyword intent classifier | Local multilingual intent classifier | Offline, deterministic, private; answers composed from validated data |
| Typography | System fonts, Google Noto fonts | Noto Sans Sinhala, Noto Sans Tamil, Plus Jakarta Sans | Correct rendering of complex Sinhala and Tamil scripts across devices |
| Testing | Jest, Mocha, Node built-in test runner | Node built-in test runner (node:test) | No dependencies; end-to-end tests exercise the real HTTP server |
| Deployment | Bare Node process, Docker, platform-as-a-service | All supported; Docker image provided | Single-command local start for examiners; container for cloud hosting |

Table 5.2 lists the libraries used. The runtime dependency list is intentionally empty; only browser-delivered fonts are external.

Table 5.2: Libraries and modules used
| Library / module | Type | Purpose |
| http, fs, path, crypto (Node.js core) | Runtime | HTTP server, file persistence, scrypt hashing, random keys |
| node:test, node:assert | Development | End-to-end test suite |
| EventSource, fetch, Intl (browser APIs) | Client | Live updates, API calls, locale-aware number and date formatting |
| Google Fonts (Noto Sans Sinhala, Noto Sans Tamil, Plus Jakarta Sans) | Client asset | Trilingual typography |
| Arduino core for ESP32; DHT, OneWire/DallasTemperature, ModbusMaster | Firmware | Sensor drivers on the node |

## 5.3 IoT Sensor Layer: Nodes and Simulator

### 5.3.1 Sensor node design

Each field zone is served by one ESP32 node wired to a capacitive soil-moisture probe (analogue input), an RS485 NPK sensor through a MAX485 transceiver (Modbus RTU), a DS18B20 soil-temperature probe (OneWire), a DHT22 air temperature and humidity sensor, an analogue pH probe and a tipping-bucket rain gauge (interrupt-counted pulses converted to millimetres). A relay output drives an irrigation valve or fertigation pump. The firmware loop reads all sensors, assembles a JSON object using the canonical field names (moisture, nitrogen, phosphorus, potassium, soilTemp, airTemp, humidity, ph, rainfall) and posts it to the ingest endpoint with the node's device key in the X-Device-Key header at a configurable interval (default 20 seconds). If the post fails, the reading is retained in a small ring buffer and retried, and the node subscribes (where an MQTT broker is present) to its actuator topic to receive irrigation and fertigation commands. Listing 5.1 shows the core of the firmware loop in pseudocode.

```
Listing 5.1 — Node firmware loop (pseudocode)
every INTERVAL seconds:
    r.moisture  ← calibrate(analogRead(MOISTURE_PIN))
    r.nitrogen, r.phosphorus, r.potassium ← modbusRead(NPK_ADDR, 0x1E, 3)
    r.soilTemp  ← ds18b20.read()
    r.airTemp, r.humidity ← dht22.read()
    r.ph        ← calibratePh(analogRead(PH_PIN), r.soilTemp)
    r.rainfall  ← tips_since_last × 0.2794      // mm per tip
    r.ts        ← now()
    response ← HTTP POST /api/ingest, header X-Device-Key: KEY, body JSON(r)
    if response.status ≠ 201 then buffer.push(r) else flush(buffer)
on MQTT message agripulse/{farm}/{zone}/actuator/{name}:
    relay.on(); wait(params.minutes); relay.off()
```

### 5.3.2 Simulated node network

Because a research prototype cannot depend on three hardware nodes being connected at every demonstration and evaluation, the platform contains a simulated node network that stands in for the ESP32 nodes and feeds readings through the identical ingest pipeline. The simulator models each zone's state (moisture, nutrients, pH, active rain event, pending actuator effect) and generates readings with a diurnal cycle for air temperature and humidity, evapotranspiration-driven moisture decline that accelerates with temperature, stochastic rain events, slow nutrient depletion and pH drift. To exercise the validation pipeline realistically, it drops a packet with probability 1.5 % (representing wireless loss) and corrupts one field with probability 2 % (representing a sensor or transmission fault). Actuator commands raise moisture or nutrients so that workflow verification can be observed, and scenario presets (dry soil, rain, heat wave, nutrient drop, acidic soil, normal) can be injected from the digital-twin view to demonstrate specific decisions. The simulator can be switched off from Settings once real nodes are posting; the rest of the system is unaware of the difference.

## 5.4 Data Layer: Validation and Preparation Pipeline

The data-preparation module implements the process described in Section 3.7.3. Figure 5.1 shows its flowchart and Listing 5.2 its pseudocode. The module first maps field-name aliases (soil_moisture, n, p, k, temperature, rain and others) to canonical names, converts Fahrenheit and inch units when declared, and then, for each of the nine fields, checks presence (four fields are required), numeric type and physical range. The ranges are deliberately generous physical limits rather than agronomic ranges, so that unusual but genuine readings are not rejected: soil moisture 0–100 %, nutrients 0–500 mg/kg, temperatures −10 to 60 °C, humidity 0–100 %, pH 0–14 and rainfall 0–500 mm. Timestamps are parsed from ISO strings or epoch seconds/milliseconds, defaulted to the server time when absent, and rejected if more than five minutes in the future or older than 24 hours. A completeness score records the fraction of fields present. The result is either an accepted, normalised reading or a list of per-field error codes (MISSING, NOT_NUMERIC, OUT_OF_RANGE, INVALID_TIMESTAMP, FUTURE_TIMESTAMP, STALE_TIMESTAMP).

![Figure 5.1: Flowchart of the data validation and preparation pipeline](fig_flow_ingest.png)

```
Listing 5.2 — prepare(raw) (pseudocode of server/validate.js)
reading ← {}; errors ← []
for each (key, value) in raw:
    field ← ALIASES[key] or key
    if field ∈ FIELDS then reading[field] ← value
if raw.units.temperature = 'F' then convert soilTemp, airTemp to °C
if raw.units.rainfall = 'in' then reading.rainfall ← reading.rainfall × 25.4
for each field in FIELDS:
    v ← reading[field]
    if v is absent: reading[field] ← null; if field ∈ REQUIRED then errors.push({field, 'MISSING'})
    else if not numeric(v): errors.push({field, 'NOT_NUMERIC'}); reading[field] ← null
    else if v ∉ RANGE[field]: errors.push({field, 'OUT_OF_RANGE', v}); reading[field] ← null
    else reading[field] ← round(v, field = 'ph' ? 2 : 1)
t ← parse(raw.ts ?? now)
if t invalid: errors.push('INVALID_TIMESTAMP') else if t > now + 5 min: errors.push('FUTURE_TIMESTAMP')
else if t < now − 24 h: errors.push('STALE_TIMESTAMP')
reading.ts ← iso(t); reading.completeness ← count(present fields) / 9
return { ok: errors = ∅, reading, errors }
```

The ingest controller wraps this function: it authenticates the device key, increments the received counter, records an accepted or rejected entry in the ingest log with the error codes, stores accepted readings against the zone (capped at 320 readings per zone in the store, with older data available in the CSV export), updates the node's last-contact time and invokes the agent. Rejected readings are therefore never silent: they appear in the analytics view, they count against the data-quality metric, and if more than 10 % of a zone's readings in the last hour are rejected the agent raises a DATA_QUALITY warning. Figure 5.2 shows the analytics view with the ingest log, including a rejected reading caused by an out-of-range moisture value injected by the simulator.

![Figure 5.2: Analytics view showing the 24-hour soil-moisture trend with the policy band, summary statistics, data-quality metrics and the ingest and validation log](shot_analytics_en.png)

## 5.5 AI-Agent Decision Module

### 5.5.1 Crop policies

The agent's knowledge is expressed as crop policies, one per crop, listing the acceptable range or minimum for each parameter. Table 5.3 shows the three policies encoded for the prototype, derived from Department of Agriculture guidance and the sensing literature reviewed in Chapter 2. Policies are plain data and can be edited by an agronomist without changing the rule logic; changing a zone's crop in Settings switches the policy applied to that zone.

Table 5.3: Crop policies encoded in the prototype
| Parameter | Tomato | Chilli | Okra |
| Soil moisture (%) | 38–45 | 35–45 | 40–50 |
| Soil pH | 6.0–6.8 | 6.0–7.0 | 6.0–6.8 |
| Nitrogen minimum (mg/kg) | 40 | 35 | 35 |
| Phosphorus minimum (mg/kg) | 25 | 25 | 20 |
| Potassium minimum (mg/kg) | 30 | 30 | 30 |
| Air temperature (°C) | 18–32 | 20–33 | 22–35 |
| Soil temperature (°C) | 18–30 | 18–32 | 20–34 |
| Humidity maximum (%) | 80 | 85 | 85 |

### 5.5.2 Decision rules and evidence

Figure 5.3 shows the flowchart of the agent's evaluation of one zone, and Listing 5.3 shows the pseudocode. The agent first checks node liveness: if the node has not been heard from for four reporting intervals (minimum 90 seconds), it emits a critical SENSOR_OFFLINE decision with a sensor-check action. If no reading exists it emits NO_DATA. It then computes a confidence value that starts at 0.92 and is reduced when the latest reading is incomplete, older than 30 minutes or when the zone's recent rejection ratio exceeds 10 %, so that the displayed confidence reflects the quality of the evidence. Rainfall over the last hour is accumulated from the recent history. The rules are then evaluated in priority order: irrigation need (with a rain hold that suppresses irrigation when at least 2 mm fell in the last hour), high moisture, nutrient deficiency (all deficient nutrients grouped into one fertigation action), pH low or high, heat or cold stress, disease risk (humidity above the policy maximum with warm air), rain event (which carries a cancel-irrigation action), data quality, stale data and, if nothing else was raised at warning level or above, a HEALTHY decision. Each decision carries a code, a severity (critical, warning, info, good), the parameters needed to render it in any language, an evidence list of (metric, value, threshold, relation) tuples, a rule identifier, the policy applied, the confidence and a timestamp. Irrigation duration is derived from the moisture deficit (three minutes per percentage point, bounded between 8 and 30 minutes).

![Figure 5.3: Flowchart of the AI-agent zone evaluation](fig_flow_agent.png)

```
Listing 5.3 — evaluateZone(zone, latest, recent, node) (pseudocode of server/agent.js)
policy ← POLICIES[zone.crop]; decisions ← []
if node.lastSeen older than max(90 s, 4 × interval): push(SENSOR_OFFLINE, critical, action: sensor_check)
if latest is null: push(NO_DATA, warning); return decisions
confidence ← 0.92 − 0.07·[completeness < 1] − 0.25·[age > 30 min] − 0.10·[rejectedRatio > 0.1]
rain1h ← Σ rainfall of readings in last 60 min
if latest.moisture < policy.moisture.min:
    if rain1h ≥ 2 or latest.rainfall ≥ 3: push(RAIN_HOLD_IRRIGATION, info)
    else: deficit ← min − moisture; minutes ← clamp(3·deficit, 8, 30)
          push(IRRIGATE, deficit ≥ 5 ? critical : warning, evidence: [moisture < min, rain1h < 2], action: irrigation(minutes))
else if latest.moisture > policy.moisture.max: push(MOISTURE_HIGH, info)
low ← { n ∈ {N,P,K} : latest[n] < policy[n] }; if low ≠ ∅: push(NUTRIENT_LOW, warning, action: fertigation(low))
if latest.ph < policy.ph.min: push(PH_LOW, warning) else if latest.ph > policy.ph.max: push(PH_HIGH, warning)
if latest.airTemp > policy.airTemp.max: push(HEAT_STRESS, warning) else if < min: push(COLD_STRESS, info)
if latest.humidity > policy.humidityMax and latest.airTemp ≥ 24: push(DISEASE_RISK, warning)
if latest.rainfall ≥ 5: push(RAIN_EVENT, info, action: cancel_irrigation)
if rejectedRatio > 0.1: push(DATA_QUALITY, warning);  if age > 30 min: push(STALE_DATA, warning)
if no decision has severity ∈ {critical, warning}: push(HEALTHY, good)
return decisions sorted by severity
```

The evidence list is what makes the agent explainable. The interface renders each decision with a "Why was this suggested?" section that lists every evidence item in the user's language (for example "Soil moisture 32 % is below 38 %; Rainfall (last hour) 0 mm is below 2 mm; Rule R-IRRIGATE, tomato policy; Confidence 92 %"). Figure 5.4 shows the agent console with an irrigation decision expanded, the pending workflow awaiting approval and the trilingual assistant, in Sinhala.

![Figure 5.4: AI-agent console in Sinhala, showing an irrigation decision with its evidence, the workflow queue and the farm assistant](shot_agent_si.png)

### 5.5.3 Alerts and decision log

After each evaluation the alert manager raises an alert for each warning or critical decision that does not already have an open alert (updating the parameters and occurrence count of existing alerts), and resolves open alerts whose condition has cleared. Unread alerts are shown in the header bell in every view, and the full list, with severity and time, is available in the alerts menu. Whenever the set of decision codes for a zone changes, the decision log records the new set with its evidence and confidence, giving a compact history of state transitions that supports retrospective evaluation without storing every evaluation.

### 5.5.4 Trilingual assistant

The assistant classifies a free-text question into one of ten intents (irrigation, nutrients, pH, weather, disease, market, export, workflow, help, status) by matching keyword stems in English, Sinhala and Tamil, and detects a zone identifier (A1, B2, C3) if present. The classifier is deliberately simple: each intent has a list of stems (for irrigation: irrigat, water, moisture, dry, වතුර, ජල, වාරි, තෙතමන, நீர், பாசன, ஈரப்பத, and so on) and the intent with the most matches wins, defaulting to a status summary. The reply is composed on the client from the same snapshot that drives the dashboard, so the assistant can never contradict the displayed data: for the irrigation intent, for example, it reports each zone's moisture against its policy target and quotes the current irrigation decision if one exists. The interaction is logged with its intent for evaluation.

## 5.6 Workflow Orchestration Engine

Figure 5.5 shows the workflow state machine. Three workflow types are defined: irrigation and fertigation, which require approval and drive an actuator, and sensor check, which requires acknowledgement only. When the agent emits a decision with an action, the engine first checks that no open workflow of that type exists for the zone (preventing duplicates as readings arrive every few seconds), then creates the workflow with the originating decision embedded (code, parameters, evidence, rule and confidence) and an ordered list of steps: detected, approval, execute, verify and completed. The detected step is marked done by the agent. If the farm is in autonomous mode the engine immediately approves the workflow on the agent's behalf and records "AI agent" as approver; otherwise the workflow waits in the pending state, is shown with an amber badge on the dashboard and agent console, and increments the navigation badge.

![Figure 5.5: Workflow state machine with approval, execution and verification](fig_flow_workflow.png)

On approval the engine records the approver, builds an actuator command (actuator name, zone, parameters and MQTT topic agripulse/{farm}/{zone}/actuator/{actuator}), either applies it to the simulator or logs it for the MQTT bridge, marks the execute step done, sets a verification deadline eight minutes ahead and moves the workflow to running. A housekeeping tick, run after every accepted reading and every fifteen seconds, then verifies running workflows: an irrigation workflow completes when a reading taken after execution shows moisture at or above the policy minimum, and a fertigation workflow when every deficient nutrient has recovered. If the deadline passes without verification the workflow is marked failed and counted in the failure statistic, which feeds the workflow-automation metric. Rain events and rain holds cancel pending irrigation workflows with the reason recorded. Listing 5.4 shows the verification tick.

```
Listing 5.4 — tick() verification (pseudocode of server/workflows.js)
for each workflow w with status = running:
    policy ← POLICIES[zone(w).crop]
    latest ← last reading of w.zone with ts > w.executedAt
    ok ← false
    if latest exists:
        if w.type = irrigation:  ok ← latest.moisture ≥ policy.moisture.min
        if w.type = fertigation: ok ← ∀ n ∈ w.params.nutrients: latest[n] ≥ policy[n]
    if ok: mark steps verify, completed done; w.status ← done; stats.completed++
    else if now > w.verifyDeadline: mark verify failed; w.status ← failed; stats.failed++
```

Figure 5.6 shows the execution evidence: the workflow queue after approval, with the step timeline showing detected, approval (by the farmer), execute (command topic recorded) and verify in progress, followed by completion after the next reading.

![Figure 5.6: Digital-twin view of zone A1 in Tamil, showing readings against policy ranges, node status, the moisture sparkline, the AI advice and scenario controls](shot_twin_ta.png)

## 5.7 Web Application Layer and Digital-Twin Interface

### 5.7.1 Application structure

The web application is a single-page application served as static files by the same Node.js process that hosts the API. The client keeps a small state object (user, language, current page, latest dashboard snapshot, per-page data) and renders each view from that state using template functions; a hash-based router selects the view, and a delegated event handler dispatches data-action attributes to handler functions, which keeps the code free of per-element listener management. On sign-in the client fetches the dashboard snapshot (zones with latest readings, policies, decisions and node status; alerts; workflows; logs; statistics; metrics; market summary) and opens a Server-Sent Events connection; whenever the server broadcasts an update, ingest, B2B or log event, the client debounces a refresh of the snapshot and re-renders the current view. The API is a REST interface of forty-two endpoints over JSON, grouped into authentication, farm and twin, ingest, agent and workflows, evaluation and B2B, and every error is returned as a machine-readable code that the client translates.

### 5.7.2 Digital-twin dashboard

The dashboard (Figure 5.7) is the farmer's home view. A hero panel summarises the farm state in one sentence (for example, "1 zone needs urgent action"), the number of zones within policy and the number of workflows awaiting approval, with farm-average air temperature, humidity and rainfall. Eight metric tiles show the farm averages of the nine parameters with a note of how many zones are outside their policy range. Below, the zone map, drawn as an SVG scene with plots coloured by status (green optimal, amber attention, red critical) and a node-liveness dot, sits beside the current recommendations with their evidence; a third row shows the workflow queue, the system log and the B2B activity summary. Figure 5.8 shows the same dashboard rendered in Sinhala and Tamil, demonstrating that the whole view, including server-generated recommendations and log entries, is translated.

![Figure 5.7: Dashboard (digital-twin overview) in English](shot_dashboard_en.png)

![Figure 5.8: The same dashboard rendered in Sinhala (left) and Tamil (right)](shot_dashboard_si_ta.png)

The zone twin view (Figure 5.6) enlarges the scene, lets the user select a zone, and lists all nine readings against the policy ranges with colour-coded status, the node's label, liveness and last contact, a sparkline of the last 24 moisture readings, the top recommendation with evidence, and, when simulation is on, scenario controls. The analytics view (Figure 5.2) charts any parameter over 6, 24 or 72 hours with the policy band shaded, shows minimum, average and maximum, the sensor-integration, data-quality and workflow metrics, per-reading completeness and the ingest log, and exports CSV.

### 5.7.3 Trilingual design

The trilingual capability is a design property rather than a translation pass. Every string the user can see, including navigation, forms, decisions, workflow steps, export stages, documents, validation errors, API error codes and system log entries, is a key in a dictionary with English, Sinhala and Tamil entries (531 keys per language at the time of writing) and placeholder parameters. The server never sends prose: decisions are sent as codes with parameters and evidence, errors as codes, and logs as codes with metadata, and the client renders them in the active language. A parity check in the build verifies that the three dictionaries have identical key sets and identical placeholders. Crop names, nutrient names and units are themselves translated before interpolation, so that a Sinhala recommendation reads naturally. Dates, times, numbers and currencies are formatted with the browser's Intl API for the active locale, and relative times use dictionary strings because browser support for Sinhala and Tamil relative-time formatting is inconsistent. The language is chosen at login, stored in the user's profile and in local storage, and the document language attribute is set so that the correct Noto font family and line-height are applied; Sinhala and Tamil headings receive a larger line-height and no letter-spacing because the scripts have taller ascenders and stacked marks. Listing 5.5 shows the translation function and an example key in the three languages.

```
Listing 5.5 — translation with parameters (public/i18n.js, abridged)
t(lang, key, params) = interpolate((dict[lang][key] ?? dict.en[key] ?? key), params)
en: 'decision.IRRIGATE.detail': 'Soil moisture is {moisture}%, below the {min}–{max}% policy range. Run a {minutes}-minute drip cycle within the next hour.'
si: 'decision.IRRIGATE.detail': 'පස තෙතමනය {moisture}% ක් වන අතර එය {min}–{max}% ප්‍රතිපත්ති පරාසයට වඩා අඩුය. ඉදිරි පැය තුළ මිනිත්තු {minutes}ක බිංදු වාරි චක්‍රයක් ක්‍රියාත්මක කරන්න.'
ta: 'decision.IRRIGATE.detail': 'மண் ஈரப்பதம் {moisture}%, இது {min}–{max}% கொள்கை வரம்பை விடக் குறைவு. அடுத்த ஒரு மணி நேரத்திற்குள் {minutes} நிமிட சொட்டு நீர்ப்பாசன சுழற்சியை இயக்கவும்.'
```

The interface is responsive: below 900 pixels the sidebar becomes an off-canvas drawer, grids collapse to one column, and menus are repositioned; Figure 5.9 shows the dashboard and agent console on a phone in Tamil and Sinhala.

![Figure 5.9: Mobile layout: dashboard in Tamil (left) and agent console in Sinhala (right)](shot_mobile_ta_si.png)

## 5.8 Global B2B E-Commerce Layer

### 5.8.1 Listings linked to live field data

The marketplace (Figure 5.10) presents product listings as cards with the product's emoji, grade, price and unit, target market, quantity, category, certifications, seller and farm, harvest date and description. The distinctive feature is the optional link between a listing and a monitored zone: when linked, the card shows a "Live farm data" badge coloured by the zone's current status and the zone's latest soil moisture with its age, so that a buyer sees evidence of current field conditions beside the commercial data. Listings are created and edited through a validated form by the farmer, can be archived and restored, and are filtered by category, searched by text and, for the seller, restricted to "My listings".

![Figure 5.10: B2B marketplace in Tamil, showing listings with live farm-data badges, grades and certifications](shot_marketplace_ta.png)

### 5.8.2 Inquiry threads and quotation-to-order conversion

A buyer sends an inquiry from a listing with a wanted quantity and a message pre-filled in the buyer's language; the server creates a thread (or reuses the buyer's open thread for that listing) and notifies the seller through a Server-Sent Event. Both parties exchange messages in the Export Centre (Figure 5.11), and either may close the thread. The seller converts an open inquiry into an export order by entering quantity, price, destination and incoterm (FOB, CIF or EXW); the server creates the order at the quotation stage with the buyer, seller and product references, a document checklist and an unpaid payment record, marks the inquiry converted and posts a system message into the thread.

![Figure 5.11: Export Centre in Sinhala: inquiry thread with reply composer (left) and export order with stage timeline, document checklist and payment status (right)](shot_export_si.png)

### 5.8.3 Seven-stage export process

Orders progress through inquiry, quotation sent, buyer confirmed, quality verified, documents ready, dispatched and delivered. Listing 5.6 shows the stage-advance rule. Only the buyer may confirm the quotation; only the seller may advance the other stages (the buyer may confirm delivery); marking all four documents ready automatically advances a quality-verified order to documents ready; and dispatch is refused until all documents are ready and at least a deposit has been recorded. Each transition records the timestamp and actor, giving the traceability that export buyers and certification bodies require.

```
Listing 5.6 — advance(order, user) (pseudocode of server/api.js)
next ← STAGES[order.stage + 1]; isBuyer ← user = order.buyer
if next = buyer_confirmed and not isBuyer: reject BUYER_MUST_CONFIRM
if next ≠ buyer_confirmed and isBuyer and next ≠ delivered: reject SELLER_ONLY
if next = dispatched and not all documents ready: reject DOCUMENTS_INCOMPLETE
if next = dispatched and payment = unpaid: reject PAYMENT_REQUIRED
mark current stage done; order.stage++; mark new stage current (or done if delivered); record ts, actor
```

### 5.8.4 Payment-integration interface

Consistent with the thesis scope, external payment and logistics services are attached through explicit interfaces rather than implemented. The payment endpoint accepts a status (deposit or paid), a provider and a reference; the prototype records bank-transfer references entered by either party, and the interface note in the user interface states that a gateway adapter would replace this handler. Because the export-stage rules consume only the payment status, a gateway integration would not change the rest of the module.

## 5.9 Evaluation Instrumentation

A distinctive implementation feature is that the artefact computes the six thesis evaluation metrics from its own logs and presents them on an evaluation page (Figure 5.12), so that every DSRM demonstration and evaluation cycle can be assessed against Table 3.4 without external tooling. Sensor integration is the ratio of received to expected packets, where the simulator and the node reporting interval define expectation; data quality is the ratio of accepted to received readings; AI decision support is the agreement of the agent with the fifteen predefined scenarios, run on demand; workflow automation is the ratio of completed to completed-plus-failed workflows; web usability is the mean SUS score from questionnaires submitted through the page; and B2B functionality is the proportion of representative buyer–supplier workflows (inquiries answered or converted, orders confirmed) that completed. The scenario suite deliberately includes two scenarios (S14 and S15) whose expected outcome was fixed by expert judgement rather than by the encoded rules, so that agreement is measured rather than assumed; the agent disagrees with both, which is reported honestly as 13 of 15.

![Figure 5.12: Evaluation page computing the Table 3.2 metrics live, with the scenario suite results and the SUS questionnaire](shot_evaluation_en.png)

## 5.10 Security, Persistence and Deployment

### 5.10.1 Security

Passwords are hashed with scrypt using a per-user random salt and compared in constant time. Sessions are random 256-bit tokens stored with a 30-day expiry, delivered as HTTP-only, SameSite cookies (marked Secure behind HTTPS) and also accepted as bearer tokens for API clients; logout revokes the session and changing the password revokes all other sessions. Login is rate-limited to six failed attempts per address per fifteen minutes. Every response carries a Content Security Policy that permits scripts only from the application origin and fonts only from Google Fonts, together with nosniff, frame-denial, referrer and permissions headers. Request bodies are limited to one megabyte and parsed strictly; every field is validated and length-limited server-side, and all user-provided text is escaped before rendering to prevent cross-site scripting. Sensor nodes authenticate with per-device keys that can be rotated from Settings. Authorisation is role-based: farm, workflow, device and evaluation-run endpoints are restricted to farmers; listings can be modified only by their owner; inquiry threads and orders are visible only to their two parties; and stage rules enforce who may advance an order.

### 5.10.2 Persistence

The document store is a single JSON file written atomically (write to a temporary file, then rename) and debounced so that bursts of readings do not cause repeated disk writes. A schema version in the file allows migration; an unparseable file is backed up and reseeded rather than crashing the server. Per-zone readings are capped in the store and older data is available through CSV export, and logs, ingest entries and resolved alerts are trimmed to bounded lengths. This design is adequate for a farm-scale prototype and keeps the data inspectable; the data-access functions are isolated in one module so that a relational or document database can replace the file without changes to the rest of the system.

### 5.10.3 Deployment

The system starts with a single command on any host with Node.js 18 or later, seeds demonstration data on first start and needs no package installation. A Dockerfile builds a container with a persistent data volume and a health check, and environment variables configure the port, data directory and cookie security. The README documents local, Docker and platform-as-a-service deployment, node integration and the API. The dashboard, twin and agent views were verified in current Chrome, Safari and Firefox on desktop, tablet and phone viewports.

## 5.11 Chapter Summary

This chapter documented the design and implementation of the artefact across its six layers, justified each technology choice against alternatives, and elaborated the logic of the contribution-bearing components, the validation pipeline, the explainable rule-based agent, the workflow engine with verification, the trilingual digital-twin interface, the B2B export module and the self-evaluating instrumentation, with flowcharts, pseudocode, dictionary excerpts and screenshots synchronised with execution. Security, persistence and deployment were described. Chapter 6 now reports how the artefact was tested and evaluated against the thesis targets.
