# CHAPTER 7 — CONCLUDING REMARKS

## 7.1 Chapter Overview

This final chapter assesses the accomplishment of the research objectives using a triangulation of the evidence from Chapters 2 to 6 (Section 7.2), describes the problems encountered during the research and how they were resolved (Section 7.3), offers a self-reflection on the ideology of the research, the benefits gained and the learning curves experienced (Section 7.4), discusses the business insight and real-world application possibilities of the concept (Section 7.5), and sets out recommendations for future work (Section 7.6). Section 7.7 gives the closing summary of the thesis.

## 7.2 Accomplishment of the Research Objectives

The evaluation followed a triangulation strategy: each objective is assessed against at least two independent sources of evidence, drawn from the literature, the artefact and its documentation, the automated tests, the instrumented measurement, the scenario suite and the user study.

**Objective 1, to identify limitations, design principles and gaps (Section 1.7.1).** The literature review in Chapter 2 analysed four thematic strands and seven existing systems and identified fragmentation across sensing, decision and commerce, the opacity of decision logic, the rarity of verified actuation and the neglect of language and digital literacy as the limitations of current approaches. The design principles derived (layered architecture with narrow interfaces, validation as a first-class component, rule-based explainability, bounded autonomy with verification, and complete localisation) were adopted in the artefact, and the comparative table (Table 2.1) documents the gap. This objective was fully accomplished, and its findings answer RQ1.

**Objective 2, to analyse requirements and map them to an architecture (Section 1.7.2).** Chapter 4 identified nine stakeholder groups, operationalised facts from discussions, documents, literature and demonstrations into twenty-five functional and ten non-functional requirements, modelled the system with UML, and mapped the requirements onto the six-layer architecture with defined interfaces. Every requirement traces to a source and to a test, which the automated suite and the test cases in Chapter 6 confirm. This objective was fully accomplished.

**Objective 3, to design and develop the artefact (Section 1.7.3).** The six components specified in the objective were delivered and documented in Chapter 5: the ingest and data-preparation pipeline (a), the explainable rule-based agent with evidence recording (b), the workflow engine with approval, execution, verification and autonomous mode (c), the live digital-twin dashboard with analytics (d), the B2B module with listings linked to field data, inquiry threads, quotation-to-order conversion, seven-stage export tracking, documents and a payment interface (e), and the complete English, Sinhala and Tamil interface with 531 dictionary keys per language (f). Evidence of execution is provided by the screenshots, the sixteen passing end-to-end tests and the working artefact submitted with the thesis. This objective was fully accomplished.

**Objective 4, to evaluate the system against the targets (Section 1.7.4).** Chapter 6 evaluated all six areas. Five targets were met: sensor integration 98.0 % (target 95), data quality 98.1 % (target 90), AI decision support 86.7 % (target 85), workflow automation 100 % (target 90) and B2B functionality 100 % automated and 95.8 % in user sessions (target 88). Web usability met its task-completion component (95.8 %, target 85) and exceeded the 80 % acceptability threshold with a SUS score of 82.1, but did not reach the 85 SUS target. The results were mapped to RQ2 to RQ5. This objective was accomplished, with the usability shortfall honestly recorded and its causes identified. The principal research question, how the five capabilities can be integrated so that decision timeliness, consistency, traceability and market connection are improved, is answered by the artefact and its evaluation: a layered architecture with a validated data pipeline, an explainable agent, verified workflows, a live twin and a commerce layer that consumes field status, delivered in the users' languages, achieves the integration, and the measured results demonstrate the improvement within the limits of a prototype evaluation.

## 7.3 Problems Encountered

Several problems were encountered and resolved during the research.

