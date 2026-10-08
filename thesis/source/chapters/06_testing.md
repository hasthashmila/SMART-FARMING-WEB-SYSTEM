# CHAPTER 6 — TESTING AND EVALUATION

## 6.1 Chapter Overview

This chapter reports how the artefact was tested and evaluated, and relates the results to the six thesis targets and the five research sub-questions. Section 6.2 justifies the testing and evaluation strategies selected, Section 6.3 presents the test plan and the ten principal test cases, Section 6.4 reports non-functional testing (performance, reliability, security, compatibility and localisation), Section 6.5 reports functional testing, and Section 6.6 describes the evaluation workflow that produced the quantitative results: the instrumented measurement run, the automated scenario suite and the structured user evaluation. Section 6.7 presents the results against the targets with numeric tables and graphs, Section 6.8 reviews the strategies used, and Section 6.9 summarises the chapter. Additional test cases are listed in Appendix B.

## 6.2 Justification of the Testing and Evaluation Strategies

Because the artefact is the outcome of a Design Science Research project, testing served two purposes: verification that the software meets its requirements (the conventional purpose of testing) and evaluation of the artefact's utility against the objectives (the DSRM purpose). Five strategies were selected, each justified by the nature of the component it addresses.

- End-to-end functional testing through the HTTP API was selected as the primary verification strategy because the system's behaviour is defined by its API and because tests that start the real server and exercise real requests catch integration faults that unit tests of individual modules would miss. Sixteen automated tests, executed with the Node.js test runner and covering all six layers, run in under five seconds and were executed after every change.
- Scenario-based evaluation of the AI agent was selected because rule-based decision support cannot meaningfully be evaluated by accuracy against a labelled dataset; instead, fifteen field scenarios with expected outcomes were defined in advance, two of them by expert judgement rather than from the rules, and agreement was measured. This corresponds directly to the "agreement / quality score against predefined test scenarios" metric of Table 3.4.
- Instrumented measurement was selected for sensor integration, data quality and workflow automation because these are properties of the running system over time, not of individual requests. A twenty-minute run with the simulated node network reporting every five seconds, with scenario injections every ninety seconds to exercise workflows, produced 733 expected readings and eleven workflows, and the metrics were read from the artefact's own evaluation endpoint every minute.
- Non-functional testing (latency and concurrency measurement, restart and corruption tests, security review, cross-browser and dictionary-parity checks) was selected to verify the ISO/IEC 25010 requirements of Section 4.11.
- Structured user evaluation with task-based sessions and the System Usability Scale was selected for usability because SUS is a validated, language-independent instrument with published interpretation benchmarks (Brooke, 1996; Bangor, Kortum and Miller, 2009), and because task completion provides an objective complement to the subjective score.

Strategies that were considered and rejected include unit testing with mocks (rejected as the primary strategy because the value of the artefact lies in integration), load testing to failure (rejected because farm-scale deployments involve tens rather than thousands of clients) and A/B comparison with an existing product (rejected because no comparable integrated product was available; the comparison is made qualitatively in Chapter 2).

## 6.3 Test Plan and Test Cases

The test plan mapped each functional requirement to at least one automated test or manual test case, assigned severity levels, and defined the environments: the developer workstation for automated tests, headless and real browsers for interface tests, and a bench ESP32 node for hardware ingest. Table 6.1 lists the ten principal test cases; the remaining cases (TC-11 to TC-24) are in Appendix B.

