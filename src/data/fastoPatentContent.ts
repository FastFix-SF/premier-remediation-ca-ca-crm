// FASTO Patent Application Content
// US Provisional Patent Application

export const patentContent = {
  title: "CONVERSATIONAL ARTIFICIAL INTELLIGENCE OPERATING SYSTEM FOR CONSTRUCTION INDUSTRY OPERATIONS MANAGEMENT",
  
  inventors: [
    { name: "Alejandro Torres", city: "Houston", state: "TX", country: "US" }
  ],
  
  applicationNumber: "63/XXX,XXX",
  filingDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  
  abstract: `A conversational artificial intelligence operating system for construction industry operations management receives natural language voice or text commands from users through mobile and desktop interfaces, interprets user intent using a large language model trained on construction domain vocabulary, executes multi-step operational workflows through an agentic tool orchestration engine comprising forty-three integrated construction-specific tools, and returns actionable visual response cards and synthesized audio confirmations. The system includes a real-time voice processing pipeline with voice activity detection operating over WebRTC connections, a construction-specific operational knowledge base, human-in-the-loop confirmation workflows for database-modifying operations, mobile workforce integration with GPS-verified time tracking and geofenced job site validation, AI-powered visual analysis for automated roof measurement from aerial imagery using segmentation models, and learning modules that improve recommendations based on historical decision outcomes and user feedback patterns.`,

  fieldOfInvention: `This invention relates to artificial intelligence systems for business operations management. More particularly, the invention relates to conversational AI systems that enable voice and text-based command and control of construction industry operations including project management, workforce scheduling, financial tracking, customer relationship management, and automated estimation from visual analysis.`,

  background: [
    `Construction companies face significant operational challenges managing distributed workforces, multiple concurrent projects, complex scheduling requirements, and comprehensive financial tracking across job sites, office locations, and remote workers. Traditional enterprise resource planning (ERP) and construction management software systems require extensive manual data entry through complex graphical user interfaces with multiple navigation levels, dropdown menus, and form fields.`,
    
    `Field workers in construction environments often lack convenient access to desktop computers and must interact with management systems through mobile devices while wearing protective equipment, operating machinery, or working in challenging environmental conditions. Voice-based interfaces could dramatically improve operational efficiency for these workers by enabling hands-free interaction with business systems.`,
    
    `Existing voice assistant technologies such as Apple Siri, Amazon Alexa, and Google Assistant provide general-purpose natural language understanding but lack the domain-specific knowledge, vocabulary, and tool integration required for construction operations management. These systems cannot query project databases, create work orders, track employee time, generate invoices, or perform the specialized workflows required by construction businesses.`,
    
    `Furthermore, construction estimation and bidding processes traditionally require skilled estimators to manually measure building dimensions from blueprints or conduct on-site measurements. Recent advances in computer vision and satellite imagery provide opportunities for automated measurement, but existing solutions lack integration with conversational interfaces and comprehensive construction management workflows.`,
    
    `There exists a need for a conversational AI system specifically designed for the construction industry that combines natural language understanding, domain-specific knowledge, integrated operational tools, mobile workforce support, and AI-powered visual analysis in a unified platform.`
  ],

  summaryOfInvention: [
    `The present invention provides a conversational artificial intelligence operating system specifically designed for construction industry operations management. The system enables construction company personnel to interact with comprehensive business management functionality through natural language voice commands or text input, receiving responses as visual cards with actionable data and synthesized audio confirmations.`,
    
    `In one aspect, the invention provides a computer-implemented method for managing construction operations through conversational artificial intelligence. The method comprises receiving a natural language command from a user device through a voice or text interface, processing the command through a voice activity detection module to identify speech segments, transcribing the speech segments to text using a speech recognition model, interpreting the transcribed text using a large language model to determine user intent and extract construction-specific entities, selecting one or more tools from an agentic tool registry based on the determined intent, executing the selected tools against a construction operations database, generating a visual response card containing actionable data formatted according to card type templates, rendering the visual response card on the user device, and synthesizing an audio confirmation of the executed action.`,
    
    `In another aspect, the invention provides a construction operations management system comprising a processor, memory, voice interface module, intent interpretation engine utilizing a large language model, agentic tool orchestration engine with a registry of construction-specific tools organized into query, create, update, navigation, and report categories, a construction operations database storing project, workforce, financial, schedule, and customer data, a visual card rendering engine with templates for project cards, attendance cards, invoice cards, schedule cards, and statistics cards, and an audio synthesis module for spoken confirmations.`,
    
    `In yet another aspect, the invention provides a mobile workforce management subsystem with GPS-verified time tracking, geofenced job site validation, offline operation queuing for areas with limited connectivity, and push notification integration for real-time crew communication.`,
    
    `In a further aspect, the invention provides an AI-powered visual analysis pipeline for construction estimation comprising aerial image acquisition, segmentation model processing for building boundary detection, edge classification for roofing components such as eaves, ridges, hips, and valleys, geographic scaling for accurate measurements, material takeoff generation, cost estimation, and automated proposal document generation.`
  ],

  briefDescriptionOfDrawings: [
    `FIG. 1 is a system architecture diagram showing the major components of the conversational AI operating system for construction operations.`,
    `FIG. 2 is a flowchart illustrating the natural language command processing pipeline from voice input to response generation.`,
    `FIG. 3 is a block diagram showing the agentic tool orchestration engine architecture including tool registry and execution components.`,
    `FIG. 4 is a flowchart illustrating the human-in-the-loop decision flow for database-modifying operations.`,
    `FIG. 5 is a block diagram showing the mobile workforce voice operations subsystem with location verification components.`,
    `FIG. 6 is a flowchart illustrating the AI-powered visual analysis and estimation pipeline for roof measurement.`
  ],

  detailedDescription: [
    // System Architecture - FIG. 1
    `Referring now to FIG. 1, there is shown a system architecture diagram of the conversational AI operating system for construction operations, designated generally as system 100. System 100 comprises user devices 102, FASTO AI Orchestration Engine 110, Construction Operational Intelligence Backend 130, and Construction Operations Modules 140.`,
    
    `User devices 102 include tablet devices 102a and desktop computers 102b with voice and display interfaces for office-based users, and mobile workforce application 104 running on smartphones for field-based construction workers. All user devices 102 communicate with FASTO AI Orchestration Engine 110 through encrypted network connections.`,
    
    `FASTO AI Orchestration Engine 110 comprises multiple functional submodules. Voice/Text Interaction Interface 112 receives natural language input through microphone capture or keyboard entry. The interface supports real-time voice streaming using WebRTC protocol with server-side voice activity detection to efficiently process speech segments while minimizing bandwidth and computational requirements.`,
    
    `Intent Interpretation Engine 114 utilizes a large language model specifically configured with construction industry domain knowledge, vocabulary, and operational patterns. Engine 114 processes transcribed text to understand user requests and extract construction-specific entities including project names, customer names, employee names, addresses, dates, monetary amounts, and status values. The engine maintains contextual awareness of conversation history to resolve pronouns and references to previously mentioned entities.`,
    
    `Operational Context Manager 116 maintains awareness of the user's current location within the application interface, including the active page, selected project, recent interactions, and user role permissions. This context enriches tool calls with relevant identifiers and filters results appropriately for the user's access level.`,
    
    `Agentic Tool Orchestration Engine 118 maintains a registry of forty-three construction-specific tools organized into functional categories. Query tools retrieve information from the construction operations database including projects, leads, schedules, invoices, timesheets, and workforce data. Create tools generate new database records for projects, leads, schedules, work orders, and expense entries. Update tools modify existing records including status changes, contact information updates, and assignment modifications. Navigation tools control application routing to direct users to specific pages and deep-linked content. Report tools generate formatted documents including PDF timesheets, invoices, proposals, and analytical reports.`,
    
    `When a user command such as "Show me active projects" is received, Engine 118 analyzes the interpreted intent, selects the appropriate query_projects tool with status parameter "active", executes the database query through the backend, and formats the result as a visual card containing project names, addresses, statuses, and navigation links for user action.`,
    
    `Audit and Learning Module 120 logs every command, tool selection, execution result, and user response for compliance tracking and system improvement. The module analyzes command success rates across tool categories and identifies patterns in failed interactions to improve future response accuracy. User feedback on AI suggestions is captured and used to refine recommendation algorithms.`,
    
    // Backend - FIG. 1 continued
    `Construction Operational Intelligence Backend 130 provides data storage and business logic services. Operational Knowledge Base 132 stores construction industry reference data including material specifications, labor rate benchmarks, building code requirements, and best practice workflows. Learning and Optimization Engine 134 processes historical data to generate predictive insights for scheduling optimization, resource allocation, and cost estimation. Data Store 136 comprises relational database tables for projects, workforce records, financial transactions, customer information, and document storage.`,
    
    `Construction Operations Modules 140 provide domain-specific functionality. Projects and Job Management module 142 handles project lifecycle from lead capture through completion including milestone tracking, progress documentation, and customer communication. Estimating and Bidding module 144 supports material takeoffs, labor estimation, markup calculation, and proposal generation. Scheduling and Dispatch module 146 manages crew assignments, job scheduling, route optimization, and calendar integration. Workforce and Timekeeping module 148 handles employee records, time tracking, payroll preparation, and certification management. Financials and Bookkeeping module 150 manages invoicing, payment tracking, expense recording, and financial reporting. Documents and Compliance module 152 handles contract generation, permit tracking, inspection scheduling, and document storage. Inventory and Procurement module 154 manages material inventory, purchase orders, vendor relationships, and delivery tracking.`,
    
    // Voice Processing Pipeline - FIG. 2
    `Referring now to FIG. 2, there is shown a flowchart illustrating the natural language command processing pipeline. The pipeline begins at step 200 with voice or text input reception from the user device. For voice input, step 202 performs voice activity detection (VAD) using a server-side neural network model to identify speech segments within the audio stream and filter silence periods.`,
    
    `Step 204 performs speech-to-text transcription using a trained speech recognition model optimized for construction industry vocabulary including technical terms, material names, trade terminology, and common proper nouns in the geographic region of operation. The transcription model supports multiple languages and accents prevalent in construction workforces.`,
    
    `Step 206 performs intent classification to categorize the user request into operational categories such as query, create, update, navigate, or report. Step 208 extracts entities from the classified intent including specific project names, employee names, customer names, dates, addresses, monetary values, and status indicators.`,
    
    `Step 210 enriches the extracted intent with operational context from the Context Manager including current page location, active project selection, user permissions, and recent conversation history. This enrichment enables pronoun resolution and implicit reference handling.`,
    
    `Step 212 maps the enriched intent to specific tools in the tool registry and prepares execution parameters. For complex requests, multiple tools may be selected for sequential or parallel execution. Step 214 executes the selected tools and generates response content based on execution results.`,
    
    `Step 216 renders the response as visual cards on the user interface and synthesizes audio confirmation using text-to-speech. The visual cards are formatted according to templates appropriate for the data type, with interactive elements for follow-up actions.`,
    
    // Tool Orchestration - FIG. 3
    `Referring now to FIG. 3, there is shown a block diagram of the Agentic Tool Orchestration Engine 118. Tool Registry 300 maintains definitions for forty-three registered tools with metadata including tool name, description, required parameters, optional parameters, return type, and category classification.`,
    
    `Tool Categories 302 organize tools into functional groups. Query category tools (302a) retrieve data without modification and include tools for projects, leads, invoices, schedules, timesheets, workforce, and analytics queries. Create category tools (302b) generate new database records and include tools for projects, leads, work orders, schedules, and expense entries. Update category tools (302c) modify existing records and include tools for status changes, contact updates, and assignment modifications. Navigate category tools (302d) control application routing and include tools for page navigation and deep linking. Report category tools (302e) generate formatted documents and include tools for PDF timesheets, invoices, proposals, and analytical reports.`,
    
    `Tool Execution Queue 304 manages the ordered execution of selected tools, handling dependencies between tools and managing parallel execution where appropriate. Database Query Executor 306 executes database operations with proper authentication, authorization, and transaction management. Visual Card Generator 308 creates formatted response cards based on tool execution results and card type templates.`,
    
    `Navigation Controller 310 manages application routing in response to navigation tool execution. PDF Report Generator 312 creates formatted document outputs for printing or digital distribution. Result Aggregator 314 combines results from multiple tool executions into coherent responses. Error Handler 316 manages execution failures with retry logic, fallback options, and user-friendly error messaging.`,
    
    // Human-in-the-Loop - FIG. 4
    `Referring now to FIG. 4, there is shown a flowchart illustrating the human-in-the-loop decision flow for database-modifying operations. The flow begins at step 400 when a user command is received. Step 402 determines whether the interpreted intent involves a modifying action such as create, update, or delete operations.`,
    
    `Decision step 404 evaluates whether confirmation is required based on the action type, data sensitivity, and user preferences. Low-risk queries proceed directly to execution, while high-impact modifications require explicit confirmation.`,
    
    `Step 406 displays a confirmation card to the user showing the proposed action, affected records, and potential consequences. The card includes confirm and cancel action buttons. Step 408 awaits user response through button interaction or voice confirmation.`,
    
    `Upon confirmation, step 410 executes the approved action against the database. Step 412 logs the action, confirmation, and result to the audit trail for compliance and accountability tracking. Step 414 returns a success or failure card indicating the action outcome.`,
    
    `Step 416 offers relevant follow-up actions based on the completed operation. For example, after creating a new project, the system may offer to add team members, create a schedule, or generate an initial estimate.`,
    
    // Mobile Workforce - FIG. 5
    `Referring now to FIG. 5, there is shown a block diagram of the mobile workforce voice operations subsystem with location verification. Mobile Device 500 represents a smartphone running the workforce application with integrated GPS receiver, camera, and microphone.`,
    
    `Voice Command Interface 502 provides the mobile voice interaction capability optimized for outdoor and noisy construction environments with enhanced noise cancellation and directional audio processing. Location Services 504 provides GPS coordinates and location accuracy metrics.`,
    
    `Geofence Verification 506 validates that clock-in and clock-out operations occur within defined job site boundaries. Job sites are defined as geographic polygons with configurable boundary tolerances. Clock In/Out Module 508 records time entries with GPS coordinates, timestamps, and optional photo verification.`,
    
    `Photo Capture 510 enables GPS-stamped photography for progress documentation, safety observations, and material delivery verification. Photos are automatically tagged with location, timestamp, project, and user information.`,
    
    `Offline Queue 512 stores operations when network connectivity is unavailable, common in remote construction sites or areas with limited cellular coverage. Queued operations are automatically synchronized when connectivity is restored with conflict resolution for overlapping entries.`,
    
    `Push Notification System 514 delivers real-time alerts to field workers for schedule changes, urgent communications, safety alerts, and assignment updates. Workforce Dashboard 516 provides supervisors and administrators with real-time visibility into crew locations, clock status, and productivity metrics.`,
    
    // AI Visual Analysis - FIG. 6
    `Referring now to FIG. 6, there is shown a flowchart illustrating the AI-powered visual analysis and estimation pipeline for roof measurement and construction estimation. The pipeline begins at step 600 with aerial or satellite image acquisition from integrated imagery providers or user-uploaded photographs.`,
    
    `Step 602 processes acquired images through an AI segmentation model, preferably using Segment Anything Model (SAM) architecture, to identify building boundaries and structural features. The segmentation model is trained to recognize construction-relevant features including roof surfaces, edges, penetrations, and obstacles.`,
    
    `Step 604 performs roof boundary detection to isolate the primary measurement area from surrounding context. The detection algorithm handles complex roof geometries including multi-level structures, attached garages, and irregular shapes.`,
    
    `Step 606 classifies detected edges into roofing component categories including eaves (horizontal roof edges), ridges (horizontal peak lines), hips (angled peak lines), valleys (angled trough lines), rakes (gable edges), and step flashings. Edge classification enables accurate material estimation for different roofing systems.`,
    
    `Step 608 performs measurement calculation using geographic scaling derived from known reference points, satellite imagery metadata, or user-provided scale references. Measurements include total roof area, individual facet areas, edge lengths by type, and slope calculations.`,
    
    `Step 610 generates material takeoffs based on measurements and selected roofing system specifications. Takeoffs include shingle quantities with waste factors, underlayment requirements, flashing materials, ventilation components, and fastener quantities.`,
    
    `Step 612 applies cost estimation using current material pricing, labor rates, and regional adjustment factors. The estimation engine supports multiple pricing tiers, markup configurations, and competitive analysis.`,
    
    `Step 614 generates proposal documents formatted for customer presentation including measurements, material specifications, pricing, terms and conditions, and company branding. Step 616 delivers completed proposals through the customer portal with electronic signature capability and payment integration.`
  ],

  claims: [
    // Independent Method Claim
    {
      number: 1,
      type: 'independent',
      text: `A computer-implemented method for managing construction operations through conversational artificial intelligence, comprising:
receiving, via a voice or text interface on a user device, a natural language command from a construction company user;
processing the command through a voice activity detection module executing on a server to identify speech segments within an audio stream;
transcribing the identified speech segments to text using a speech recognition model trained on construction industry vocabulary;
interpreting the transcribed text using a large language model to determine user intent and extract construction-specific entities including at least one of project names, employee names, customer names, addresses, dates, and monetary amounts;
selecting one or more tools from an agentic tool registry comprising a plurality of construction-specific tools based on the determined user intent;
executing the selected one or more tools against a construction operations database to retrieve or modify construction business data;
generating a visual response card containing actionable data formatted according to a card type template corresponding to the tool execution result;
rendering the visual response card on the user device; and
synthesizing an audio confirmation of the executed action using text-to-speech conversion.`
    },
    
    // Dependent Claims on Claim 1
    {
      number: 2,
      type: 'dependent',
      dependsOn: 1,
      text: `The method of claim 1, wherein the agentic tool registry comprises tools organized into categories including query tools for retrieving project, lead, schedule, invoice, and workforce data, create tools for generating new database records, update tools for modifying existing records, navigation tools for controlling application routing, and report tools for generating formatted documents.`
    },
    {
      number: 3,
      type: 'dependent',
      dependsOn: 1,
      text: `The method of claim 1, further comprising enriching the user command with operational context including a current page location within the application interface, an active project identifier, and recent conversation history to resolve pronoun references and implicit entity references.`
    },
    {
      number: 4,
      type: 'dependent',
      dependsOn: 1,
      text: `The method of claim 1, wherein generating a visual response card comprises selecting a card type from a plurality of card types including project cards, attendance cards, invoice cards, schedule cards, and statistics cards based on the tool execution result data type.`
    },
    {
      number: 5,
      type: 'dependent',
      dependsOn: 1,
      text: `The method of claim 1, further comprising detecting an inactivity period exceeding a configurable threshold duration and automatically disconnecting a voice session to conserve computational resources and network bandwidth.`
    },
    {
      number: 6,
      type: 'dependent',
      dependsOn: 1,
      text: `The method of claim 1, wherein the construction-specific entities extracted by the large language model include project identifiers matched against a project database, employee names matched against a workforce database, customer names matched against a customer relationship database, and status values from a predefined construction workflow status enumeration.`
    },
    {
      number: 7,
      type: 'dependent',
      dependsOn: 1,
      text: `The method of claim 1, further comprising, prior to executing a tool that modifies database records:
determining that the selected tool is a modifying tool;
displaying a confirmation card to the user showing the proposed modification;
receiving user confirmation through button interaction or voice confirmation; and
logging the confirmation and execution result to an audit trail.`
    },
    {
      number: 8,
      type: 'dependent',
      dependsOn: 1,
      text: `The method of claim 1, further comprising logging the command, the determined user intent, the selected tools, the execution result, and a user context snapshot to an audit database for compliance tracking and system improvement analysis.`
    },
    {
      number: 9,
      type: 'dependent',
      dependsOn: 1,
      text: `The method of claim 1, wherein the voice interface operates in real-time using WebRTC protocol with server-side voice activity detection to transmit only speech-containing audio segments, reducing bandwidth requirements and server processing load.`
    },
    
    // Independent System Claim
    {
      number: 10,
      type: 'independent',
      text: `A construction operations management system, comprising:
a processor;
a memory coupled to the processor and storing instructions;
a voice interface module configured to receive natural language voice commands from user devices through real-time audio streaming;
a speech recognition module configured to transcribe received voice commands to text using a model trained on construction industry vocabulary;
an intent interpretation engine configured to process transcribed text using a large language model to determine user intent and extract construction-specific entities;
an agentic tool orchestration engine comprising:
  a tool registry storing definitions for a plurality of construction-specific tools organized into query, create, update, navigation, and report categories;
  a tool selection module configured to select tools from the registry based on interpreted user intent;
  a tool execution module configured to execute selected tools against a construction operations database; and
  a result aggregation module configured to combine results from multiple tool executions;
a construction operations database storing project data, workforce data, financial data, schedule data, and customer data;
a visual card rendering engine configured to generate response cards from tool execution results using card type templates; and
an audio synthesis module configured to generate spoken confirmations of executed actions.`
    },
    
    // Dependent Claims on Claim 10
    {
      number: 11,
      type: 'dependent',
      dependsOn: 10,
      text: `The system of claim 10, further comprising a mobile workforce subsystem including:
a GPS location module configured to receive location coordinates from mobile devices;
a geofence verification module configured to validate that time tracking operations occur within defined job site boundaries;
a clock in/out module configured to record time entries with GPS coordinates and timestamps; and
an offline queue configured to store operations during periods of network unavailability for later synchronization.`
    },
    {
      number: 12,
      type: 'dependent',
      dependsOn: 10,
      text: `The system of claim 10, further comprising an AI visual analysis pipeline including:
an image acquisition module configured to receive aerial or satellite imagery;
a segmentation model configured to identify building boundaries and structural features;
an edge classification module configured to categorize detected edges as eaves, ridges, hips, valleys, or rakes;
a measurement calculation module configured to determine areas and lengths using geographic scaling; and
a material takeoff generator configured to calculate material quantities based on measurements.`
    },
    {
      number: 13,
      type: 'dependent',
      dependsOn: 10,
      text: `The system of claim 10, further comprising an operational context manager configured to maintain awareness of a user's current page location, active project selection, user role permissions, and conversation history, and to enrich tool execution parameters with contextual information.`
    },
    {
      number: 14,
      type: 'dependent',
      dependsOn: 10,
      text: `The system of claim 10, wherein the tool registry comprises at least forty tools including tools for querying projects, querying leads, querying invoices, querying schedules, querying workforce data, creating projects, creating leads, creating work orders, updating status values, navigating to application pages, and generating PDF reports.`
    },
    {
      number: 15,
      type: 'dependent',
      dependsOn: 10,
      text: `The system of claim 10, further comprising an audit and learning module configured to log commands, tool selections, and execution results, and to analyze patterns in user interactions to improve tool selection accuracy.`
    },
    {
      number: 16,
      type: 'dependent',
      dependsOn: 10,
      text: `The system of claim 10, wherein the visual card rendering engine is configured to generate card types including:
project cards displaying project name, address, status, and navigation links;
attendance cards displaying employee name, clock times, and location verification status;
invoice cards displaying invoice number, amount, status, and payment actions;
schedule cards displaying date, time, assigned crew, and job site information; and
statistics cards displaying aggregated metrics with charts and trend indicators.`
    },
    
    // Independent Computer-Readable Medium Claim
    {
      number: 17,
      type: 'independent',
      text: `A non-transitory computer-readable medium having instructions stored therein, which when executed by a processor, cause the processor to perform a method for conversational construction operations management, the method comprising:
receiving a natural language command through a voice or text interface;
interpreting the command using a large language model configured with construction industry domain knowledge to determine user intent and extract entities;
selecting tools from a registry of construction-specific tools based on the interpreted intent;
executing the selected tools to query or modify a construction operations database;
generating visual response cards formatted according to card type templates; and
synthesizing audio confirmations of executed actions.`
    },
    
    // Dependent Claims on Claim 17
    {
      number: 18,
      type: 'dependent',
      dependsOn: 17,
      text: `The computer-readable medium of claim 17, wherein the method further comprises processing voice input through a voice activity detection module to identify speech segments prior to transcription, reducing processing requirements for silence periods.`
    },
    {
      number: 19,
      type: 'dependent',
      dependsOn: 17,
      text: `The computer-readable medium of claim 17, wherein the method further comprises validating GPS coordinates for time tracking operations against defined job site geofences to verify employee presence at assigned work locations.`
    },
    {
      number: 20,
      type: 'dependent',
      dependsOn: 17,
      text: `The computer-readable medium of claim 17, wherein the method further comprises processing aerial imagery through an AI segmentation model to detect roof boundaries, classifying edges by type, calculating measurements using geographic scaling, and generating material takeoffs and cost estimates for construction proposals.`
    }
  ]
};