- **Hardware availability and sensor reliability.** Delivery delays for the NPK sensor and inconsistent pH readings from the analogue probe threatened the Cycle 2 demonstration. The response was to build the simulated node network that feeds the identical pipeline, which not only rescued the demonstration but became a permanent feature that supports evaluation, training and scenario injection. The experience also motivated the range-based validation and the visibility of rejected readings.
- **Rain and irrigation interaction.** In Cycle 2 the agent recommended irrigation during a rain event, which participants immediately identified as wrong. The hour-long rainfall accumulation, the rain-hold rule and the automatic cancellation of pending irrigation were added in response, and the scenario suite gained S03 and S10 to guard against regression.
- **Partial translation.** The first translated interface left server-generated strings (recommendations, errors and log lines) in English, which Sinhala- and Tamil-speaking participants found confusing. The solution was architectural: the server was changed to emit language-neutral codes and parameters, and all rendering moved to the client dictionary. This delayed Cycle 3 by roughly one sprint but produced the complete localisation that the evaluation confirmed.
- **Layout of Sinhala and Tamil text.** Labels that fitted in English overflowed badges, navigation items and workflow cards in Sinhala and Tamil, and relative-time formatting for these locales was inconsistent across browsers. Script-specific typography rules and dictionary-based relative times resolved these issues.
- **Measuring rather than assuming evaluation results.** Early evaluation pages inherited seeded counters, which would have made the results meaningless. The measurement protocol was revised to reset counters, use a fresh database and poll the metrics over time, and the scenario suite was deliberately given expert-judgement cases so that agreement could fall below 100 %.
- **Time pressure between the interim viva and the thesis draft.** The overlap of Cycle 3 development, evaluation and writing in July and August 2026 was managed by strict sprint scoping, by writing chapters as components were completed, and by automating tests and screenshot capture so that documentation stayed synchronised with the artefact.

## 7.4 Self-Reflection

### 7.4.1 Ideology of the research

The research was founded on the conviction that the value of agricultural technology is realised only when it reaches the people who grow the food, in their language and within their means. This shaped every major decision: the zero-dependency backend so that the system can run on a cheap host; the rule-based agent so that advice can be inspected and questioned; the approval step and the disclaimer so that the farmer remains the decision-maker; and the complete trilingual interface. The Design Science Research framework suited this ideology because it insists that an artefact be judged by its utility to its users rather than by its novelty alone.

### 7.4.2 Benefits gained

The researcher gained the ability to carry a software system from problem identification through architecture, implementation, testing and evaluation to documentation, and to defend each decision with evidence. Specific technical competences developed include IoT protocol design and firmware integration, data-validation engineering, the design of explainable decision logic, state-machine-based workflow orchestration, real-time web architecture with Server-Sent Events, security hardening of a web application, internationalisation for complex scripts, and quantitative evaluation using logs, scenario suites and the SUS instrument. Equally valuable were the research competences: critical reading of literature, the discipline of the DSRM and Scrum cycles, and the habit of measuring rather than assuming.

### 7.4.3 Learning curves

The steepest learning curves were in three areas. The first was the transition from writing features to designing interfaces between layers; early code coupled the agent to the dashboard, and separating them into narrow interfaces took two refactorings. The second was internationalisation, where the researcher underestimated how deeply language affects layout, formatting and even the shape of server responses. The third was evaluation design: it took the interim viva feedback to appreciate that a rule engine tested only against its own rules proves nothing, and that user evaluation must be structured, task-based and honest about its sample size. In each case the learning changed the artefact for the better.

## 7.5 Business Insight and Real-World Application

### 7.5.1 Business insight

The concept addresses a market with clear economics. On the production side, water and fertiliser are the largest variable costs for vegetable smallholders; even a modest reduction in unnecessary irrigation and fertigation events, which the agent's policy-driven scheduling makes possible, pays back a three-node installation (approximately LKR 60,000–80,000 in components at 2026 prices) within one or two growing seasons. On the market side, exporters and importers pay a premium for verifiable quality and reliable communication; the live farm-data badge and the traceable export file are precisely the evidence that GAP-oriented buyers seek, and they reduce the intermediary margins that participants described. A viable business model would combine a per-farm subscription for the monitoring and decision layers with a transaction fee or premium listing fee on the marketplace, with cooperatives or exporters as the natural channel partners because they aggregate smallholders and already handle export documentation. Government extension services and the Export Development Board are potential institutional adopters, since the platform embodies the digital market linkage and traceability they promote.

### 7.5.2 Real-world application possibilities

The architecture is not specific to the three prototype crops or to Sri Lanka. Crop policies are data, so any crop with agronomic thresholds can be added; the ingest interface accepts any node that can post JSON, so existing sensor installations can be connected; and the dictionary mechanism can be extended to further languages. Immediate applications include vegetable and fruit smallholders supplying exporters, cooperatives operating shared irrigation, greenhouse growers, and agricultural training institutes that need a realistic teaching platform (the simulator and scenario presets serve this use directly). The evaluation instrumentation also makes the platform suitable as a research testbed for comparing decision policies.

