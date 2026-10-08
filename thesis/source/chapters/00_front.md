{{TITLEPAGE}}

# DECLARATION

I hereby declare that this thesis, entitled "Smart Farming Web System: An Autonomous AI-Agent and IoT-Driven Web Platform for Precision Agriculture and Global B2B Export Optimization", is my own original work carried out under the supervision of Mr. Gayan Perera at the Faculty of Computing, NSBM Green University. It has not been submitted, in whole or in part, for any other degree or qualification at this or any other institution. All sources of information, ideas and data that are not my own have been acknowledged through appropriate referencing in accordance with the Harvard referencing convention adopted by the Faculty.

I further declare that the software artefact described in this thesis (AgriPulse, version 3.0) was designed and implemented by me as part of this research, and that the evaluation results reported in Chapter 6 were obtained from the artefact and the evaluation procedures described in Chapters 3 and 6.

{{SIGNATURE:H.A.S. Thashmila (Index No. 28971)}}

{{SIGNATURE:Mr. Gayan Perera (Supervisor)}}

{{PAGEBREAK}}

# ABSTRACT

Modern agriculture is increasingly shaped by digital technologies, yet a large proportion of smallholder and medium-scale farming operations in Sri Lanka and comparable economies continue to rely on memory-based practices for environmental monitoring, operational decision-making, resource allocation and market access. Manual observation and fragmented record-keeping limit the timeliness and consistency of agricultural decisions and constrain the ability of producers to connect farm-level activity with international market opportunities. This research designed, developed and evaluated the Smart Farming Web System (AgriPulse): an integrated, trilingual (English, Sinhala and Tamil) web platform that unifies Internet of Things (IoT) environmental monitoring, AI-agent-driven decision support, workflow orchestration, a digital-twin representation of the farm and Business-to-Business (B2B) export commerce within a single six-layer architecture.

The system acquires nine field parameters (soil moisture, soil nitrogen, phosphorus and potassium, soil and ambient temperature, relative humidity, soil pH and rainfall) from ESP32-class sensor nodes over an HTTP/MQTT communication layer, validates and standardises them in a data-preparation pipeline, and passes them to a rule-based decision-intelligence agent that produces explainable recommendations, alerts and traceable workflows for irrigation, fertigation and sensor maintenance. A digital-twin dashboard exposes current conditions, historical trends and recommendations, while the B2B module links product listings to live field data and supports buyer–supplier inquiry threads, quotation-to-order conversion, a seven-stage export process and a payment-integration interface.

The study followed the Design Science Research Methodology (DSRM) of Peffers et al. (2007), executed iteratively within a Scrum-based project management framework across three build-and-evaluate cycles between November 2025 and September 2026. Evaluation combined technical measurement from system logs, an automated scenario suite, functional and non-functional testing, and a structured user evaluation with the System Usability Scale (SUS). In a twenty-minute instrumented run the artefact achieved 98.0 % sensor-data transmission, 98.1 % data quality after preprocessing, 86.7 % agreement with predefined decision scenarios and 100 % end-to-end workflow completion; representative B2B workflows completed at 100 % in automated execution and 95.8 % in task-based user sessions, and the interface obtained a mean SUS score of 82.1 across twelve participants. All six thesis targets, except the usability target, were met, and the usability score exceeds the general acceptability threshold of 80 %.

The principal contribution is a validated, integrated smart-farming platform that connects field-level data acquisition, explainable decision support and agricultural commerce within a single system, addressing a gap in the literature where these three domains have historically been treated in isolation. Secondary contributions include a reusable data-validation and decision-traceability design, a trilingual interface pattern for low-digital-literacy user groups, and an evaluation framework that maps live system metrics to DSRM evaluation targets.

**Keywords:** Smart Farming, Internet of Things, AI Agents, Decision Support Systems, Digital Twin, B2B E-Commerce, Design Science Research Methodology, Precision Agriculture, Explainable AI, Multilingual Interfaces.

{{PAGEBREAK}}

# ACKNOWLEDGEMENTS

I would like to express my sincere gratitude to my supervisor, Mr. Gayan Perera, for his patient guidance, critical feedback and encouragement throughout every stage of this research, from the initial proposal to the final artefact and thesis. His insistence on treating the project as a story told from beginning to end shaped both the methodology and the structure of this document.

I am grateful to the academic staff of the Faculty of Computing at NSBM Green University, and in particular to the module coordinators and evaluation panels whose comments at the proposal defence and interim viva refined the research problem, the objectives and the evaluation plan. I also thank Ms. Dulanjali Wijesekara for the detailed thesis chapter guidelines that informed the organisation of this work.

My thanks go to the farmers, farm managers and agribusiness participants who gave their time to the demonstration and evaluation sessions, and whose candid feedback on the Sinhala and Tamil interfaces materially improved the usability of the system. Finally, I thank my family and friends for their support, understanding and patience during the year in which this research was completed.

{{PAGEBREAK}}

{{TOC}}

{{PAGEBREAK}}

{{LOF}}

{{PAGEBREAK}}

{{LOT}}

{{PAGEBREAK}}

# LIST OF ABBREVIATIONS

| Abbreviation | Meaning |
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| B2B | Business-to-Business |
| CRUD | Create, Read, Update, Delete |
| CSV | Comma-Separated Values |
| DSR | Design Science Research |
| DSRM | Design Science Research Methodology |
| DSS | Decision Support System |
| ESP32 | Espressif 32-bit IoT microcontroller platform |
| FAO | Food and Agriculture Organization of the United Nations |
| GAP | Good Agricultural Practices |
| HTTP | Hypertext Transfer Protocol |
| HTTPS | Hypertext Transfer Protocol Secure |
| IoT | Internet of Things |
| JSON | JavaScript Object Notation |
| LoRa | Long Range (low-power wide-area radio) |
| ML | Machine Learning |
| MQTT | Message Queuing Telemetry Transport |
| NLP | Natural Language Processing |
| NPK | Nitrogen, Phosphorus, Potassium |
| REST | Representational State Transfer |
| ROI | Return on Investment |
| SRS | System Requirement Specification |
| SSE | Server-Sent Events |
| SUS | System Usability Scale |
| UI | User Interface |
| UML | Unified Modelling Language |
| UX | User Experience |
| XAI | Explainable Artificial Intelligence |

{{PAGEBREAK}}
