# CHAPTER 1 — INTRODUCTION

## 1.1 Chapter Overview

This chapter introduces the research presented in this thesis. It begins by describing the background of the agricultural context in which the study is situated, with particular attention to smallholder and medium-scale farming in Sri Lanka and comparable developing agricultural economies. It then narrows the discussion from the general problem of low-information, experience-based farm management to the specific technical problem of fragmented digital agriculture tools, and states the research question that guides the study. The chapter sets out the motivation for the research, its aim and objectives, a rich picture of the proposed solution and its principal workflows, the hardware and software resources required, and the boundaries of the project scope. It closes with a summary and an outline of the remaining chapters.

## 1.2 Problem Background

Agriculture remains one of the most important sectors of the Sri Lankan economy. According to the Department of Census and Statistics (2022), agriculture, forestry and fishing employ approximately a quarter of the national labour force, and the Central Bank of Sri Lanka (2023) reports that agricultural exports, including tea, spices, coconut products, fruit and vegetables, are a significant source of foreign exchange. At the same time, the sector is dominated by smallholders: the majority of holdings are below two hectares, farm management is largely experience-based, and formal record-keeping is rare (FAO, 2017). Across both developed and developing agricultural economies, digital instrumentation is increasingly used to capture field-level conditions that were previously assessed only through manual observation, but a substantial share of smallholder and medium-scale operations continues to depend on informal inspection, memory and intuition when deciding when to irrigate, fertilise or respond to emerging crop-health problems.

The consequences of this dependence are well documented in the smart-agriculture literature. Wolfert et al. (2017) describe how the absence of continuous, reliable data leads to inefficient use of water and other inputs, missed opportunities for early intervention, and inconsistent responses to comparable field conditions over time. Ayaz et al. (2019) note that field conditions such as soil moisture can change more quickly than manual monitoring routines can detect, so that decisions taken on stale information are frequently either too late or too cautious. Klerkx, Jakku and Labarthe (2019) add that the social and organisational dimensions of digital agriculture, including digital literacy, language and trust in automated advice, are as important as the underlying technology in determining whether smart-farming tools are adopted by the farmers who could benefit most from them.

Alongside these production-side challenges, market access presents a second, closely related difficulty. Export-oriented agriculture requires structured product information (grading, certification, quantity and harvest timing), formal buyer communication, order processing and coordination with logistics and payment services (Zhang and Berghäll, 2021). Smallholders and small exporters in Sri Lanka typically rely on intermediaries for these functions, and a marketplace that is disconnected from real-time production information cannot reliably represent the current state, quality or availability of a producer's output (Lezoche et al., 2020). The Sri Lanka Export Development Board (2023) has identified digital market linkage for fresh produce as a strategic priority, yet the tools available to smallholders for this purpose remain rudimentary.

The Smart Farming Web System proposed in this research responds to these two interlocking challenges by combining continuous field monitoring and intelligent decision support with an agricultural commerce layer within a single web-based platform. The platform employs a network of connected environmental sensor nodes to capture parameters that are known to materially influence crop health and yield, including soil moisture, soil nitrogen, phosphorus and potassium concentration, soil and ambient temperature, relative humidity, soil pH and rainfall. These measurements are transmitted through a lightweight communication layer to backend services, where they are validated, stored and transformed into information that is directly useful for operational decision-making. A distinguishing characteristic of the platform is its use of AI agents and decision-intelligence techniques to support autonomous or semi-autonomous farming workflows, and its provision of the entire interface in English, Sinhala and Tamil so that the system is usable by the linguistic communities that make up the Sri Lankan farming population.

## 1.3 Problem Statement

### 1.3.1 General Problem

Smallholder and medium-scale agricultural operations face several interconnected challenges relating to productivity, resource utilisation, decision-making and market access. Environmental conditions in the field can change rapidly, for example through sudden variation in soil moisture or the onset of unfavourable weather, while manual monitoring routines frequently provide information that is incomplete, delayed or available only at intervals too coarse to support timely intervention. In the absence of continuous, reliable data, farmers are required to rely on personal experience and intuition when deciding when to irrigate, fertilise or respond to emerging crop-health issues. Such decision-making, however well-intentioned, leads to inefficient use of water and other inputs, missed opportunities for early intervention, and inconsistent responses to comparable field conditions over time. At a higher level, the implication is reduced yield reliability, higher production cost per unit, and weaker competitiveness in export markets that increasingly demand traceability and evidence of good agricultural practice (Rose and Chilvers, 2018; FAO, 2017).

### 1.3.2 Specific Problem

