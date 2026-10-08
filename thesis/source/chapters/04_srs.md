# CHAPTER 4 — SYSTEM REQUIREMENT SPECIFICATION

## 4.1 Chapter Overview

This chapter specifies the requirements of the Smart Farming Web System. It identifies and analyses the stakeholders (Section 4.2), describes the operationalisation process by which facts gathered from stakeholders, documents and the literature were mapped onto the research objectives and validated as requirements (Section 4.3), and presents the system analysis through UML models: use-case diagrams with specifications (Section 4.4), a class diagram (Section 4.5), an activity diagram (Section 4.6), sequence diagrams for the three most important use cases (Section 4.7) and a deployment diagram (Section 4.8). Section 4.9 presents the proposed system architecture, Section 4.10 lists the functional requirements and Section 4.11 the non-functional requirements, and Section 4.12 summarises the chapter. Less important use-case specifications are placed in Appendix A to conserve page count.

## 4.2 Stakeholder Analysis

Stakeholders were identified using the onion model, which distinguishes those who operate the system, those who benefit from it in the containing organisation, and those in the wider environment who influence or are affected by it. Table 4.1 lists the stakeholders, their interest in the system, their influence and the requirements that flow from them.

Table 4.1: Stakeholder analysis
| Stakeholder | Role | Interest | Influence | Key requirements contributed |
| Farmer (smallholder owner-operator) | Primary operational user | Timely, understandable advice on irrigation, fertiliser and crop health; less manual checking; better prices | High | Trilingual interface; mobile use; plain-language recommendations with reasons; approval before automation; alerts |
| Farm manager (medium-scale farm) | Operational and supervisory user | Overview of several zones; audit trail of actions; configuration of crops and devices; data export | High | Zone map; workflow history; settings for zones, policies and devices; CSV export; autonomous mode |
| Export buyer / importer | Commercial user | Verified, gradable produce; reliable communication; visibility of order progress and documents | High | Marketplace with live field status; inquiry threads; quotation and order tracking; document and payment status |
| Agronomist / extension officer | Advisory stakeholder | Ability to inspect and adjust decision rules; confidence that advice is evidence-based | Medium | Explainable decisions; editable crop policies; disclaimer that advice is decision support |
| Sensor-node installer / technician | Technical user | Simple provisioning of nodes; clear diagnostics when a node fails or sends bad data | Medium | Device keys; ingest documentation; ingest log with rejection reasons; offline alerts |
| Exporter / logistics partner | Environmental stakeholder | Structured export documents and stages; integration interface | Low–medium | Seven-stage export process; document checklist; payment interface |
| Research supervisor and evaluation panel | Academic stakeholder | Rigorous, evaluable artefact aligned with the thesis | High | Evaluation page computing thesis metrics; scenario suite; test suite |
| Regulator / certification body | Environmental stakeholder | Traceability of good agricultural practice | Low | Certification fields on listings; audit logs |
| Platform operator / system administrator | Technical stakeholder | Easy deployment, backup and security | Medium | Zero-dependency deployment; Docker; persistent data directory; security headers |

The analysis shows that the farmer and the buyer are the two primary actors whose goals define the principal workflows, that the farm manager extends the farmer's goals with supervisory and configuration needs, and that explainability and traceability serve several stakeholders simultaneously (farmer, agronomist, panel and regulator), which justified treating them as architectural properties rather than features.

## 4.3 Operationalisation Process

Operationalisation is the process of converting the research objectives into observable requirements and, later, into measurable evaluation criteria. Table 4.2 maps each fact-gathering technique used in the study to the questions it addressed and the objective it served. The facts gathered were reviewed for consistency, triangulated across sources, and accepted as requirements only when they were supported by at least two sources or by explicit stakeholder confirmation.