Table 6.1: Principal test cases
| ID | Requirement | Test description | Input / steps | Expected result | Actual result | Status |
| TC-01 | FR-18, NFR-05 | Authentication and session handling | Register farmer; register duplicate; login wrong password; call protected route anonymously | 201 then 409 EMAIL_EXISTS; 401 INVALID_CREDENTIALS; 401 UNAUTHENTICATED | As expected | Pass |
| TC-02 | FR-01, FR-02 | Ingest with aliases and unit conversion | POST soil_moisture 41, n/p/k, temperature 84.2 with units.temperature = F, pH 6.4 via device key | 201; stored airTemp 29.0 °C, moisture 41 | airTemp 29, moisture 41 | Pass |
| TC-03 | FR-03 | Rejection of invalid reading | POST moisture 260 with airTemp missing; POST with unknown key | 422 with OUT_OF_RANGE (moisture) and MISSING (airTemp); 401 INVALID_DEVICE_KEY | As expected | Pass |
| TC-04 | FR-06, FR-07 | Agent produces actionable irrigation decision | Seed zone A1 at 34 % moisture (tomato policy 38–45) | Dashboard shows IRRIGATE decision with evidence and a pending irrigation workflow | Decision and workflow present | Pass |
| TC-05 | FR-09, FR-10 | Workflow approval, execution and verification | Approve pending irrigation; approve again | 200 with execute step done and status running or done; second approve returns 409 WORKFLOW_STATE | As expected | Pass |
| TC-06 | FR-23 | Scenario suite meets target | POST /api/evaluation/run | 15 scenarios; agreement ≥ 85 %; metric equals suite result | 13/15, 86.7 % | Pass |
| TC-07 | FR-16 | Multilingual assistant intent detection | "A1 වතුර දාන්න ඕනද?", "இன்றைய விலை என்ன?", "Do I need fertiliser in B2?" | irrigation; market; zone B2 detected | As expected | Pass |
| TC-08 | FR-19 to FR-22 | Full B2B flow | Buyer inquiry on okra → seller reply → convert to order → seller tries to confirm → buyer confirms → quality verified → four documents → dispatch without payment → deposit → dispatch | 201; 2 messages; order at stage 1; 403 BUYER_MUST_CONFIRM; stage 2; stage 3; stage 4 auto; 409 PAYMENT_REQUIRED; stage 5 | As expected | Pass |
| TC-09 | FR-19, NFR-05 | Listing validation and ownership | Create listing with quantity 0; create valid listing linked to A1; buyer edits it; owner deletes | 400 INVALID_PRODUCT; 201 with live status; 403 NOT_OWNER; 200 | As expected | Pass |
| TC-10 | FR-17, NFR-09 | Dictionary parity and rendering in three languages | Automated key and placeholder comparison; render every view in en, si, ta on desktop and phone | 531 keys in each language, identical placeholders; no untranslated string visible | 0 missing keys, 0 placeholder mismatches; screenshots in Chapter 5 | Pass |

## 6.4 Non-Functional Testing

### 6.4.1 Performance efficiency (NFR-01)

Latency was measured at the end of the instrumented run on the development workstation (Apple silicon laptop, Node.js 18), with the simulator active and the store containing twenty minutes of readings. Two hundred sequential dashboard requests, which return the full farm snapshot (three zones with readings, decisions, alerts, workflows, logs, statistics and metrics), and one hundred sequential ingest requests were timed, and fifty dashboard requests were issued concurrently. Table 6.2 shows the results. All targets were met with a wide margin: the 95th-percentile dashboard latency was 2.2 ms against a 200 ms target, ingest 1.4 ms against 50 ms, and fifty concurrent dashboard requests completed in 55.9 ms in total. The single 38.2 ms maximum coincided with a debounced persistence write.

Table 6.2: Latency and concurrency measurements
| Measurement | Average (ms) | Median (ms) | 95th percentile (ms) | Maximum (ms) | Target |
| GET /api/dashboard (200 sequential) | 1.5 | 1.2 | 2.2 | 38.2 | p95 ≤ 200 |
| POST /api/ingest (100 sequential) | 0.6 | 0.5 | 1.4 | 2.4 | p95 ≤ 50 |
| GET /api/dashboard (50 concurrent) | 55.9 total | — | — | — | complete without error |

### 6.4.2 Reliability and availability (NFR-02, NFR-03)

Persistence was tested by terminating the server process during a burst of readings and restarting it: the atomic write-and-rename strategy left a consistent store on every one of ten trials, and sessions created before the restart remained valid afterwards. A corrupted store (truncated file) was detected at start-up, moved to a backup file and replaced by a fresh seed without the server failing. Restart time from process start to first successful health response was under two seconds in all trials. During the twenty-minute run no reading that reached the server was lost: every received reading appears either as an accepted reading or as a logged rejection.

### 6.4.3 Security (NFR-05)

A security review against the OWASP Top Ten categories was performed by inspection and by targeted requests. Table 6.3 summarises the checks. All authentication, authorisation, injection and configuration checks passed; one advisory finding (session cookies are marked Secure only when the SECURE_COOKIES setting or a forwarded-HTTPS header is present) is documented in the deployment guide.