Within the software engineering and information systems discipline, the specific shortcoming is the fragmentation of the digital agriculture landscape. Monitoring, analysis, decision support and commercial activity are addressed through separate, loosely connected tools, or handled manually altogether. A system that only collects sensor data does not, by itself, convert that data into an actionable decision; equally, an agricultural marketplace that is disconnected from real-time production information cannot reliably represent the current state, quality or availability of a producer's output. Recent surveys of IoT platforms for agriculture (Kour and Arora, 2020; Sinha and Dhanalakshmi, 2022) confirm that most published systems concentrate on sensing and visualisation, treat decision logic as an afterthought, and do not address the commercial use of the information they collect. Conversely, studies of agri-food e-commerce (Zhang and Berghäll, 2021) find that marketplace platforms rarely integrate operational farm data. Where decision support is present, it is often opaque: recommendations are presented without the evidence or rules that produced them, which undermines farmer trust and prevents retrospective evaluation (Adadi and Berrada, 2018).

Therefore, the research problem addressed by this study can be stated as follows: there is a lack of an integrated, web-based smart-farming platform that combines IoT-driven environmental monitoring, AI-agent-based decision support with explicit traceability, automated workflow orchestration, digital-twin-oriented farm representation, and B2B e-commerce capabilities within a single, coherent, multilingual software architecture. Addressing this problem requires not only the individual technical components (sensing, inference and commerce) but also a deliberate architectural strategy for connecting them, so that field-level observations can meaningfully influence both operational decisions and market-facing activity. This is the research gap that the present study addresses, and it is examined in detail in Chapter 2.

## 1.4 Research Question

The study is guided by one principal research question:

**How can IoT-based environmental monitoring, explainable AI-agent decision support, workflow automation, a digital-twin representation and B2B export commerce be integrated into a single web-based platform so that the timeliness, consistency and traceability of smallholder farming decisions and their connection to export markets are improved?**

This principal question is decomposed into the following sub-questions, each of which corresponds to one or more of the research objectives in Section 1.7 and is revisited explicitly during the evaluation in Chapter 6:

- RQ1: What limitations exist in current approaches to smart-agriculture monitoring, decision-making and market access, and how do these limitations motivate an integrated system design?
- RQ2: Can an integrated IoT and AI-agent platform improve the timeliness and consistency of agricultural decision-making relative to manual, experience-based approaches?
- RQ3: Can automated workflow orchestration reliably convert environmental observations into useful farming actions or recommendations across varied field conditions?
- RQ4: Does the proposed web interface provide an acceptable level of usability and perceived usefulness for its intended users, including farmers and farm managers with varying levels of digital literacy and different first languages?
- RQ5: Can integration with a B2B e-commerce layer improve the connection between agricultural production data and export-oriented business processes, compared with disconnected marketplace tools?

## 1.5 Research Motivation

Three considerations motivated this research. The first is personal and contextual. Growing up in a farming district of Sri Lanka, the researcher observed at first hand how irrigation and fertiliser decisions were made from memory and habit, how crop losses followed unnoticed changes in soil moisture or humidity, and how produce was sold through several layers of intermediaries at prices that bore little relation to the export value of the crop. The conviction that a well-designed software system could change these outcomes, if it were built for the language and digital literacy of the people who would use it, was the starting point of the project.

The second motivation is technical. The individual technologies required, namely low-cost IoT microcontrollers, lightweight messaging protocols, web dashboards, rule-based and machine-learning inference and online marketplaces, are all mature and inexpensive. What is missing, as Chapter 2 demonstrates, is an architecture that connects them with well-defined interfaces so that a reading from a soil-moisture probe can, in a traceable and auditable manner, become a recommendation, an approved workflow, an updated digital-twin view and, ultimately, evidence of quality attached to a product listing seen by an export buyer. Designing and validating such an architecture is a genuine software engineering problem.

The third motivation is academic. Design Science Research provides a rigorous framework for producing and evaluating an artefact that addresses a real-world problem, and the combination of three well-studied but rarely integrated domains offers an opportunity to generate design knowledge that is transferable beyond the specific prototype. The project therefore promised both a practical contribution to precision-agriculture practice in Sri Lanka and an academic contribution to the design-science literature on integrated agri-technology platforms.

## 1.6 Research Aim

The aim of this research is to design, develop and evaluate an integrated Smart Farming Web System that combines IoT-based environmental monitoring, autonomous AI-agent decision support and B2B e-commerce capabilities, delivered through a trilingual web interface, in order to improve precision-agriculture management and support export-oriented agricultural operations for smallholder and medium-scale producers.

## 1.7 Research Objectives

The aim is operationalised through the following research objectives, phrased in the standard form recommended by the Faculty guidelines.