Table 4.2: Operationalisation of fact-gathering techniques to objectives
| Technique | Questions / items addressed | Facts obtained | Objective |
| Semi-structured discussions with three farmers and one farm manager (Sinhala and Tamil speaking) | Which field conditions do you check, how often, and how do you decide to irrigate or fertilise? What would make you trust an automatic recommendation? Which language and device would you use? | Moisture and rain are checked visually once or twice daily; fertiliser decisions follow a calendar; trust depends on seeing the reason; phone use dominates; Sinhala or Tamil strongly preferred | Analyse (1.7.2) |
| Discussions with two agribusiness/export contacts | What information do buyers need before committing? Which documents and stages does an export order pass through? Where do delays occur? | Grade, certification, quantity, harvest date and destination are decisive; the seven stages and four documents of Section 2.5.3; delays arise from unanswered inquiries and incomplete documents | Analyse (1.7.2) |
| Document analysis of export documentation (invoice, packing list, phytosanitary certificate, certificate of origin) and GAP certification requirements | What fields must a listing and order carry? | Product, grade, quantity, unit, price, currency, certifications, destination, incoterm | Analyse (1.7.2) |
| Literature-derived crop policies (Department of Agriculture guidance for tomato, chilli and okra; sensing literature in Chapter 2) | What thresholds define healthy ranges for each parameter and crop? | Policy ranges in Table 5.3 | Design (1.7.3) |
| Panel and supervisor feedback (proposal defence, interim viva) | Is explainability sufficient? How is B2B linked to farm data? How will targets be measured? | Requirements for evidence display, live listing status and a self-computing evaluation page | Design and evaluate (1.7.3, 1.7.4) |
| Prototype demonstrations (Cycles 1–2) | Are labels understandable? Are actions discoverable? | Complete translation rather than partial; rain must cancel irrigation; rejected readings must be visible | Design (1.7.3) |

Reviewing the results of the data gathering confirmed the validity of the selected requirements: every functional requirement in Section 4.10 traces to at least one row of Table 4.2, and every evaluation metric in Table 3.4 traces to a research question and an objective.

## 4.4 Use-Case Analysis