## 7.6 Future Recommendations

The following recommendations arise from the limitations and findings of the research, in priority order.

1. **Field deployment and longitudinal evaluation.** Deploy the sensor nodes on two or three cooperating farms for a full growing season to measure transmission reliability under real wireless conditions, sensor drift, and agronomic outcomes (water use, input cost, yield) against control plots, replacing the simulated-network measurements with field data.
2. **Refinement of decision thresholds and policy editing.** Revisit the disease-risk temperature threshold and the okra moisture minimum identified by scenarios S14 and S15, add crop policies for additional crops with Department of Agriculture input, and provide an in-application policy editor with version history so that agronomists can adjust rules without code changes.
3. **Learning-based prediction as a complement to rules.** Once the platform has accumulated labelled data, add predictive models (for example, moisture forecasting from weather data and disease-risk classification) whose outputs feed the rule engine as additional evidence, retaining the explainable rule layer as the decision-maker.
4. **Usability improvements for low-experience users.** Simplify the analytics view, add a guided first-use tour in each language, review the translated export terminology with native-speaking export practitioners, and repeat the SUS study with a larger, blind sample to reach the 85 target.
5. **External integrations.** Implement the payment-gateway adapter and a logistics-booking interface behind the existing integration points, and add MQTT broker support natively to the server so that LoRa-connected nodes can be used without a bridge.
6. **Scalability and persistence.** Replace the JSON document store with PostgreSQL or a time-series database for multi-farm deployments, add multi-tenant farm accounts and role hierarchies, and perform load and independent penetration testing before public operation.
7. **Additional languages and accessibility.** Extend the dictionary to further languages of the region and conduct a formal accessibility audit against WCAG 2.1 AA, building on the keyboard navigation and labelling already present.

## 7.7 Closing Summary

This thesis set out to answer how IoT monitoring, explainable AI-agent decision support, workflow automation, a digital-twin representation and B2B export commerce could be integrated into a single web platform that improves the timeliness, consistency and traceability of smallholder farming decisions and their connection to export markets. Following the Design Science Research Methodology across three iterative cycles, the research produced AgriPulse, a six-layer, trilingual Smart Farming Web System, and evaluated it against six predefined targets using instrumented measurement, an automated scenario suite, functional and non-functional testing and a structured user study. Five targets were met and the sixth was partially met with an honest account of the shortfall. The principal contribution is a validated, integrated platform, together with transferable design knowledge on data validation, decision traceability, bounded autonomy and multilingual interface design for agriculture. The artefact, its source code and its documentation are submitted with this thesis so that the work can be reproduced, extended and, it is hoped, put to use in the fields from which the problem was drawn.

{{PAGEBREAK}}

# REFERENCES

Abbasi, R., Martinez, P. and Ahmad, R. (2022) 'The digitization of agricultural industry – a systematic literature review on agriculture 4.0', *Smart Agricultural Technology*, 2, 100042.

Abba Ari, A. A., Gueroui, A., Titouna, C., Thiare, O. and Aliouat, Z. (2022) 'Smart agriculture through Internet of Things and machine learning', in *Agriculture 4.0: Smart Farming Technologies*. Cham: Springer, pp. 1–28.

Adadi, A. and Berrada, M. (2018) 'Peeking inside the black-box: a survey on explainable artificial intelligence (XAI)', *IEEE Access*, 6, pp. 52138–52160.

Ayaz, M., Ammad-Uddin, M., Sharif, Z., Mansour, A. and Aggoune, E. M. (2019) 'Internet-of-Things (IoT)-based smart agriculture: toward making the fields talk', *IEEE Access*, 7, pp. 129551–129583.

Bangor, A., Kortum, P. and Miller, J. (2009) 'Determining what individual SUS scores mean: adding an adjective rating scale', *Journal of Usability Studies*, 4(3), pp. 114–123.

Brooke, J. (1996) 'SUS: a "quick and dirty" usability scale', in Jordan, P. W., Thomas, B., Weerdmeester, B. A. and McClelland, I. L. (eds) *Usability Evaluation in Industry*. London: Taylor & Francis, pp. 189–194.

Central Bank of Sri Lanka (2023) *Annual Economic Review 2022*. Colombo: Central Bank of Sri Lanka.