### 1.7.1 To identify

To identify the limitations of current smart-agriculture architectures, IoT sensor networks, AI-agent approaches and agricultural e-commerce platforms, and the design principles and gaps that are relevant to an integrated platform, through a critical review of recent literature and existing systems.

### 1.7.2 To analyse

To analyse the functional and non-functional requirements of farmers, farm managers and export buyers for such a platform, including the environmental parameters to be monitored, the decisions to be supported, the workflows to be automated and the commerce functions to be provided, and to map these requirements to a layered system architecture.

### 1.7.3 To design and develop

To design and develop the Smart Farming Web System as a working artefact comprising: (a) an IoT ingest and data-preparation pipeline for the nine target field parameters; (b) an explainable, rule-based AI-agent decision module with traceable evidence; (c) a workflow-orchestration component with approval, execution and verification stages and an optional autonomous mode; (d) a digital-twin web dashboard with live updates and historical analytics; (e) a B2B module covering product presentation, buyer–supplier interaction and export process tracking; and (f) a complete English, Sinhala and Tamil user interface.

### 1.7.4 To evaluate

To evaluate the resulting system in terms of sensor-data transmission reliability, data quality, decision-support agreement, workflow-execution success, web usability and B2B functionality against the quantitative targets defined in the methodology, using a combination of technical testing, an automated scenario suite and structured user evaluation, and to relate the findings to the research questions.

## 1.8 Rich Picture of the Proposed Solution

Figure 1.1 presents a rich picture of the proposed solution and the principal workflows it supports. At the left of the picture, ESP32-based sensor nodes installed in the field zones of a farm measure the nine environmental parameters and transmit them, through HTTP or an MQTT bridge, to the AgriPulse backend. The backend validates each reading, stores it, and hands it to the AI agent, which compares the observation with the crop policy configured for that zone. When a policy condition is breached, for example soil moisture falling below the tomato range, the agent produces a recommendation with its evidence and, where an action is appropriate, opens a workflow that waits for the farmer's approval (or executes automatically in autonomous mode), sends an actuator command, and verifies the outcome from subsequent readings.

![Figure 1.1: Rich picture of the Smart Farming Web System, showing the field, decision and market workflows](fig_rich_picture.png)

At the centre of the picture, the farmer or farm manager interacts with the digital-twin dashboard on a phone or computer, in whichever of the three languages they prefer. They see the live status of each zone, review recommendations and the reasons behind them, approve or reject workflows, ask the trilingual assistant questions in natural language, and examine trends and data-quality statistics. At the right of the picture, an export buyer browses product listings that carry live field status and certification data, sends inquiries, receives quotations, confirms orders and follows the seven-stage export process from inquiry to delivery, with document and payment milestones recorded in one traceable file. An evaluation view closes the loop by computing the DSRM evaluation metrics directly from system logs, so that each demonstration and evaluation cycle can be assessed against the thesis targets.

Three workflows are therefore emphasised in the picture: the monitoring-to-decision workflow (sensor to recommendation), the decision-to-action workflow (recommendation to approved and verified actuation), and the production-to-market workflow (verified field data to listing, inquiry, order and export).

## 1.9 Resource Requirements

### 1.9.1 Hardware

Table 1.1: Hardware resource requirements
| Resource | Specification | Purpose |
| Sensor node microcontroller | ESP32-WROOM-32 development board (dual-core 240 MHz, Wi-Fi, Bluetooth) × 3 | One node per field zone; reads sensors and posts JSON readings |
| Soil moisture sensor | Capacitive soil-moisture probe v2.0 | Volumetric soil-moisture measurement |
| Soil NPK sensor | RS485 NPK soil sensor with MAX485 transceiver | Nitrogen, phosphorus and potassium concentration (mg/kg) |
| Soil temperature sensor | DS18B20 waterproof probe | Soil temperature |
| Air temperature and humidity | DHT22 / AM2302 | Ambient temperature and relative humidity |
| Soil pH sensor | Analogue pH probe with signal conditioning board | Soil pH |
| Rain gauge | Tipping-bucket rain sensor | Rainfall (mm) |
| Actuator interface | 5 V relay module | Irrigation valve / fertigation pump control |
| Power | 18650 lithium cell with solar charge controller | Field operation without mains power |
| Development workstation | Laptop, 16 GB RAM, macOS/Windows | Development, testing and thesis writing |
| Server | Any Node.js 18+ host (local machine, VPS or container platform) | Backend and web application hosting |

### 1.9.2 Software

