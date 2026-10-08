# CHAPTER 3 — METHODOLOGY

## 3.1 Chapter Overview

This chapter tells the story of how the research was carried out, from the philosophical position adopted to the day-to-day mechanics of building and evaluating the artefact. It describes the research paradigm and its justification (Section 3.2), the research approach (Section 3.3), the research strategy (Section 3.4) and the fact-collection mechanisms (Section 3.5). Section 3.6 presents the research methodology execution workflow as a table that shows how each stage of the Design Science Research Methodology was addressed, and Section 3.7 explains the overall research design that resulted, including the tools and technologies selected, the data-preparation process and the evaluation plan. Section 3.8 justifies the choice of Scrum as the project management methodology and presents the project timeline, Section 3.9 discusses ethical considerations and limitations, and Section 3.10 summarises the chapter.

## 3.2 Research Paradigm

A research paradigm is the philosophical worldview that determines what counts as knowledge and how it may legitimately be produced (Saunders, Lewis and Thornhill, 2019). Three paradigms were considered for this study. Positivism seeks objective, generalisable laws through controlled measurement; it suits studies that test hypotheses about an existing phenomenon but fits poorly a study whose purpose is to create something new. Interpretivism seeks to understand the meanings that people attach to their situation; it is valuable for understanding farmers' experience of technology but does not, by itself, produce a working system. Pragmatism holds that the value of knowledge lies in its practical consequences, that research questions should determine methods, and that quantitative and qualitative evidence may be combined when doing so best answers the question.

This study adopts pragmatism, and specifically the Design Science Research (DSR) paradigm that Hevner et al. (2004) describe as the pragmatic complement to behavioural science in information systems. The justification is threefold. First, the central outcome of the research is a software artefact designed to solve a practical, real-world problem, namely the fragmentation of environmental monitoring, decision support and commerce in smallholder and export-oriented agriculture, as established in Section 1.3; the appropriate test of such an artefact is its utility, which is a pragmatic criterion. Second, the research questions (Section 1.4) require both technical measurement (transmission reliability, data quality, workflow success) and human judgement (usability, perceived usefulness), which pragmatism permits combining. Third, the perspective from which the problem is analysed is that of the farmer and the buyer who must use the system, and the fact-collection facets must therefore include both instrumented system data and structured feedback from those users. Adopting pragmatism gives a clear angle of analysis: every design decision is evaluated by whether it makes the integrated platform more useful, more reliable and more usable for its intended users.

## 3.3 Research Approach

Saunders, Lewis and Thornhill (2019) distinguish deductive reasoning, which tests theory against data, from inductive reasoning, which builds theory from data, and identify abductive reasoning, which moves iteratively between the two, as characteristic of pragmatic and design-oriented research. This study is primarily abductive with a deductive evaluation component. The design of the artefact was inductive in origin: it emerged from the researcher's observation of farming practice, the review of literature and the analysis of existing systems, which together suggested that integration, explainability and multilingual design were the missing properties. The design was then refined abductively across three build-and-evaluate cycles, in which each demonstration produced surprises (for example, that rain events must cancel pending irrigation, or that Sinhala labels required different layout widths) that led to revisions of the design. Finally, the evaluation is deductive: the artefact was tested against predefined, quantitative targets derived from the objectives, and the results either confirm or disconfirm that the design achieves its intended utility.

## 3.4 Research Strategy

The research strategy is Design Science Research, executed through the Design Science Research Methodology (DSRM) process model of Peffers et al. (2007). DSRM was chosen in preference to alternatives such as experiment, survey, case study and action research because none of those strategies is organised around the creation of an artefact. An experiment presupposes a treatment that already exists; a survey describes attitudes rather than producing a system; a case study examines a phenomenon in its context but does not intervene; and action research intervenes in an organisation but does not necessarily produce generalisable design knowledge. DSRM, by contrast, prescribes the iterative identification of a problem, definition of objectives for a solution, design and development of an artefact, demonstration, evaluation and communication, and it requires that the artefact be evaluated rigorously against the objectives. Within DSRM, the study uses a build-and-evaluate orientation, applied iteratively rather than as a single linear pass, as Figure 3.1 illustrates.