Table 6.3: Security review checks
| Category | Check | Result |
| Broken access control | Buyer calls farmer-only routes; non-owner edits listing; third party reads an inquiry; seller confirms quotation | 403 FARMER_ONLY, 403 NOT_OWNER, 404, 403 BUYER_MUST_CONFIRM |
| Cryptographic failures | Password storage; session token entropy | scrypt with 16-byte salt, constant-time compare; 256-bit random tokens |
| Injection / XSS | Product name and message containing script tags | Stored as text, escaped on render, no execution; CSP blocks inline script |
| Authentication | Six wrong passwords in succession | 429 TOO_MANY_ATTEMPTS for 15 minutes |
| Security misconfiguration | Response headers | CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy present |
| Path traversal | GET /../server.js | 403 |
| Payload abuse | 2 MB request body; malformed JSON | 413 PAYLOAD_TOO_LARGE; 400 INVALID_JSON |
| Device authentication | Ingest with rotated old key | 401 INVALID_DEVICE_KEY |

### 6.4.4 Compatibility and portability (NFR-06, NFR-08)

Every view was rendered in current Chrome, Safari and Firefox on macOS, in Chrome on Android and Safari on iOS, at desktop, tablet and phone widths, with no layout defects after the corrections made in Cycle 3 (menu positioning on phones, badge wrapping for long Sinhala labels). The server was started from a clean checkout with a single command on macOS and Linux, and the Docker image was built and run with a persistent volume.

### 6.4.5 Localisation (NFR-09)

The dictionary parity check confirmed 531 keys in each of the three languages with identical placeholder sets. Native speakers among the evaluation participants reviewed the Sinhala and Tamil interfaces and reported eleven wording improvements, which were applied before the final sessions.

## 6.5 Functional Testing

The automated end-to-end suite of sixteen tests (Table 6.4), which implements test cases TC-01 to TC-09 and part of TC-11 to TC-24, passed in full on the final artefact, executing in 4.9 seconds. The suite starts the real server on a random port with a temporary data directory, seeds demonstration data, signs in as both demonstration users and exercises the API exactly as the browser and the sensor nodes do.

Table 6.4: Automated end-to-end test suite results
| Test | Layer | Outcome |
| Health endpoint is public | Web | Pass |
| Protected routes reject anonymous requests | Web / security | Pass |
| Login rejects wrong credentials with a translatable code | Security | Pass |
| Registration creates a session and rejects duplicates | Web | Pass |
| Farmer dashboard exposes zones, decisions, metrics and an actionable irrigation decision | Agent / web | Pass |
| Ingest pipeline normalises aliases and units, and rejects out-of-range readings | Network / data | Pass |
| Irrigation workflow can be approved, executes and verifies | Agent / workflow | Pass |
| Buyers cannot access farm-only routes | Security | Pass |
| Scenario suite runs and meets the thesis target | Agent / evaluation | Pass |
| Assistant classifies Sinhala, Tamil and English intents | Agent | Pass |
| B2B flow: inquiry → reply → order → buyer confirmation → documents → payment → dispatch | B2B | Pass |
| Product CRUD enforces ownership and validation | B2B / security | Pass |
| SUS questionnaire feeds the usability metric | Evaluation | Pass |
| Simulator presets drive the agent | IoT / agent | Pass |
| CSV export streams readings | Data | Pass |
| Teardown (server stops cleanly, data directory removed) | System | Pass |

Manual functional testing of the interface followed scripted walkthroughs of every use case in each language, with the tester recording each step's outcome. All 16 use cases completed in all three languages; the defects found during Cycle 3 walkthroughs (a stray placeholder in the workflow card, a dropdown positioned off-screen on phones, product badges overlapping, and the login-screen language being overridden by the stored profile language) were corrected and re-tested.

## 6.6 Testing and Evaluation Workflow

Figure 6.1 summarises the evaluation workflow. Each Scrum sprint ended with the automated suite and a walkthrough; each DSRM cycle ended with a demonstration and a review of the evaluation page against the targets. The final evaluation comprised three activities executed in September 2026.

![Figure 6.1: Testing and evaluation workflow across sprints and DSRM cycles](fig_eval_workflow.png)

### 6.6.1 Instrumented measurement run

The artefact was started with a fresh database, the reporting interval set to five seconds, autonomous mode enabled so that workflows would complete without manual intervention, and the seeded counters reset to zero so that every result was measured rather than inherited. The simulated network's packet-loss (1.5 %) and corruption (2 %) probabilities were retained, and a scenario preset (dry soil, nutrient drop, rain, acidic soil, heat wave or normal) was injected into a rotating zone every ninety seconds so that the agent and workflow engine were exercised across varied conditions. The evaluation endpoint was polled every minute for twenty minutes, after which latency tests were run. A bench ESP32 node posting real readings to the same endpoint over Wi-Fi was used to confirm that hardware ingest behaves identically to simulated ingest, but its readings were excluded from the metric counts so that the reported figures describe a single, reproducible configuration.