Table 1.2: Software resource requirements
| Resource | Version / Detail | Purpose |
| Node.js | 18 LTS or later, built-in modules only (http, fs, crypto) | Backend runtime with zero third-party dependencies |
| HTML5, CSS3, JavaScript (ES2020) | No build step | Digital-twin web interface |
| Server-Sent Events | Native browser EventSource | Live dashboard updates |
| JSON document store | Atomic-write JSON persistence (upgradeable to PostgreSQL/MongoDB) | User, sensor, workflow and commerce data |
| Arduino IDE / ESP-IDF | Arduino core for ESP32 | Node firmware |
| Eclipse Mosquitto | 2.x | Optional MQTT broker and bridge |
| Google Chrome, Safari, Firefox | Current releases | Client testing |
| Noto Sans Sinhala, Noto Sans Tamil, Plus Jakarta Sans | Google Fonts | Trilingual typography |
| Docker | 24+ | Containerised deployment |
| Visual Studio Code, Git | Current | Development and version control |
| Microsoft Word, draw.io | Current | Thesis and diagram preparation |

## 1.10 Project Scope

This study focuses on the design, development and evaluation of a web-based smart-farming artefact, developed and assessed as a functional prototype rather than a nationally deployed production system. Table 1.3 summarises what is inside and outside the scope of the research.

Table 1.3: Project scope
| In scope | Out of scope |
| Design and implementation of ESP32-based sensor nodes and an HTTP/MQTT ingest interface for nine environmental parameters | Manufacture of production-grade, weather-sealed sensor hardware or large-scale field deployment across many farms |
| A data-preparation pipeline covering unit normalisation, missing-value and range validation, timestamp standardisation and completeness scoring | Sensor calibration research or laboratory-grade accuracy assessment of individual probes |
| A rule-based, explainable AI-agent decision module with crop policies for three representative crops (tomato, chilli, okra) | Training of deep-learning yield or disease prediction models from large agronomic datasets |
| Workflow orchestration for irrigation, fertigation and sensor-maintenance actions with approval, execution and verification stages, and an autonomous mode | Physical closed-loop control of commercial irrigation infrastructure beyond a relay-driven prototype valve |
| A digital-twin dashboard with zone map, live readings, 6/24/72-hour analytics, alerts and a trilingual natural-language assistant | Three-dimensional or geospatial digital-twin modelling, satellite imagery or drone integration |
| A B2B module with product listings linked to live field data, inquiry threads, quotation-to-order conversion, seven-stage export tracking, document checklist and a payment-integration interface | A complete national agricultural marketplace, payment-gateway certification, customs or regulatory filing, or logistics booking |
| A complete English, Sinhala and Tamil interface with server-side language-neutral codes | Machine translation of user-generated content such as buyer messages |
| Prototype evaluation combining automated tests, an instrumented measurement run, a scenario suite and a structured user evaluation with SUS | Longitudinal agronomic trials measuring yield or profitability outcomes over full growing seasons |

The study does not claim to replace professional agronomic expertise, to guarantee specific agricultural yield outcomes, or to provide a complete, nationally scaled agricultural marketplace. Hardware coverage, sensor accuracy, network connectivity in remote field conditions and the availability of representative external market data constrain the depth of prototype evaluation, and these constraints are discussed as limitations in Section 3.9 and revisited in Chapter 7.

## 1.11 Chapter Summary

This chapter has established the context, problem and purpose of the research. Smallholder and medium-scale farming in Sri Lanka depends on experience-based decision-making and intermediary-based market access, and the digital tools available to address these problems are fragmented across sensing, analysis and commerce. The research question asks how these capabilities can be integrated into a single, explainable, multilingual web platform, and the aim and four objectives, to identify, to analyse, to design and develop, and to evaluate, define the path towards an answer. A rich picture introduced the three principal workflows of the proposed solution, the hardware and software resources were listed, and the scope was bounded.

The remainder of the thesis is organised as follows. Chapter 2 reviews the literature on smart-agriculture architectures, IoT sensor networks, AI agents and decision support, digital twins and agricultural e-commerce, analyses existing systems and technologies, and justifies the research gap. Chapter 3 describes the research paradigm, approach and strategy, the application of the Design Science Research Methodology, the Scrum-based project management method, the timeline and the ethical considerations. Chapter 4 presents the system requirement specification, including stakeholder analysis, use cases, class, activity, sequence and deployment diagrams, the system architecture and the functional and non-functional requirements. Chapter 5 documents the design and implementation of the artefact, with algorithms, pseudocode, technology justification and evidence of execution. Chapter 6 reports testing and evaluation against the thesis targets, and Chapter 7 draws conclusions, reflects on the research and proposes future work.