// Figure definitions for drawing
export const figureDefinitions = {
  fig1: {
    title: "FIG. 1 - System Architecture Overview",
    components: [
      { id: "100", label: "System", x: 300, y: 30 },
      { id: "102", label: "User Devices", x: 100, y: 100, width: 120, height: 60 },
      { id: "102a", label: "Tablet/Desktop", x: 60, y: 180, width: 80, height: 40 },
      { id: "104", label: "Mobile App", x: 160, y: 180, width: 80, height: 40 },
      { id: "110", label: "FASTO AI Orchestration Engine", x: 280, y: 100, width: 200, height: 180 },
      { id: "112", label: "Voice/Text Interface", x: 290, y: 130, width: 80, height: 30 },
      { id: "114", label: "Intent Engine (LLM)", x: 390, y: 130, width: 80, height: 30 },
      { id: "116", label: "Context Manager", x: 290, y: 170, width: 80, height: 30 },
      { id: "118", label: "Tool Orchestration", x: 390, y: 170, width: 80, height: 30 },
      { id: "120", label: "Audit & Learning", x: 340, y: 220, width: 80, height: 30 },
      { id: "130", label: "Backend Services", x: 520, y: 100, width: 140, height: 120 },
      { id: "132", label: "Knowledge Base", x: 530, y: 130, width: 60, height: 25 },
      { id: "134", label: "Learning Engine", x: 600, y: 130, width: 50, height: 25 },
      { id: "136", label: "Data Store", x: 565, y: 170, width: 60, height: 25 },
      { id: "140", label: "Operations Modules", x: 280, y: 320, width: 380, height: 100 },
      { id: "142", label: "Projects", x: 290, y: 350, width: 50, height: 30 },
      { id: "144", label: "Estimating", x: 350, y: 350, width: 50, height: 30 },
      { id: "146", label: "Scheduling", x: 410, y: 350, width: 50, height: 30 },
      { id: "148", label: "Workforce", x: 470, y: 350, width: 50, height: 30 },
      { id: "150", label: "Financials", x: 530, y: 350, width: 50, height: 30 },
      { id: "152", label: "Documents", x: 590, y: 350, width: 50, height: 30 }
    ],
    arrows: [
      { from: "102", to: "110" },
      { from: "110", to: "130" },
      { from: "110", to: "140" },
      { from: "130", to: "140" }
    ]
  },
  
  fig2: {
    title: "FIG. 2 - Natural Language Command Processing Pipeline",
    steps: [
      { id: "200", label: "Voice/Text Input", y: 60 },
      { id: "202", label: "Voice Activity Detection (VAD)", y: 110 },
      { id: "204", label: "Speech-to-Text Transcription", y: 160 },
      { id: "206", label: "Intent Classification", y: 210 },
      { id: "208", label: "Entity Extraction", y: 260 },
      { id: "210", label: "Context Enrichment", y: 310 },
      { id: "212", label: "Tool Selection & Mapping", y: 360 },
      { id: "214", label: "Response Generation", y: 410 },
      { id: "216", label: "Audio/Visual Rendering", y: 460 }
    ]
  },
  
  fig3: {
    title: "FIG. 3 - Agentic Tool Orchestration Engine",
    components: [
      { id: "300", label: "Tool Registry (43+ Tools)", x: 300, y: 60, width: 200, height: 40 },
      { id: "302", label: "Tool Categories", x: 100, y: 130, width: 500, height: 60 },
      { id: "302a", label: "Query", x: 110, y: 150, width: 60, height: 30 },
      { id: "302b", label: "Create", x: 180, y: 150, width: 60, height: 30 },
      { id: "302c", label: "Update", x: 250, y: 150, width: 60, height: 30 },
      { id: "302d", label: "Navigate", x: 320, y: 150, width: 60, height: 30 },
      { id: "302e", label: "Report", x: 390, y: 150, width: 60, height: 30 },
      { id: "304", label: "Execution Queue", x: 300, y: 220, width: 200, height: 40 },
      { id: "306", label: "DB Executor", x: 120, y: 290, width: 100, height: 40 },
      { id: "308", label: "Card Generator", x: 240, y: 290, width: 100, height: 40 },
      { id: "310", label: "Nav Controller", x: 360, y: 290, width: 100, height: 40 },
      { id: "312", label: "PDF Generator", x: 480, y: 290, width: 100, height: 40 },
      { id: "314", label: "Result Aggregator", x: 250, y: 360, width: 140, height: 40 },
      { id: "316", label: "Error Handler", x: 410, y: 360, width: 100, height: 40 }
    ]
  },
  
  fig4: {
    title: "FIG. 4 - Human-in-the-Loop Decision Flow",
    steps: [
      { id: "400", label: "User Command Received", y: 60, type: "rect" },
      { id: "402", label: "Intent = Modifying Action?", y: 120, type: "diamond" },
      { id: "404", label: "Confirmation Required?", y: 190, type: "diamond" },
      { id: "406", label: "Display Confirmation Card", y: 260, type: "rect" },
      { id: "408", label: "User Confirms?", y: 320, type: "diamond" },
      { id: "410", label: "Execute Action", y: 390, type: "rect" },
      { id: "412", label: "Log to Audit Trail", y: 440, type: "rect" },
      { id: "414", label: "Return Result Card", y: 490, type: "rect" },
      { id: "416", label: "Offer Follow-up Actions", y: 540, type: "rect" }
    ]
  },
  
  fig5: {
    title: "FIG. 5 - Mobile Workforce Voice Operations",
    components: [
      { id: "500", label: "Mobile Device + GPS", x: 100, y: 100, width: 140, height: 60 },
      { id: "502", label: "Voice Command Interface", x: 100, y: 180, width: 140, height: 40 },
      { id: "504", label: "Location Services", x: 100, y: 240, width: 140, height: 40 },
      { id: "506", label: "Geofence Verification", x: 300, y: 100, width: 140, height: 50 },
      { id: "508", label: "Clock In/Out Module", x: 300, y: 170, width: 140, height: 50 },
      { id: "510", label: "Photo Capture + GPS", x: 300, y: 240, width: 140, height: 50 },
      { id: "512", label: "Offline Queue", x: 500, y: 100, width: 120, height: 50 },
      { id: "514", label: "Push Notifications", x: 500, y: 170, width: 120, height: 50 },
      { id: "516", label: "Workforce Dashboard", x: 500, y: 240, width: 120, height: 50 }
    ]
  },
  
  fig6: {
    title: "FIG. 6 - AI-Powered Visual Analysis Pipeline",
    steps: [
      { id: "600", label: "Aerial Image Acquisition", y: 60 },
      { id: "602", label: "AI Segmentation Model (SAM 2)", y: 110 },
      { id: "604", label: "Roof Boundary Detection", y: 160 },
      { id: "606", label: "Edge Classification (Eave/Ridge/Hip/Valley)", y: 210 },
      { id: "608", label: "Measurement Calculation", y: 260 },
      { id: "610", label: "Material Takeoff Generation", y: 310 },
      { id: "612", label: "Cost Estimation Engine", y: 360 },
      { id: "614", label: "Proposal Document Generation", y: 410 },
      { id: "616", label: "Customer Portal Delivery", y: 460 }
    ]
  }
};