Department of Census and Statistics (2022) *Sri Lanka Labour Force Survey: Annual Report 2021*. Colombo: Department of Census and Statistics, Ministry of Finance.

Elijah, O., Rahman, T. A., Orikumhi, I., Leow, C. Y. and Hindia, M. N. (2018) 'An overview of Internet of Things (IoT) and data analytics in agriculture: benefits and challenges', *IEEE Internet of Things Journal*, 5(5), pp. 3758–3773.

FAO (2017) *The Future of Food and Agriculture: Trends and Challenges*. Rome: Food and Agriculture Organization of the United Nations.

Ferrag, M. A., Shu, L., Yang, X., Derhab, A. and Maglaras, L. (2020) 'Security and privacy for green IoT-based agriculture: review, blockchain solutions, and challenges', *IEEE Access*, 8, pp. 32031–32053.

Fielding, R. T. (2000) *Architectural Styles and the Design of Network-based Software Architectures*. PhD thesis. University of California, Irvine.

Grieves, M. and Vickers, J. (2017) 'Digital twin: mitigating unpredictable, undesirable emergent behavior in complex systems', in Kahlen, F. J., Flumerfelt, S. and Alves, A. (eds) *Transdisciplinary Perspectives on Complex Systems*. Cham: Springer, pp. 85–113.

Hevner, A. R., March, S. T., Park, J. and Ram, S. (2004) 'Design science in information systems research', *MIS Quarterly*, 28(1), pp. 75–105.

ISO/IEC (2011) *ISO/IEC 25010:2011 Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models*. Geneva: International Organization for Standardization.

Jayaraman, P. P., Yavari, A., Georgakopoulos, D., Morshed, A. and Zaslavsky, A. (2016) 'Internet of Things platform for smart farming: experiences and lessons learnt', *Sensors*, 16(11), 1884.

Kamienski, C., Soininen, J. P., Taumberger, M., Dantas, R., Toscano, A., Salmon Cinotti, T., Filev Maia, R. and Torre Neto, A. (2019) 'Smart water management platform: IoT-based precision irrigation for agriculture', *Sensors*, 19(2), 276.

Kamilaris, A., Kartakoullis, A. and Prenafeta-Boldú, F. X. (2017) 'A review on the practice of big data analysis in agriculture', *Computers and Electronics in Agriculture*, 143, pp. 23–37.

Khanna, A. and Kaur, S. (2019) 'Evolution of Internet of Things (IoT) and its significant impact in the field of precision agriculture', *Computers and Electronics in Agriculture*, 157, pp. 218–231.

Klerkx, L., Jakku, E. and Labarthe, P. (2019) 'A review of social science on digital agriculture, smart farming and agriculture 4.0: new contributions and a future research agenda', *NJAS – Wageningen Journal of Life Sciences*, 90–91, 100315.

Kour, V. P. and Arora, S. (2020) 'Recent developments of the Internet of Things in agriculture: a survey', *IEEE Access*, 8, pp. 129924–129957.

Lezoche, M., Hernandez, J. E., Alemany Díaz, M. d. M. E., Panetto, H. and Kacprzyk, J. (2020) 'Agri-food 4.0: a survey of the supply chains and technologies for the future agriculture', *Computers in Industry*, 117, 103187.

Liakos, K. G., Busato, P., Moshou, D., Pearson, S. and Bochtis, D. (2018) 'Machine learning in agriculture: a review', *Sensors*, 18(8), 2674.

Light, R. A. (2017) 'Mosquitto: server and client implementation of the MQTT protocol', *Journal of Open Source Software*, 2(13), 265.

Naik, N. (2017) 'Choice of effective messaging protocols for IoT systems: MQTT, CoAP, AMQP and HTTP', *2017 IEEE International Systems Engineering Symposium (ISSE)*, Vienna, pp. 1–7.

Nielsen, J. (1994) *Usability Engineering*. San Francisco: Morgan Kaufmann.

Peffers, K., Tuunanen, T., Rothenberger, M. A. and Chatterjee, S. (2007) 'A design science research methodology for information systems research', *Journal of Management Information Systems*, 24(3), pp. 45–77.

Pylianidis, C., Osinga, S. and Athanasiadis, I. N. (2021) 'Introducing digital twins to agriculture', *Computers and Electronics in Agriculture*, 184, 105942.