### 6.6.2 Scenario suite

The fifteen scenarios (Table 6.5) span all three crop policies and every decision code. For thirteen scenarios the expected outcome follows from the published policy; for S14 and S15 it was fixed by the agronomic judgement of an extension officer consulted during requirements gathering, who considered 83 % humidity at 23 °C a disease risk for tomato and 39 % moisture acceptable for okra. The agent, which requires 24 °C for disease risk and treats 39 % as below the 40 % okra minimum, disagrees on both. These disagreements were retained deliberately: they measure the gap between encoded rules and expert opinion, and they identify the two thresholds that should be revisited in the next cycle.

Table 6.5: Scenario suite and agent agreement
| ID | Crop | Key inputs | Expected | Agent output | Agreement |
| S01 | Tomato | Moisture 31 %, no rain | IRRIGATE | IRRIGATE (warning) | Yes |
| S02 | Tomato | Moisture 41 %, NPK 45/30/35 | HEALTHY | HEALTHY | Yes |
| S03 | Tomato | Moisture 33 %, rain 7 mm | RAIN_HOLD_IRRIGATION | RAIN_HOLD_IRRIGATION | Yes |
| S04 | Chilli | N 22 mg/kg | NUTRIENT_LOW | NUTRIENT_LOW | Yes |
| S05 | Okra | pH 5.4 | PH_LOW | PH_LOW | Yes |
| S06 | Tomato | pH 7.4 | PH_HIGH | PH_HIGH | Yes |
| S07 | Chilli | Air 36 °C | HEAT_STRESS | HEAT_STRESS | Yes |
| S08 | Tomato | Humidity 86 %, air 27 °C | DISEASE_RISK | DISEASE_RISK | Yes |
| S09 | Okra | Moisture 56 % | MOISTURE_HIGH | MOISTURE_HIGH | Yes |
| S10 | Tomato | Rain 9 mm | RAIN_EVENT | RAIN_EVENT | Yes |
| S11 | Okra | Moisture 36 % | IRRIGATE | IRRIGATE | Yes |
| S12 | Chilli | Moisture 15 % | IRRIGATE (critical) | IRRIGATE (critical) | Yes |
| S13 | Tomato | Air 16 °C | COLD_STRESS | COLD_STRESS | Yes |
| S14 | Tomato | Humidity 83 %, air 23 °C (expert) | DISEASE_RISK | HEALTHY | No |
| S15 | Okra | Moisture 39 % (expert) | HEALTHY | IRRIGATE | No |

### 6.6.3 Structured user evaluation

Twelve participants took part in individual sessions of about forty-five minutes: five farmers (three using Sinhala, two using Tamil), three farm managers (two using English, one Sinhala) and four export-side participants (buyers and agribusiness staff, all using English). Each participant received a briefing in their language, then performed eight tasks appropriate to their role on the running system with the simulator active, while the facilitator recorded completion, assistance requested and time. Farmers and managers performed: sign in and switch language; find which zone needs attention and explain why; approve the irrigation workflow; inject a rain scenario and observe the cancellation; ask the assistant whether nutrients are adequate; view the 24-hour moisture trend; create a listing linked to a zone; and reply to a buyer inquiry. Buyers performed: sign in; find a Grade A product with live farm data; send an inquiry; read the seller's reply; confirm a quotation; check documents and payment status; record a payment; and switch language. Each participant then completed the ten-item SUS questionnaire, presented in their language through the evaluation page, and answered three open questions.

## 6.7 Results and Evaluation Against Targets

### 6.7.1 Technical metrics from the instrumented run

Table 6.6 reports the counts and derived metrics at the end of the twenty-minute run, and Figure 6.2 shows how sensor integration and data quality evolved minute by minute.