![Figure 3.1: Design Science Research Methodology process model, adapted from Peffers et al. (2007) and applied iteratively to the Smart Farming Web System](fig_dsrm.png)

Because DSRM is applied iteratively, the design-and-development activity was revisited three times as demonstration and evaluation surfaced refinements to the sensor configuration, the agent decision logic, the workflow design, the B2B process and the trilingual interface. The three cycles are described in Section 3.6.

## 3.5 Fact-Collection Mechanisms

The study draws on complementary technical and user-focused data sources in order to evaluate both the engineering performance and the practical value of the proposed system. Table 3.1 lists the fact-collection mechanisms, the facts each collects and the research objective it serves.

Table 3.1: Fact-collection mechanisms and the objectives they serve
| Mechanism | Facts collected | Serves objective |
| Literature review and analysis of existing systems (Chapter 2) | Limitations of current approaches; design principles; the research gap | To identify (1.7.1) |
| Stakeholder analysis and requirement elicitation (Chapter 4), including semi-structured discussions with three farmers, one farm manager and two agribusiness/export contacts, and analysis of the export documentation process | Functional and non-functional requirements; decision policies for tomato, chilli and okra; export process stages and documents | To analyse (1.7.2) |
| Sensor-data collection from ESP32 nodes and the simulated node network | Environmental readings; transmission reliability; data completeness; validation rejection reasons | To design/develop and to evaluate (1.7.3, 1.7.4) |
| System logs and evaluation metrics computed by the artefact | Workflow execution success; decision outputs; alert history; ingest statistics | To evaluate (1.7.4) |
| Automated scenario suite (fifteen predefined field scenarios with expected decisions) | Agreement between agent output and expected outcomes | To evaluate (1.7.4) |
| Functional and non-functional test suites (end-to-end API tests, latency and concurrency tests, security checks) | Correctness and performance of the artefact | To evaluate (1.7.4) |
| Structured user evaluation: task-based sessions and the System Usability Scale questionnaire with twelve participants across the three interface languages | Task completion; SUS score; qualitative feedback | To evaluate (1.7.4) |
| Prototype demonstrations to the supervisor and evaluation panels (proposal defence, interim viva) | Expert feedback on scope, design and evaluation | All objectives |

Sensor readings provide quantitative environmental data for testing the monitoring pipeline described in Section 5.4. System logs provide evidence about data transmission reliability, workflow execution and the timing of notification or action events generated by the AI-agent layer. User testing and structured feedback provide complementary qualitative and quantitative information about the usability and perceived usefulness of the web interface and decision-support functions. Scenario-based testing evaluates the quality and consistency of AI-agent recommendations and automated workflows, and prototype demonstrations, conducted with representative users, gather qualitative feedback on the overall platform.

## 3.6 Research Methodology Execution Workflow

Table 3.2 shows how each of the six DSRM activities was operationalised in this study, mapped to the aspects that the Faculty guideline requires to be addressed: problem identification, relevance justification, comparative analysis and gap justification, definition of objectives, design, development and data handling, and evaluation and communication.

Table 3.2: Research methodology execution workflow (DSRM activities and their application)
| DSRM activity | Aspect addressed | How it was executed in this study | Output |
| 1. Problem identification and motivation | Problem identification; relevance justification | Observation of farming practice; review of national statistics (Department of Census and Statistics, Central Bank, Export Development Board) and FAO reports; identification of general and specific problems (Section 1.3) | Problem statement; research question; motivation |
| 2. Define objectives of a solution | Comparative analysis and gap justification; define and finalise objectives | Literature review of four thematic strands; comparative assessment of seven existing systems (Table 2.1); derivation of the research gap; formulation of four objectives (identify, analyse, design/develop, evaluate) and six measurable evaluation targets (Table 3.4) | Chapter 2; objectives; evaluation targets |
| 3. Design and development | Design, development, data management and handling | Stakeholder analysis and requirement specification (Chapter 4); six-layer architecture; three Scrum-managed build cycles producing the ingest pipeline, agent, workflows, digital twin, B2B module and trilingual interface (Chapter 5); JSON persistence with atomic writes and CSV export | Working artefact (AgriPulse v3.0); design documentation |
| 4. Demonstration | Design / development validation | Demonstration of the prototype using representative monitoring scenarios (dry soil, rain event, heat wave, nutrient drop, acidic soil) and business scenarios (inquiry, quotation, order, documents, payment, dispatch) to the supervisor, panels and participants | Demonstration scripts; feedback logs |
| 5. Evaluation | Evaluation | Instrumented twenty-minute measurement run; automated scenario suite; functional and non-functional tests; SUS-based user evaluation; comparison with the six targets; mapping of results to research questions (Chapter 6) | Evaluation results; target attainment |
| 6. Communication | Communication | Interim submissions, interim viva, thesis draft and final thesis; this document; source code and README for reproduction | Thesis; artefact repository |