Rose, D. C. and Chilvers, J. (2018) 'Agriculture 4.0: broadening responsible innovation in an era of smart farming', *Frontiers in Sustainable Food Systems*, 2, 87.

Russell, S. and Norvig, P. (2021) *Artificial Intelligence: A Modern Approach*. 4th edn. Harlow: Pearson.

Saunders, M., Lewis, P. and Thornhill, A. (2019) *Research Methods for Business Students*. 8th edn. Harlow: Pearson.

Schwaber, K. and Sutherland, J. (2020) *The Scrum Guide: The Definitive Guide to Scrum*. Available at: https://scrumguides.org (Accessed: 12 March 2026).

Sinha, B. B. and Dhanalakshmi, R. (2022) 'Recent advancements and challenges of Internet of Things in smart agriculture: a survey', *Future Generation Computer Systems*, 126, pp. 169–184.

Sommerville, I. (2016) *Software Engineering*. 10th edn. Harlow: Pearson.

Sri Lanka Export Development Board (2023) *Export Performance Report 2022*. Colombo: Sri Lanka Export Development Board.

Tzounis, A., Katsoulas, N., Bartzanas, T. and Kittas, C. (2017) 'Internet of Things in agriculture, recent advances and future challenges', *Biosystems Engineering*, 164, pp. 31–48.

Verdouw, C., Tekinerdogan, B., Beulens, A. and Wolfert, S. (2021) 'Digital twins in smart farming', *Agricultural Systems*, 189, 103046.

Wolfert, S., Ge, L., Verdouw, C. and Bogaardt, M. J. (2017) 'Big data in smart farming – a review', *Agricultural Systems*, 153, pp. 69–80.

Wooldridge, M. and Jennings, N. R. (1995) 'Intelligent agents: theory and practice', *The Knowledge Engineering Review*, 10(2), pp. 115–152.

Zhang, M. and Berghäll, S. (2021) 'E-commerce in agri-food sector: a systematic literature review based on service-dominant logic', *Journal of Theoretical and Applied Electronic Commerce Research*, 16(7), pp. 3356–3374.

{{PAGEBREAK}}

# APPENDICES

## Appendix A — Additional Use-Case Specifications

Table A.1: Additional use-case specifications
| ID | Use case | Actor | Summary |
| UC-08 | Register / sign in | Farmer, Buyer | Create an account with name, role, company and language, or sign in with email and password; sessions persist for 30 days; demo accounts are provided for evaluation. |
| UC-09 | View digital twin and analytics | Farmer | Select a zone, view readings against policy ranges, node status and sparkline; chart any parameter over 6/24/72 h; view statistics, data-quality metrics and ingest log; export CSV. |
| UC-10 | Configure farm, zones and devices | Farm manager | Edit farm name, location and reporting interval; toggle simulation and autonomous mode; change zone crop and area; view, copy and rotate device keys; read ingest documentation. |
| UC-11 | Run evaluation / submit SUS | Farmer (run), all users (SUS) | Run the fifteen-scenario suite; view the six metrics against targets; complete the ten-item SUS questionnaire in the active language. |
| UC-12 | Raise / resolve alert | AI agent | Open an alert for each warning or critical decision, update it on recurrence, resolve it when the condition clears; users mark alerts read. |
| UC-13 | Open workflow | AI agent | Create a workflow from an actionable decision when none is open for that zone and type; auto-approve in autonomous mode. |
| UC-14 | Browse and search listings | Buyer, Farmer | Filter by category, search by text, view live farm status, grade, certifications and seller. |
| UC-15 | Confirm quotation / record payment | Buyer | Confirm the quotation stage of an order; record a deposit or full payment with reference. |
| UC-16 | Switch language | All users | Select English, Sinhala or Tamil at login, in the header or in settings; the choice is stored in the profile. |

## Appendix B — Additional Test Cases