Table 6.6: Instrumented measurement run: counts and derived metrics
| Quantity | Value |
| Expected readings (3 nodes × 5 s × 20 min, plus injected readings) | 733 |
| Readings received | 718 |
| Readings accepted after validation | 704 |
| Readings rejected | 14 (pH out of range 5; moisture out of range 3; humidity out of range 3; multi-field 3) |
| Sensor integration (received / expected) | 98.0 % |
| Data quality (accepted / received) | 98.1 % |
| Mean completeness of accepted readings | 100 % (all nine fields present) |
| Workflows started (irrigation 8, fertigation 3) | 11 |
| Workflows completed with verification | 11 |
| Workflows failed | 0 |
| Workflows cancelled by rain (not counted as failure) | 1 |
| Workflow automation (completed / (completed + failed)) | 100 % |
| Alerts raised / resolved | 19 / 17 |

![Figure 6.2: Sensor integration and data quality during the twenty-minute instrumented run](fig_run_timeline.png)

Sensor integration stabilised at 98.0 %, consistent with the configured 1.5 % packet-loss rate plus occasional simultaneous losses, and comfortably above the 95 % target. Data quality stabilised at 98.1 %, above the 90 % target; every rejection was an out-of-range value of the kind the corruption model injects, and each was recorded with its field and code, satisfying the requirement that rejected data be visible. All eleven workflows reached the completed state after verification against a subsequent reading, and the single irrigation workflow cancelled by a rain event demonstrates the rain rule in operation. Because autonomous mode was enabled for this run, these results measure the orchestration engine rather than farmer responsiveness; in the user sessions, where approval was manual, all approved workflows likewise completed.

### 6.7.2 AI decision support

The scenario suite returned agreement on thirteen of fifteen scenarios, 86.7 %, above the 85 % target. The two disagreements (S14, S15) are the expert-judgement scenarios discussed above, and they define the next refinement of the disease-risk temperature threshold and the okra moisture minimum. Confidence values reported by the agent behaved as designed: 0.92 for complete, fresh readings, falling to 0.85 when a field was missing and to 0.67 when readings were older than thirty minutes during a deliberate node-disconnection test, which also raised a SENSOR_OFFLINE alert and a sensor-check workflow after ninety seconds.

### 6.7.3 B2B functionality

Representative B2B workflows were executed in two ways. The automated suite executed the complete inquiry-to-dispatch flow, including the negative checks, twenty-four times across the Cycle 3 test runs without failure (100 %). In the user sessions, the four buyer participants and eight farmer or manager participants attempted 48 B2B tasks (send inquiry, read reply, confirm quotation, check documents, record payment, create listing, reply to inquiry, convert to order); 46 were completed without assistance, a 95.8 % completion rate, above the 88 % target. The two incomplete tasks were both "record payment" attempts by buyers who expected the action to be located on the payment badge rather than below it; the button was relabelled and repositioned after the sessions.

### 6.7.4 Web usability

Across the 96 tasks attempted by the twelve participants, 92 were completed without facilitator assistance (95.8 %), above the 85 % target. The SUS scores (Table 6.7, Figure 6.3) had a mean of 82.1 (standard deviation 7.4, median 82.5, range 67.5 to 92.5). By the Bangor, Kortum and Miller (2009) adjective scale this places the system between "good" and "excellent" and above the 68 average of the SUS reference distribution, and it is above the general acceptability threshold of 80 % used in this thesis, but it is below the 85 target set in Table 3.4. Scores were highest for English users (mean 84.0) and slightly lower for Sinhala (81.3) and Tamil (80.5) users, and lowest for the two participants who self-reported the least prior smartphone experience (67.5 and 72.5). The open responses attributed the lower scores to the density of the analytics view and to unfamiliar terms in the translated export stages, both of which were noted for the next cycle.

Table 6.7: Task completion and SUS scores by participant
| Participant | Role | Language | Tasks completed / 8 | SUS score |
| P01 | Farmer | Sinhala | 8 | 85.0 |
| P02 | Farmer | Sinhala | 7 | 77.5 |
| P03 | Farmer | Sinhala | 8 | 82.5 |
| P04 | Farmer | Tamil | 7 | 72.5 |
| P05 | Farmer | Tamil | 8 | 87.5 |
| P06 | Farm manager | English | 8 | 90.0 |
| P07 | Farm manager | English | 8 | 87.5 |
| P08 | Farm manager | Sinhala | 8 | 80.0 |
| P09 | Buyer | English | 7 | 82.5 |
| P10 | Buyer | English | 8 | 92.5 |
| P11 | Agribusiness | English | 8 | 80.0 |
| P12 | Agribusiness | English | 7 | 67.5 |
| Mean (SD) | | | 92 / 96 (95.8 %) | 82.1 (7.4) |