### 3.6.1 The three iterative cycles

Cycle 1 (December 2025 to February 2026) established the problem, objectives and a first proof of concept: a single simulated sensor stream, a fixed irrigation rule and a static dashboard, demonstrated at the proposal defence. Panel feedback asked for explicit explainability of recommendations and for clarity on how B2B functions would connect to farm data.

Cycle 2 (March to June 2026) produced the layered backend, the validation pipeline, the rule-based agent with evidence recording, the workflow engine with approval and verification, the first version of the marketplace and the interim-viva demonstration. Evaluation during this cycle revealed that rain events must cancel pending irrigation, that rejected readings needed to be visible to the user, and that the interface had to be translated completely rather than partially.

Cycle 3 (July to September 2026) completed the digital-twin interface, the trilingual dictionary, the export process with documents and payment, the evaluation page that computes the thesis metrics live, the automated test suite and the deployment packaging, and conducted the final measurement run and user evaluation reported in Chapter 6.

## 3.7 Research Design: Tools, Technologies, Data Preparation and Evaluation Plan

### 3.7.1 System design overview

The proposed application comprises six integrated architectural layers, illustrated in Figure 3.2. The IoT sensor layer captures environmental information at the field level. The network layer transports this information to backend services via HTTP or MQTT. The data layer stores, validates and manages measurements and related farm information. The AI-agent and decision layer interprets relevant information and determines recommendations or workflow actions. The web application layer presents dashboards, analytics, recommendations and business functions to end users in three languages. Finally, the global B2B e-commerce layer provides product presentation, buyer–supplier interaction, export process tracking and connectivity with external commerce and payment services. Figure 3.3 traces this architecture as a concrete end-to-end data flow, from field sensor to farmer-facing recommendation.

![Figure 3.2: Layered system architecture of the Smart Farming Web System, mapping each technology category to its architectural layer](fig_architecture.png)

![Figure 3.3: End-to-end data flow, from field sensors through validation, storage and AI-agent inference to the web dashboard, workflows and alerting](fig_dataflow.png)

### 3.7.2 Tools and technologies

Table 3.3 lists the tools and technologies selected for each layer and the reason for each selection; the detailed justification, including alternatives considered, is given in Section 5.2.

Table 3.3: Tools and technologies by architectural layer
| Layer | Technology | Reason for selection |
| IoT sensor layer | ESP32 microcontrollers; capacitive moisture, RS485 NPK, DS18B20, DHT22, pH and rain-gauge sensors; relay actuator | Low cost, Wi-Fi on board, wide sensor library support, suitable for smallholder budgets |
| Network layer | HTTP/JSON with per-device keys; MQTT topic convention with Mosquitto bridge | HTTP needs no broker and is universally deployable; MQTT available where queuing and offline buffering are needed |
| Data layer | Node.js validation pipeline; JSON document store with atomic writes; CSV export; upgrade path to PostgreSQL or MongoDB | Zero dependencies, transparent files for a prototype, simple backup and inspection |
| AI-agent and decision layer | Rule-based decision intelligence with crop policies; evidence recording; workflow state machine; keyword-based multilingual intent classifier | Explainable, auditable, adaptable by agronomists, no training data required |
| Web application layer | HTML5, CSS3, vanilla JavaScript; REST API; Server-Sent Events; trilingual dictionary; PWA manifest | No build step, fast on low-end devices, live updates, complete language coverage |
| B2B commerce layer | Product, inquiry, order and document models; role-based stage rules; payment-integration interface | Mirrors the export process described in the literature; external services attach through a defined interface |
| Development and deployment | Visual Studio Code, Git, Node test runner, headless Chrome, Docker | Reproducible builds and tests; containerised deployment |