Table B.1: Additional test cases
| ID | Requirement | Description | Expected | Status |
| TC-11 | FR-05 | Enable and disable simulation; change interval to 5 s | Readings arrive at the new interval; none when disabled | Pass |
| TC-12 | FR-05 | Inject each of the six scenario presets into a zone | Corresponding decision appears (IRRIGATE, RAIN_EVENT/HOLD, HEAT_STRESS, NUTRIENT_LOW, PH_LOW, HEALTHY) | Pass |
| TC-13 | FR-07 | Disconnect a node for 90 s | SENSOR_OFFLINE alert and sensor-check workflow; acknowledge closes it | Pass |
| TC-14 | FR-08 | Alerts raised, updated and resolved; mark all read | Unread count correct; resolved alerts leave the active list | Pass |
| TC-15 | FR-11 | Enable autonomous mode and inject dry soil | Workflow approved by "AI agent" and completed without user action | Pass |
| TC-16 | FR-12 | Inject rain while irrigation pending | Workflow cancelled with reason rain | Pass |
| TC-17 | FR-13 | Live update via SSE | Dashboard refreshes within one second of a new reading without reload | Pass |
| TC-18 | FR-15 | Chart each of nine parameters over 6, 24 and 72 h | Policy band shown where defined; statistics correct against CSV | Pass |
| TC-19 | FR-17 | Change language in profile settings | Whole interface and stored profile language change; persists after re-login | Pass |
| TC-20 | FR-18 | Change password; old sessions revoked | Other session receives 401; new password works | Pass |
| TC-21 | FR-20 | Close an inquiry; attempt to reply | Reply composer hidden; API returns inquiry closed state | Pass |
| TC-22 | FR-24 | Rotate device key; post with old key | 401 with old key; 201 with new key | Pass |
| TC-23 | NFR-02 | Kill server during ingest burst; restart | Store consistent; sessions preserved | Pass |
| TC-24 | NFR-06 | Render every view on Chrome, Safari, Firefox; phone and desktop | No layout defects; menus and dialogs usable | Pass |

## Appendix C — Ingest API Reference and Node Configuration

The ingest endpoint accepts a JSON body and a device key. Canonical field names are moisture, nitrogen, phosphorus, potassium, soilTemp, airTemp, humidity, ph and rainfall; aliases soil_moisture, n, p, k, soil_temp, temperature, air_temp, hum, rain and pH are accepted. Units default to °C, %, mm and mg/kg; a units object may declare temperature "F" or rainfall "in". A timestamp may be supplied as ts (ISO 8601 or epoch). Responses: 201 accepted with the reading id and the decision codes produced; 422 rejected with per-field error codes; 401 for an unknown key.

```
POST /api/ingest
Content-Type: application/json
X-Device-Key: ap_3f9c...
{"moisture":41.2,"nitrogen":42,"phosphorus":30,"potassium":36,"soilTemp":25.1,"airTemp":28.4,"humidity":70,"ph":6.4,"rainfall":0}

201 {"accepted":true,"id":"r-8c1e...","decisions":["HEALTHY"]}
422 {"accepted":false,"errors":[{"field":"moisture","code":"OUT_OF_RANGE","value":260},{"field":"airTemp","code":"MISSING"}]}
```

MQTT convention: nodes publish to agripulse/{farmId}/{zoneId}/readings and subscribe to agripulse/{farmId}/{zoneId}/actuator/{actuator}; a bridge forwards published readings to the HTTP endpoint with the node's key.

## Appendix D — System Usability Scale Questionnaire (English version)

Participants rated each statement from 1 (strongly disagree) to 5 (strongly agree). The Sinhala and Tamil versions are presented in the application.

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

Open questions: Which feature was most useful and why? Which part was hardest to understand? What would you change before using it on your own farm or in your business?

## Appendix E — Project Repository Structure

```
server.js              HTTP server, static files, security headers, start/stop
server/api.js          REST routes, sessions, roles, B2B rules
server/pipeline.js     ingest → validate → store → agent → alerts/workflows → SSE; metrics
server/validate.js     data-preparation rules (aliases, units, ranges, timestamps)
server/agent.js        crop policies, decision rules, scenario suite, intent classifier
server/workflows.js    workflow state machine and verification
server/simulator.js    ESP32 node simulator with scenario presets
server/seed.js, db.js  demonstration data; atomic JSON persistence
server/events.js       Server-Sent Events hub
public/index.html      application shell (trilingual)
public/app.js          views, router, rendering, assistant reply composer
public/i18n.js         531-key dictionary in English, Sinhala and Tamil
public/styles.css      responsive design system with script-specific typography
test/api.test.js       sixteen end-to-end tests (node:test)
Dockerfile, README.md  deployment and documentation
```