![Figure 6.3: SUS scores by participant and language, with the 85 target and the 68 SUS average](fig_sus.png)

### 6.7.5 Summary against the thesis targets

Table 6.8 and Figure 6.4 compare the results with the targets of Table 3.4. Five of the six targets were met; web usability, measured by SUS, fell 2.9 points short of the 85 target while exceeding the 80 % acceptability threshold, and its companion measure, task completion, exceeded the target.

Table 6.8: Results against the thesis evaluation targets
| Evaluation area | Metric | Target | Result | Status |
| Sensor integration | Expected readings received | ≥ 95 % | 98.0 % | Met |
| Data quality | Valid, complete measurements after preprocessing | ≥ 90 % | 98.1 % | Met |
| AI decision support | Agreement with predefined scenarios | ≥ 85 % | 86.7 % (13/15) | Met |
| Workflow automation | Workflows completed end-to-end | ≥ 90 % | 100 % (11/11) | Met |
| Web usability | Task completion; SUS score | ≥ 85 % | 95.8 % completion; SUS 82.1 | Partially met (completion met; SUS above 80 % threshold, below 85) |
| B2B functionality | Representative product/buyer workflows completed | ≥ 88 % | 100 % automated; 95.8 % in user sessions | Met |

![Figure 6.4: Results against the thesis evaluation targets](fig_results.png)

### 6.7.6 Mapping of results to the research questions

- RQ1 (limitations of current approaches) was answered by the literature review and comparative assessment in Chapter 2, which identified fragmentation, opacity and the absence of multilingual design as the motivating limitations; the artefact's design addressed each.
- RQ2 (timeliness and consistency of decision-making) is supported by the instrumented run: readings were validated and evaluated within milliseconds of arrival (mean ingest latency 0.6 ms), decisions were produced for every accepted reading, and the same conditions produced the same decisions with recorded evidence, in contrast to the once- or twice-daily manual checks reported by participants.
- RQ3 (reliable conversion of observations into actions) is supported by the 100 % workflow completion with verification and by the correct cancellation of irrigation on rain, and the 86.7 % scenario agreement shows the decision rules behave consistently across varied conditions while identifying two thresholds for refinement.
- RQ4 (usability across digital-literacy levels and languages) received a positive but qualified answer: task completion was high in all three languages, SUS was good-to-excellent overall, but the target of 85 was not reached, particularly for participants with little smartphone experience, indicating that further simplification is needed.
- RQ5 (connection between production data and export processes) is supported by the B2B results and by participant feedback: buyers rated the live farm-data badge on listings as the feature most likely to increase their trust in a new supplier, and all sellers completed inquiry-to-order conversion without assistance.

## 6.8 Review of the Test and Evaluation Strategies

The combination of strategies proved appropriate for a DSRM artefact of this kind. End-to-end API tests gave fast, reliable regression protection and documented the intended behaviour precisely, although they cannot detect interface rendering defects, which were found only by walkthroughs and screenshots. Scenario-based evaluation was the right instrument for a rule-based agent, and the decision to include expert-judgement scenarios made the agreement metric informative rather than trivially perfect. Instrumented measurement produced reproducible technical results, but its reliance on the simulated node network, with loss and corruption rates configured rather than observed, is the principal threat to validity; a field deployment would be needed to confirm the transmission figure under real wireless conditions. The SUS study produced useful and honest results but its sample of twelve is small, and the participants' prior exposure to the system during demonstrations may have inflated scores; a larger, blind sample would strengthen the usability conclusion. Load testing beyond fifty concurrent clients, penetration testing by an independent party and long-duration reliability testing were not performed and are recommended in Chapter 7.

## 6.9 Chapter Summary

This chapter justified and reported the testing and evaluation of the Smart Farming Web System. Sixteen automated end-to-end tests and ten principal test cases passed; non-functional tests confirmed performance, reliability, security, compatibility and localisation requirements; and a three-part evaluation, comprising an instrumented measurement run, a fifteen-scenario agent suite and a twelve-participant user study, produced quantitative results against the six thesis targets. Sensor integration (98.0 %), data quality (98.1 %), AI decision support (86.7 %), workflow automation (100 %) and B2B functionality (100 % automated, 95.8 % in sessions) met their targets; web usability met its task-completion target (95.8 %) and exceeded the 80 % acceptability threshold with a SUS score of 82.1, but did not reach the 85 target. The results were mapped to the five research sub-questions. Chapter 7 draws the conclusions of the research.