### 3.7.3 Data preparation

Collected sensor data must be validated before being used for analytics or decision support, since raw field measurements are susceptible to noise, transmission errors and sensor drift. The preparation process implemented in the artefact and described in Section 5.4 therefore includes: normalising field names (for example, accepting soil_moisture, n, p, k or temperature as aliases) and units (Fahrenheit to Celsius, inches to millimetres); checking for missing values, with four parameters (soil moisture, air temperature, humidity and pH) designated as required; identifying abnormal or out-of-range readings against physically motivated limits; standardising timestamps to ISO 8601 UTC and rejecting future or stale timestamps; associating each measurement with its sensor node and zone; and computing a completeness score as the fraction of the nine parameters present. Readings that fail validation are recorded in an ingest log with per-field error codes, counted in the data-quality metric and surfaced to the user, rather than being silently discarded.

For AI-agent processing specifically, inputs are transformed into a consistent internal representation so that the decision layer can clearly distinguish current environmental conditions (the latest validated reading), historical observations (the last hour of readings, used for rainfall accumulation), crop context (the zone's crop policy) and node status (last contact time) from one another. This separation is important both for the correctness of generated recommendations and for the traceability requirements discussed in Section 2.5.3. B2B product and export information is similarly structured, including product category, quantity, quality grade, certifications, harvest date and destination market, to maintain consistency across the commerce workflow and to allow linkage back to the production zone that supports a given listing.

### 3.7.4 Evaluation plan

Evaluation is designed to assess both technical performance and user-oriented value, directly addressing the research questions defined in Section 1.4. Primary technical measures include successful sensor-data transmission, data completeness, workflow-execution success and the consistency of AI-agent decision outputs against predefined test scenarios. User-oriented measures include usability, perceived usefulness and ease of interaction, gathered through structured evaluation sessions with representative users. Table 3.4 summarises the evaluation areas, the metric used for each and the target threshold, and Figure 3.4 presents the targets graphically together with the general acceptability threshold of 80 %.

Table 3.4: Evaluation areas, metrics and targets
| Evaluation area | Metric | Target | Research question |
| Sensor integration | Percentage of expected readings successfully received | ≥ 95 % | RQ2 |
| Data quality | Rate of valid and complete measurements after preprocessing | ≥ 90 % | RQ2 |
| AI decision support | Agreement / quality score against predefined test scenarios | ≥ 85 % | RQ2, RQ3 |
| Workflow automation | Percentage of workflows completed successfully end-to-end | ≥ 90 % | RQ3 |
| Web usability | Task completion rate and System Usability Scale (SUS) score | ≥ 85 % | RQ4 |
| B2B functionality | Successful completion of representative product/buyer workflows | ≥ 88 % | RQ5 |

![Figure 3.4: Proposed evaluation targets by assessment area, with the general acceptability threshold of 80 % indicated by the dotted line](fig_targets.png)

These evaluation targets are assessed iteratively across successive DSRM cycles: where an early prototype iteration fell short of a target, for example in AI decision-support agreement during Cycle 2, the corresponding design element (decision rules, sensor validation or workflow logic) was revisited before the next demonstration and evaluation cycle, consistent with the iterative loop illustrated in Figure 3.1. A distinctive feature of the artefact is that it computes these metrics itself from its logs and exposes them on an evaluation page, so that the DSRM evaluation activity is supported directly by the system under evaluation.

## 3.8 Project Management Methodology

### 3.8.1 Selection and justification

Three project management methodologies were considered. PRINCE2 is a stage-gated, documentation-heavy method suited to large projects with formal governance; its overhead is disproportionate for a single-researcher software project. Kanban is a flow-based method that limits work in progress and suits continuous maintenance, but it lacks the time-boxed review points that a research project with fixed academic milestones requires. Scrum (Schwaber and Sutherland, 2020) organises work into fixed-length sprints, each ending with a review of a potentially shippable increment and a retrospective, and maintains a prioritised product backlog. Scrum was selected because its sprint reviews map directly onto the DSRM demonstration and evaluation activities, its backlog provides a transparent record of how requirements evolved, and its time-boxing aligned with the Faculty's milestone calendar. The researcher acted as product owner and development team, and the supervisor took the role of the primary stakeholder at sprint reviews.

The project was organised into fourteen two-week sprints within the three DSRM cycles. Each sprint began with backlog refinement against the research objectives, ended with a demonstration of the increment, and recorded impediments and decisions in a sprint log that later informed Chapter 7. Figure 3.5 shows the resulting timeline.

### 3.8.2 Project timeline

![Figure 3.5: Project implementation timeline (November 2025 to November 2026), aligned with the DSRM cycles and the Faculty milestones](fig_timeline.png)

Table 3.5: Project milestones and deliverables
| Milestone | Date | Deliverable |
| Draft proposal submission | 02 December 2025 | Preliminary background, problem, initial literature review, aim, objectives, tentative methodology |
| Proposal defence | 13–20 February 2026 | Oral defence; revised proposal with panel feedback |
| Final proposal submission | 22 February 2026 | Approved proposal with finalised problem, gap, objectives, questions and methodology |
| Interim 01 – Part A | 03 March 2026 | Chapter 1 |
| Chapter 2 submission | 10 April 2026 | Literature review |
| Interim 02 (progress review) | 30 April 2026 | Updated Chapters 1–2; Chapter 3 progress |
| Interim viva | 15–19 June 2026 | Mid-term presentation with Cycle 2 prototype |
| Thesis draft submission | 17 August 2026 | Complete draft |
| Final thesis submission | 30 August 2026 | Final document with corrections |
| Final viva voce | 21–25 September 2026 | Oral examination with Cycle 3 artefact |

## 3.9 Ethical Considerations and Limitations

### 3.9.1 Ethical considerations

Participation in user evaluation was voluntary and based on informed consent, with participants free to withdraw at any stage without consequence. Participants were briefed in their preferred language, and no personal information beyond role, preferred language and self-reported digital-experience level was recorded; SUS responses were stored anonymously against a random identifier. Sensor and farm information is treated as operational data belonging to the participating farm and is protected from unauthorised access through session-based authentication, role-based authorisation and per-device keys. Consistent with the discussion in Section 2.5.1 regarding traceability, AI-generated recommendations are explicitly presented to users as decision support rather than as an unconditional replacement for professional agricultural judgement, a disclaimer to this effect is displayed within the application, and users retain full discretion over whether to act on a given recommendation; autonomous mode is off by default and must be enabled deliberately. No external AI services were used, so no farm data left the system. Third-party fonts are the only external resources loaded by the interface, and the content-security policy prevents any other outbound connection.

### 3.9.2 Limitations of the study

The study is limited by the scale of the prototype, the number and type of available sensors, connectivity conditions in the field, sensor accuracy and the availability of representative agricultural data for testing and calibration. The instrumented measurement reported in Chapter 6 used the artefact's simulated node network, whose packet-loss and corruption rates were configured from values reported in the IoT literature, together with real HTTP ingest from a hardware node on the bench; long-duration field deployment across many farms was outside the scope of an academic year. AI-agent performance depends on the quality of the underlying data and the completeness of the decision rules encoded during development, so recommendation quality may vary across crop types or environmental conditions not represented in the three crop policies and fifteen scenarios. The B2B component was developed and evaluated at prototype level and does not represent the full complexity of international export operations, including legal and regulatory requirements, logistics coordination or commercial risk management. Finally, evaluation results are drawn from a limited user sample of twelve participants, appropriate to an academic research project but restricting the generalisability of usability findings to the wider population of prospective users.

## 3.10 Chapter Summary

This chapter has described the methodology of the research as a continuous story. A pragmatic paradigm and the Design Science Research strategy were adopted because the outcome of the research is a purposeful artefact whose value is its utility. The approach is abductive in design and deductive in evaluation. Facts were collected from literature, stakeholders, sensor data, system logs, an automated scenario suite, test suites and a structured user evaluation. The six DSRM activities were executed across three iterative cycles, managed with Scrum in fourteen sprints aligned to the Faculty's milestones. The six-layer system design, the selected technologies, the data-preparation process and an evaluation plan with six measurable targets were set out, and ethical considerations and limitations were addressed. Chapter 4 now specifies the requirements of the system in detail.