Figure 4.1 shows the use-case diagram for the system. Four actors are modelled: Farmer (which generalises Farm Manager for the purposes of the diagram, with the manager's configuration use cases marked), Buyer, Sensor Node (a system actor) and the AI Agent (a system actor that initiates use cases autonomously).

![Figure 4.1: Use-case diagram of the Smart Farming Web System](fig_usecase.png)

The most important use-case specifications are given below; the remaining specifications (UC-08 to UC-16) are provided in Appendix A.

### 4.4.1 UC-01 Ingest sensor reading

Table 4.3: Use-case specification UC-01 Ingest sensor reading
| Item | Description |
| Use case | UC-01 Ingest sensor reading |
| Actors | Sensor Node (primary); AI Agent (secondary) |
| Preconditions | Node is registered with a valid device key and assigned to a zone |
| Main flow | 1. Node posts a JSON reading with its device key. 2. System authenticates the key and identifies the zone. 3. System normalises field names and units. 4. System validates required fields, ranges and timestamp. 5. System stores the reading, updates node last-contact time and ingest statistics. 6. System invokes the AI Agent for the zone (UC-02). 7. System pushes a live update to connected dashboards. |
| Alternative flows | 4a. Validation fails: system records a rejected entry with per-field error codes, increments the rejection count, returns 422 with the errors, and ends. 2a. Key unknown: system returns 401 and ends. |
| Postconditions | Reading persisted; decisions and alerts for the zone up to date |

### 4.4.2 UC-02 Generate recommendation

Table 4.4: Use-case specification UC-02 Generate recommendation
| Item | Description |
| Use case | UC-02 Generate recommendation |
| Actors | AI Agent (primary) |
| Preconditions | A zone has a crop policy and at least one validated reading |
| Main flow | 1. Agent loads the zone's policy, latest reading, last hour of readings and node status. 2. Agent evaluates the prioritised rule set (offline, moisture, nutrients, pH, temperature, humidity, rain, data quality, staleness). 3. For each triggered rule the agent creates a decision with code, severity, parameters, evidence, rule identifier and confidence. 4. Agent raises or resolves alerts for warning and critical decisions. 5. Agent opens a workflow for each decision that carries an action (UC-03). 6. Agent records the decision set in the decision log if it changed. |
| Alternative flows | 1a. No readings: agent emits a NO_DATA warning. 2a. Rain detected with low moisture: agent emits a hold-irrigation decision instead of irrigation and cancels any pending irrigation workflow. |
| Postconditions | Zone status (optimal, attention, critical) and decisions available to the dashboard |

### 4.4.3 UC-03 Approve and execute workflow

Table 4.5: Use-case specification UC-03 Approve and execute workflow
| Item | Description |
| Use case | UC-03 Approve and execute workflow |
| Actors | Farmer (primary); AI Agent (secondary) |
| Preconditions | A workflow is in the pending state |
| Main flow | 1. Farmer reviews the recommendation and its evidence. 2. Farmer approves. 3. System records the approver, marks the approval step done and sets the workflow to running. 4. System issues an actuator command (to the simulator or to the MQTT actuator topic). 5. On subsequent readings the system verifies the target condition (for example moisture at or above the policy minimum). 6. System marks the workflow done and logs completion. |
| Alternative flows | 2a. Farmer rejects: workflow is marked rejected. 3a. Autonomous mode is on: the agent performs steps 2–3 itself and records "AI agent" as approver. 5a. Verification does not succeed within the deadline: workflow is marked failed and counted in the failure statistic. |
| Postconditions | Workflow outcome recorded with full step history |

### 4.4.4 UC-04 Create product listing

Table 4.6: Use-case specification UC-04 Create product listing
| Item | Description |
| Use case | UC-04 Create product listing |
| Actors | Farmer |
| Preconditions | Farmer is signed in |
| Main flow | 1. Farmer opens the marketplace and chooses "Create listing". 2. Farmer enters name, category, grade, quantity, unit, price, currency, target market, harvest date, certifications, description and optionally links a zone. 3. System validates the fields. 4. System publishes the listing with live status derived from the linked zone. |
| Alternative flows | 3a. Validation fails: the form shows the error in the active language. |
| Postconditions | Listing visible to buyers with live field status |

### 4.4.5 UC-05 Send inquiry and negotiate

Table 4.7: Use-case specification UC-05 Send inquiry and negotiate
| Item | Description |
| Use case | UC-05 Send inquiry and negotiate |
| Actors | Buyer (primary); Farmer (secondary) |
| Preconditions | Buyer is signed in; listing is active and not owned by the buyer |
| Main flow | 1. Buyer opens a listing and sends an inquiry with quantity and message. 2. System creates an inquiry thread (or reuses the buyer's open thread for that listing) and notifies the seller. 3. Seller replies; buyer and seller exchange messages. 4. Seller converts the inquiry into an export order (UC-06) or either party closes it. |
| Postconditions | Thread persisted; order created if converted |

### 4.4.6 UC-06 Track export order

Table 4.8: Use-case specification UC-06 Track export order
| Item | Description |
| Use case | UC-06 Track export order |
| Actors | Farmer (seller); Buyer |
| Preconditions | An order exists |
| Main flow | 1. Seller enters quantity, price, destination and incoterm; system creates the order at the quotation stage with a document checklist and unpaid status. 2. Buyer confirms the quotation. 3. Seller marks quality verified. 4. Seller marks the four documents ready; system advances to documents-ready. 5. A payment (deposit or full) is recorded. 6. Seller marks dispatched. 7. Delivery is confirmed. |
| Alternative flows | 6a. Documents incomplete or payment unpaid: system refuses dispatch with a translatable error. 2a. Seller attempts to confirm on the buyer's behalf: system refuses. |
| Postconditions | Order at a recorded stage with timestamps and actors for each transition |

### 4.4.7 UC-07 Ask the farm assistant

Table 4.9: Use-case specification UC-07 Ask the farm assistant
| Item | Description |
| Use case | UC-07 Ask the farm assistant |
| Actors | Farmer |
| Main flow | 1. Farmer types a question in English, Sinhala or Tamil, optionally naming a zone. 2. System classifies the intent (irrigation, nutrients, pH, weather, disease, market, export, workflow, help or status). 3. Client composes an answer from the current validated data and decisions in the active language. |
| Postconditions | Query logged with intent |

## 4.5 Class Diagram

Figure 4.2 presents the domain class diagram. The central classes are Farm, Zone, SensorNode and Reading on the monitoring side; CropPolicy, Decision, Evidence, Alert and Workflow (with WorkflowStep) on the decision side; and User, Product, Inquiry, Message, Order, OrderStage, Document and Payment on the commerce side. Zone aggregates Readings and is associated with exactly one CropPolicy through its crop attribute and with one SensorNode; Decision references the Zone and the Reading that produced it and contains a list of Evidence items; Workflow references the originating Decision and contains ordered WorkflowSteps. Product optionally references a Zone, which is how live field status reaches the marketplace; Inquiry links a Buyer, a Seller and a Product and contains Messages; Order references the Inquiry, Product and both Users and contains OrderStages, Documents and a Payment. User carries a role (farmer or buyer) and a preferred language.

![Figure 4.2: Domain class diagram](fig_class.png)

## 4.6 Activity Diagram

Figure 4.3 shows the activity diagram for the end-to-end monitoring-to-action process, which is the core workflow of the system. The diagram uses swim lanes for the Sensor Node, the Data Layer, the AI Agent, the Farmer and the Actuator. It shows the reading being posted, validated and stored; the agent evaluating rules and branching on the presence of an action; the decision point at which the farmer approves or rejects (or the agent auto-approves in autonomous mode); execution of the actuator command; and the verification loop that completes or fails the workflow.

![Figure 4.3: Activity diagram of the monitoring-to-action process](fig_activity.png)

## 4.7 Sequence Diagrams

Three sequence diagrams model the most important use cases. Figure 4.4 (UC-01 and UC-02) shows the interaction between the sensor node, the ingest controller, the validation component, the data store, the agent, the workflow engine and the event hub when a reading arrives. Figure 4.5 (UC-03) shows the farmer approving a workflow through the browser, the API recording the approval, the actuator command being issued and the later verification against a fresh reading. Figure 4.6 (UC-05 and UC-06) shows the buyer sending an inquiry, the seller replying and converting it to an order, and the buyer confirming the quotation, including the server-sent notifications that keep both parties' views current.

![Figure 4.4: Sequence diagram for sensor ingest and recommendation generation (UC-01, UC-02)](fig_seq_ingest.png)

![Figure 4.5: Sequence diagram for workflow approval, execution and verification (UC-03)](fig_seq_workflow.png)

![Figure 4.6: Sequence diagram for buyer inquiry, quotation and order confirmation (UC-05, UC-06)](fig_seq_b2b.png)

## 4.8 Deployment Diagram

Figure 4.7 shows the deployment view. ESP32 nodes in the field communicate over Wi-Fi (directly by HTTP) or over LoRa or Wi-Fi to an optional gateway running an MQTT broker and bridge, which forwards readings by HTTP to the application server. The application server is a single Node.js process that serves both the REST/SSE API and the static web application, and persists data to a JSON document store on a mounted volume; it can run on a local machine, a virtual private server or a container platform. Farmers and buyers access the web application from browsers on phones, tablets and computers. An optional reverse proxy terminates HTTPS. External payment and logistics services attach through the payment-integration interface.

![Figure 4.7: Deployment diagram](fig_deploy.png)

## 4.9 Proposed System Architecture

The proposed six-layer architecture was introduced in Figure 3.2 and is elaborated here from the perspective of component responsibilities and interfaces. Table 4.10 lists, for each layer, its components, its responsibilities and the interfaces it exposes to adjacent layers. The interfaces are deliberately narrow: the network layer exposes a single ingest endpoint; the data layer exposes a validation function and a store; the agent exposes an evaluate function whose output is a list of decisions; the workflow engine consumes decisions and exposes approve, reject, acknowledge and tick operations; and the web layer exposes a REST API and an event stream. This narrowness is what allows each layer to be tested and replaced independently, satisfying the modularity principle argued in Chapter 2.

Table 4.10: Architectural layers, components, responsibilities and interfaces
| Layer | Components | Responsibilities | Interfaces |
| 1. IoT sensor layer | ESP32 nodes; sensors; relay actuator; simulator (stand-in) | Measure nine parameters; report at a configured interval; act on actuator commands | JSON reading payload; actuator topic |
| 2. Network layer | HTTP ingest endpoint; device-key authentication; MQTT topic convention and bridge | Transport readings securely from field to backend | POST /api/ingest with X-Device-Key; agripulse/{farm}/{zone}/readings |
| 3. Data layer | Validation and preparation module; JSON document store; ingest log; CSV export | Normalise, validate, persist and expose data | prepare(reading); db.load/save; GET /api/readings |
| 4. AI-agent and decision layer | Crop policies; rule engine; evidence recorder; alert manager; workflow engine; scenario suite; intent classifier | Interpret data, produce explainable decisions, orchestrate and verify workflows, measure agreement | evaluateZone(); syncDecisions(); approve/reject/acknowledge/tick; runScenarios(); classifyIntent() |
| 5. Web application layer | REST API; SSE hub; session and role management; trilingual single-page interface; evaluation page | Present digital twin, analytics, agent console, settings and evaluation to users in three languages | /api/* ; /api/events; i18n dictionary |
| 6. Global B2B e-commerce layer | Product, inquiry, order, document and payment models; role-based stage rules; payment-integration interface | Product presentation, buyer–supplier interaction, export process tracking, external service attachment | /api/products, /api/inquiries, /api/orders |

## 4.10 Functional Requirements

Functional requirements are grouped by layer and numbered for traceability to the tests in Chapter 6. Priority uses the MoSCoW scale (Must, Should, Could).

Table 4.11: Functional requirements
| ID | Requirement | Priority | Source |
| FR-01 | The system shall accept sensor readings for soil moisture, nitrogen, phosphorus, potassium, soil temperature, air temperature, humidity, pH and rainfall from authenticated sensor nodes over HTTP. | Must | Objectives; farmers |
| FR-02 | The system shall normalise common field-name aliases and unit variants (°F, inches) before validation. | Should | Technician |
| FR-03 | The system shall reject readings with missing required fields, non-numeric or out-of-range values, or invalid timestamps, and shall record the reason for each rejection. | Must | Literature; technician |
| FR-04 | The system shall compute and display a completeness score for each accepted reading. | Should | Literature |
| FR-05 | The system shall provide a simulated sensor network, with configurable interval, that can be disabled when hardware nodes are connected, and shall allow scenario injection (dry soil, rain, heat, nutrient drop, acidic soil, normal). | Must | Evaluation |
| FR-06 | The AI agent shall evaluate each zone against its crop policy after every accepted reading and produce decisions with a code, severity, parameters, evidence list, rule identifier and confidence value. | Must | Objectives; agronomist |
| FR-07 | The agent shall detect at least the following conditions: irrigation need, rain hold, high moisture, nutrient deficiency, low and high pH, heat and cold stress, disease risk, rain event, data-quality degradation, stale data, sensor offline and healthy state. | Must | Farmers; literature |
| FR-08 | The agent shall raise alerts for warning and critical decisions, resolve them when the condition clears and show unread counts. | Must | Farmers |
| FR-09 | The system shall create workflows (irrigation, fertigation, sensor check) from actionable decisions, avoiding duplicates for the same zone and type, with detected, approval, execute, verify and completed steps. | Must | Objectives |
| FR-10 | Farmers shall be able to approve, reject or acknowledge pending workflows; approval shall issue an actuator command and start verification against later readings with a deadline. | Must | Farmers |
| FR-11 | An autonomous mode shall allow the agent to approve and execute its own workflows; it shall be off by default. | Should | Farm manager |
| FR-12 | Rain events shall cancel pending irrigation workflows automatically. | Must | Demonstration feedback |
| FR-13 | The dashboard shall show farm-level summary metrics, a zone map coloured by status, current recommendations, workflow status, system log and B2B activity, and shall update live. | Must | Farmers |
| FR-14 | The digital-twin view shall show, for a selected zone, all nine readings with policy ranges, node status, a moisture sparkline and the top recommendation with evidence. | Must | Farm manager |
| FR-15 | The analytics view shall chart any parameter for 6, 24 or 72 hours with the policy band, show min/avg/max statistics, data-quality metrics and the ingest log, and export CSV. | Must | Farm manager |
| FR-16 | The agent console shall list decisions per zone with an expandable "why" section, the open and recent workflow queue with step timelines, and a natural-language assistant that understands English, Sinhala and Tamil. | Must | Farmers; panel |
| FR-17 | The entire interface, including server-originated messages, errors, decisions and logs, shall be available in English, Sinhala and Tamil, selectable at login and in settings and persisted per user. | Must | Farmers |
| FR-18 | Users shall register and sign in with email and password as farmer or buyer, manage their profile and change their password. | Must | All |
| FR-19 | Farmers shall create, edit, archive and restore product listings with category, grade, quantity, unit, price, currency, target market, harvest date, certifications, description and optional linked zone; listings shall display live field status when linked. | Must | Buyers; export contacts |
| FR-20 | Buyers shall browse, filter and search listings and send inquiries; buyers and sellers shall exchange messages in threads; either party may close a thread. | Must | Buyers |
| FR-21 | Sellers shall convert an open inquiry into an export order with quantity, price, destination and incoterm. | Must | Export contacts |
| FR-22 | Orders shall progress through inquiry, quotation, buyer confirmed, quality verified, documents ready, dispatched and delivered, with role rules (only the buyer confirms; only the seller advances other stages), a four-document checklist and payment recording (deposit or paid) through an integration interface; dispatch shall require complete documents and at least a deposit. | Must | Export contacts |
| FR-23 | The system shall compute and display the six evaluation metrics of Table 3.4 from its own logs, run the scenario suite on demand and collect SUS questionnaires. | Must | Panel |
| FR-24 | Farm managers shall configure farm name, location, reporting interval, simulation and autonomous mode, zone crops and areas, and view, copy and rotate device keys with ingest documentation. | Should | Farm manager; technician |
| FR-25 | The system shall provide a health endpoint and a CSV export of all readings. | Could | Administrator |

## 4.11 Non-Functional Requirements

Non-functional requirements are organised using the ISO/IEC 25010 quality characteristics.

Table 4.12: Non-functional requirements (ISO/IEC 25010)
| ID | Characteristic | Requirement | Measure |
| NFR-01 | Performance efficiency | Dashboard API responses shall complete within 200 ms at the 95th percentile on commodity hardware, and the ingest endpoint within 50 ms, with the server sustaining at least 50 concurrent dashboard requests. | Latency tests (Section 6.4) |
| NFR-02 | Reliability | Readings shall be processed without loss once received; persistence shall use atomic writes so that a crash cannot corrupt the store; a corrupted store shall be backed up and reseeded rather than causing failure. | Fault-injection test |
| NFR-03 | Availability | The server shall restart within five seconds and restore sessions from persistent storage. | Restart test |
| NFR-04 | Usability | The interface shall achieve a mean SUS score of at least 85 and a task completion rate of at least 85 % across participants using each of the three languages; all interactive elements shall be reachable by keyboard and labelled for screen readers. | SUS study; accessibility check |
| NFR-05 | Security | Passwords shall be hashed with scrypt and a per-user salt; sessions shall expire after 30 days and be revocable; login shall be rate-limited; cookies shall be HTTP-only and SameSite; a Content Security Policy and standard security headers shall be set; device keys shall authenticate nodes and be rotatable; request bodies shall be size-limited and validated. | Security review (Section 6.4) |
| NFR-06 | Compatibility | The web application shall run on current Chrome, Safari and Firefox on phones, tablets and desktops without plugins, and the backend on Node.js 18 or later on Linux, macOS and Windows. | Cross-browser check |
| NFR-07 | Maintainability | The backend shall have no third-party runtime dependencies; modules shall have single responsibilities; an automated end-to-end test suite shall cover authentication, ingest, agent, workflows, B2B and evaluation. | Test suite; code review |
| NFR-08 | Portability | The system shall be deployable with a single command locally and as a Docker container with a persistent data volume. | Deployment test |
| NFR-09 | Localisation | Every user-visible string shall exist in all three languages with identical placeholders; dates and numbers shall be formatted for the active locale. | Dictionary parity check |
| NFR-10 | Explainability and traceability | Every recommendation shall be reproducible from its recorded evidence and rule; every workflow shall record who performed each step and when. | Inspection of decision and workflow records |

## 4.12 Chapter Summary

This chapter analysed the stakeholders of the Smart Farming Web System, described how facts gathered from discussions, documents, literature and demonstrations were operationalised into validated requirements, and modelled the system through use-case, class, activity, sequence and deployment diagrams. The six-layer architecture was elaborated in terms of component responsibilities and interfaces, and twenty-five functional and ten non-functional requirements were specified with priorities and sources. These requirements are the basis of the design and implementation described in Chapter 5 and of the test cases in Chapter 6.
