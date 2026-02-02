// FASTO Patentable Features Analysis
// Expert US Patent Evaluation

export interface PatentableFeature {
  id: number;
  name: string;
  tier: 1 | 2 | 3 | 4; // 1 = Highly Patentable, 4 = Moderate
  patentabilityScore: number; // 1-10
  category: 'voice-ai' | 'computer-vision' | 'workflow' | 'mobile' | 'learning' | 'integration';
  sourceFiles: string[];
  noveltyAnalysis: string;
  technicalDifferentiators: string[];
  priorArt: { title: string; limitation: string }[];
  independentClaim: string;
  dependentClaims: string[];
  usptoCpc: string[]; // Classification codes
  patentabilityFactors: {
    novelty: number;
    nonObviousness: number;
    utility: number;
    enablement: number;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    concerns: string[];
  };
}

export const patentableFeatures: PatentableFeature[] = [
  // ============== TIER 1: HIGHLY PATENTABLE (Score 9.0+) ==============
  {
    id: 1,
    name: "Agentic Voice OS with 43+ Integrated Construction Tools",
    tier: 1,
    patentabilityScore: 9.5,
    category: 'voice-ai',
    sourceFiles: [
      'supabase/functions/fasto-realtime-token/index.ts',
      'supabase/functions/agent-hub/index.ts',
      'src/lib/voiceAgentTools.ts'
    ],
    noveltyAnalysis: `This invention combines natural language voice processing with a domain-specific tool registry containing 43+ construction-specific tools organized into query, create, update, navigate, and report categories. Unlike general-purpose voice assistants (Siri, Alexa, Google Assistant) that lack construction domain knowledge, or construction software that lacks voice interfaces, this system uniquely bridges both domains through an agentic orchestration layer that interprets intent and selects appropriate tools dynamically.`,
    technicalDifferentiators: [
      "Domain-specific LLM configuration with construction vocabulary",
      "Tool registry with 5 functional categories (query/create/update/navigate/report)",
      "Context-aware parameter enrichment from operational state",
      "Multi-tool orchestration for complex requests",
      "Real-time WebRTC voice streaming with server-side VAD",
      "Visual card response generation with type-specific templates"
    ],
    priorArt: [
      { title: "Amazon Alexa Skills Kit", limitation: "General-purpose; no construction domain integration" },
      { title: "Procore Voice (concept)", limitation: "Limited to basic queries; no multi-tool orchestration" },
      { title: "US10,657,961 (Voice-based task management)", limitation: "Task-focused; lacks construction-specific entity extraction" }
    ],
    independentClaim: `A computer-implemented method for managing construction operations through conversational artificial intelligence, comprising:
(a) receiving a natural language voice command from a user device through a real-time WebRTC audio stream;
(b) processing the audio stream through a server-side voice activity detection module to isolate speech segments;
(c) transcribing the isolated speech segments using a speech recognition model trained on construction industry vocabulary including project names, trade terminology, material specifications, and construction workflow terminology;
(d) interpreting the transcribed text using a large language model configured with construction domain knowledge to determine user intent and extract construction-specific entities;
(e) selecting one or more tools from an agentic tool registry comprising forty-three or more construction-specific tools organized into query, create, update, navigate, and report categories based on the determined intent;
(f) enriching tool execution parameters with operational context including current page location, active project identifier, user permissions, and conversation history;
(g) executing the selected tools against a construction operations database;
(h) generating a visual response card formatted according to a card type template selected based on the tool execution result type; and
(i) synthesizing an audio confirmation of the executed action.`,
    dependentClaims: [
      "The method of claim 1, wherein the tool registry query category includes tools for querying projects, leads, invoices, schedules, timesheets, workforce assignments, and analytics dashboards.",
      "The method of claim 1, wherein entity extraction includes matching project names against a project database, employee names against a workforce database, and customer names against a CRM database using fuzzy string matching.",
      "The method of claim 1, wherein the visual response card types include project cards, attendance cards, invoice cards, schedule cards, statistics cards, and confirmation cards.",
      "The method of claim 1, further comprising detecting user inactivity exceeding a threshold and automatically disconnecting the voice session to conserve resources.",
      "The method of claim 1, wherein tool selection supports multi-tool orchestration for complex requests requiring sequential or parallel tool execution."
    ],
    usptoCpc: ['G10L15/22', 'G06F16/9535', 'G06Q10/06', 'G06F40/30'],
    patentabilityFactors: {
      novelty: 9.5,
      nonObviousness: 9.0,
      utility: 10.0,
      enablement: 9.5
    },
    riskAssessment: {
      level: 'low',
      concerns: ["Broad voice assistant prior art requires specific construction focus"]
    }
  },
  {
    id: 2,
    name: "Hybrid Geometric-AI Roof Analysis with Edge Classification",
    tier: 1,
    patentabilityScore: 9.2,
    category: 'computer-vision',
    sourceFiles: [
      'src/components/quote/UnifiedRoofCanvas.tsx',
      'src/hooks/useEdgeDrawing.ts',
      'src/utils/roofCalculations.ts',
      'src/lib/segmentation/'
    ],
    noveltyAnalysis: `This system combines AI-based image segmentation (SAM architecture) with geometric edge classification and user-guided refinement. Unlike pure AI approaches that may misidentify complex roof geometries, or manual measurement systems that are time-consuming, this hybrid approach uses AI for initial segmentation while enabling precise edge classification (eave, ridge, hip, valley, rake) and geometric calculations for accurate material takeoffs.`,
    technicalDifferentiators: [
      "SAM-based roof boundary detection from aerial imagery",
      "Five-category edge classification (eave, ridge, hip, valley, rake)",
      "Real-time geometric calculations with geographic scaling",
      "Canvas-based manual refinement with snap-to-edge assistance",
      "Automatic waste factor calculation by material type",
      "Confidence score aggregation from AI + geometric validation"
    ],
    priorArt: [
      { title: "EagleView RoofReport", limitation: "Fully automated; no user refinement loop" },
      { title: "Hover.to 3D Modeling", limitation: "Photo-based; different measurement methodology" },
      { title: "US10,176,635 (Roof estimation)", limitation: "Manual measurement focus; no AI segmentation" }
    ],
    independentClaim: `A computer-implemented method for construction estimation from aerial imagery, comprising:
(a) acquiring aerial or satellite imagery of a building structure;
(b) processing the imagery through an AI segmentation model to generate initial boundary detection masks;
(c) extracting roof facet boundaries from the segmentation masks;
(d) classifying detected edges into construction-relevant categories including eaves, ridges, hips, valleys, and rakes;
(e) calculating measurements including facet areas and edge lengths using geographic scaling derived from imagery metadata;
(f) presenting the detected boundaries on an interactive canvas interface;
(g) receiving user refinements to boundary positions through direct manipulation;
(h) recalculating measurements based on refined boundaries;
(i) generating material takeoffs based on measurements and selected roofing system specifications; and
(j) producing cost estimates and proposal documents.`,
    dependentClaims: [
      "The method of claim 1, wherein edge classification uses geometric analysis including angle calculations to distinguish ridge lines from valley lines.",
      "The method of claim 1, wherein material takeoffs include waste factors calculated based on roof complexity and facet count.",
      "The method of claim 1, further comprising calculating a confidence score aggregating AI segmentation confidence with geometric validation results.",
      "The method of claim 1, wherein the interactive canvas includes snap-to-edge functionality to assist user refinements."
    ],
    usptoCpc: ['G06T7/10', 'G06T7/60', 'G06V20/10', 'G06Q30/02'],
    patentabilityFactors: {
      novelty: 9.0,
      nonObviousness: 9.5,
      utility: 9.5,
      enablement: 9.0
    },
    riskAssessment: {
      level: 'low',
      concerns: ["Computer vision for construction is active patent area"]
    }
  },
  {
    id: 3,
    name: "Self-Improving AI through Training Session Metadata Capture",
    tier: 1,
    patentabilityScore: 9.0,
    category: 'learning',
    sourceFiles: [
      'src/hooks/useTrainingSession.ts',
      'supabase/functions/process-training-data/index.ts'
    ],
    noveltyAnalysis: `This system captures detailed metadata during user interactions with AI suggestions, including accepted/rejected decisions, user modifications, and contextual features. Unlike simple feedback mechanisms, this approach stores rich geometric and contextual data enabling training of specialized edge detection and feature recognition models tailored to construction estimation.`,
    technicalDifferentiators: [
      "Structured training data capture during normal workflow",
      "Geometric feature extraction (angles, lengths, positions)",
      "User modification tracking with before/after comparison",
      "Quality score calculation for training examples",
      "Correction logging for reinforcement learning",
      "Session-based grouping for batch training"
    ],
    priorArt: [
      { title: "Active learning systems", limitation: "Generic; not construction-specific" },
      { title: "User feedback collection", limitation: "Simple ratings; no geometric metadata" }
    ],
    independentClaim: `A computer-implemented method for improving AI model accuracy through structured user interaction capture, comprising:
(a) presenting an AI-generated suggestion to a user during a construction estimation workflow;
(b) tracking the user's response to the suggestion including acceptance, rejection, or modification;
(c) when the user modifies the suggestion, capturing geometric features of both the original suggestion and the user's modification including coordinates, angles, and measurements;
(d) extracting contextual features including image characteristics, roof complexity metrics, and user expertise indicators;
(e) calculating a training quality score based on modification magnitude and user consistency;
(f) storing the captured data as a training example in a structured training database;
(g) aggregating training examples across sessions to form training batches; and
(h) periodically retraining AI models using the accumulated training data to improve suggestion accuracy.`,
    dependentClaims: [
      "The method of claim 1, wherein geometric features include edge start and end coordinates, edge angle relative to horizontal, edge length, and edge type classification.",
      "The method of claim 1, wherein the training quality score penalizes examples where user behavior is inconsistent.",
      "The method of claim 1, further comprising logging rejected AI suggestions with rejection reason for negative example training."
    ],
    usptoCpc: ['G06N20/00', 'G06F18/2415', 'G06Q10/063'],
    patentabilityFactors: {
      novelty: 9.0,
      nonObviousness: 9.0,
      utility: 9.0,
      enablement: 9.0
    },
    riskAssessment: {
      level: 'medium',
      concerns: ["Active learning is established field; construction specificity is key differentiator"]
    }
  },

  // ============== TIER 2: STRONG PATENTABILITY (Score 8.0-8.9) ==============
  {
    id: 4,
    name: "Human-in-the-Loop Confirmation with Context-Aware Thresholds",
    tier: 2,
    patentabilityScore: 8.7,
    category: 'workflow',
    sourceFiles: [
      'src/components/voice/ConfirmationCard.tsx',
      'supabase/functions/agent-hub/index.ts'
    ],
    noveltyAnalysis: `This system implements intelligent confirmation workflows that determine when to require explicit user confirmation for AI-initiated database operations. Unlike simple "confirm all" or "confirm none" approaches, this system evaluates action risk, data sensitivity, and user trust level to dynamically set confirmation thresholds.`,
    technicalDifferentiators: [
      "Dynamic confirmation threshold based on action type",
      "Risk scoring for database-modifying operations",
      "Voice confirmation support with NLU verification",
      "Audit trail logging for compliance",
      "Follow-up action suggestion after confirmation"
    ],
    priorArt: [
      { title: "Confirmation dialogs", limitation: "Static; no risk-based adaptation" },
      { title: "Transaction approval workflows", limitation: "Financial focus; not AI-action context" }
    ],
    independentClaim: `A computer-implemented method for human-in-the-loop confirmation of AI-initiated actions, comprising:
(a) receiving an AI-interpreted command that requires database modification;
(b) evaluating the modification risk based on action type, affected record sensitivity, and potential business impact;
(c) determining whether confirmation is required based on the evaluated risk and user trust profile;
(d) when confirmation is required, generating a confirmation card displaying the proposed action, affected records, and predicted consequences;
(e) receiving user confirmation through button interaction or natural language voice response;
(f) verifying voice confirmations using natural language understanding to distinguish affirmative responses;
(g) executing the confirmed action and logging the confirmation to an audit trail;
(h) suggesting relevant follow-up actions based on the completed operation.`,
    dependentClaims: [
      "The method of claim 1, wherein risk evaluation classifies create operations as lower risk than delete operations.",
      "The method of claim 1, wherein user trust profile is established based on historical confirmation accuracy.",
      "The method of claim 1, wherein the audit trail includes user identity, timestamp, action details, and confirmation method."
    ],
    usptoCpc: ['G06F21/60', 'G06Q10/06', 'H04L9/32'],
    patentabilityFactors: {
      novelty: 8.5,
      nonObviousness: 8.5,
      utility: 9.0,
      enablement: 9.0
    },
    riskAssessment: {
      level: 'medium',
      concerns: ["Confirmation workflows are common; need to emphasize AI-action context"]
    }
  },
  {
    id: 5,
    name: "GPS-Verified Workforce Time Tracking with Geofence Validation",
    tier: 2,
    patentabilityScore: 8.5,
    category: 'mobile',
    sourceFiles: [
      'src/pages/mobile/MobileClockIn.tsx',
      'src/hooks/useMobileClockIn.ts'
    ],
    noveltyAnalysis: `This system combines GPS location capture with geofence validation for workforce time tracking. Clock-in and clock-out operations are validated against predefined job site boundaries, with photo verification and offline queue support for areas with limited connectivity.`,
    technicalDifferentiators: [
      "GPS coordinate capture at clock events",
      "Polygon geofence validation for job sites",
      "Photo verification with GPS stamp",
      "Offline queue with conflict resolution",
      "Voice-activated clock in/out commands",
      "Real-time location dashboard for supervisors"
    ],
    priorArt: [
      { title: "Connecteam/TSheets", limitation: "No voice integration" },
      { title: "GPS time tracking apps", limitation: "No geofence validation or voice" }
    ],
    independentClaim: `A computer-implemented method for GPS-verified workforce time tracking, comprising:
(a) receiving a clock-in or clock-out request from a mobile device, the request initiated through voice command or touch interface;
(b) capturing GPS coordinates from the mobile device at the time of the request;
(c) retrieving geofence polygon definitions for job sites assigned to the user;
(d) validating that the captured GPS coordinates fall within at least one assigned job site geofence;
(e) when validation succeeds, recording a time entry with GPS coordinates, timestamp, and job site identifier;
(f) when validation fails, generating an alert indicating out-of-bounds clock attempt;
(g) optionally capturing a photo with embedded GPS metadata for verification;
(h) synchronizing time entries to a central database when network connectivity is available.`,
    dependentClaims: [
      "The method of claim 1, wherein offline operation queues time entries during network unavailability for later synchronization.",
      "The method of claim 1, further comprising displaying a real-time workforce dashboard showing employee locations and clock status.",
      "The method of claim 1, wherein geofence validation includes configurable tolerance distance."
    ],
    usptoCpc: ['G06Q10/1093', 'G01S19/42', 'H04W4/02'],
    patentabilityFactors: {
      novelty: 8.0,
      nonObviousness: 8.5,
      utility: 9.5,
      enablement: 9.0
    },
    riskAssessment: {
      level: 'medium',
      concerns: ["GPS time tracking is established; voice + geofence combination adds novelty"]
    }
  },
  {
    id: 6,
    name: "Visual Response Card System with Dynamic Type Selection",
    tier: 2,
    patentabilityScore: 8.4,
    category: 'voice-ai',
    sourceFiles: [
      'src/components/voice/ResponseCards.tsx',
      'src/components/voice/cards/'
    ],
    noveltyAnalysis: `This system generates visual response cards as the primary feedback mechanism for voice commands. Unlike text-only voice assistant responses, this system selects from multiple card templates (project, attendance, invoice, schedule, statistics) based on the query result type and renders interactive elements for follow-up actions.`,
    technicalDifferentiators: [
      "Multiple card type templates",
      "Automatic type selection from query results",
      "Interactive action elements within cards",
      "Chart/graph rendering for statistics cards",
      "Navigation links for deep diving",
      "Combined audio + visual response"
    ],
    priorArt: [
      { title: "Alexa Cards", limitation: "Limited template variety; no construction context" },
      { title: "Dashboard widgets", limitation: "Static; not voice-triggered" }
    ],
    independentClaim: `A computer-implemented method for generating visual response cards from voice commands, comprising:
(a) executing a voice-triggered tool against a construction operations database;
(b) analyzing the tool execution result to determine the appropriate card type from a plurality of card types including project cards, attendance cards, invoice cards, schedule cards, and statistics cards;
(c) selecting a card template corresponding to the determined card type;
(d) populating the card template with data from the tool execution result;
(e) adding interactive elements to the card including action buttons and navigation links;
(f) rendering the populated card on the user interface;
(g) synthesizing an audio summary of the card content.`,
    dependentClaims: [
      "The method of claim 1, wherein statistics cards include chart visualizations of aggregated data.",
      "The method of claim 1, wherein cards include navigation links enabling deep-dive to related records.",
      "The method of claim 1, wherein card templates are responsive and adapt to device screen size."
    ],
    usptoCpc: ['G06F3/0482', 'G06T11/20', 'G10L15/22'],
    patentabilityFactors: {
      novelty: 8.0,
      nonObviousness: 8.5,
      utility: 9.0,
      enablement: 9.0
    },
    riskAssessment: {
      level: 'medium',
      concerns: ["UI card patterns are common; voice-trigger + construction context adds novelty"]
    }
  },
  {
    id: 7,
    name: "Multi-Source Confidence Aggregation for AI Suggestions",
    tier: 2,
    patentabilityScore: 8.3,
    category: 'learning',
    sourceFiles: [
      'src/utils/roofCalculations.ts',
      'src/hooks/useAISuggestions.ts'
    ],
    noveltyAnalysis: `This system aggregates confidence scores from multiple sources (AI model output, geometric validation, historical accuracy, user corrections) to produce a composite confidence score for AI suggestions. This multi-factor approach provides more reliable confidence indicators than single-source scores.`,
    technicalDifferentiators: [
      "AI model confidence score",
      "Geometric consistency validation",
      "Historical accuracy weighting",
      "User correction factor adjustment",
      "Weighted aggregation formula",
      "Confidence threshold for auto-accept"
    ],
    priorArt: [
      { title: "Model confidence scores", limitation: "Single source; no aggregation" },
      { title: "Ensemble methods", limitation: "Multiple models; not multi-factor single model" }
    ],
    independentClaim: `A computer-implemented method for multi-source confidence aggregation, comprising:
(a) receiving an AI-generated suggestion with a model confidence score;
(b) performing geometric validation on the suggestion to generate a geometric consistency score;
(c) retrieving historical accuracy data for similar suggestions to generate a historical accuracy score;
(d) calculating a user correction factor based on previous correction patterns;
(e) aggregating the model confidence score, geometric consistency score, historical accuracy score, and user correction factor using a weighted formula to produce a composite confidence score;
(f) presenting the composite confidence score with the suggestion to enable informed user decision-making.`,
    dependentClaims: [
      "The method of claim 1, wherein suggestions with composite confidence above a threshold are auto-accepted.",
      "The method of claim 1, wherein weighting factors are adjusted based on validation outcomes."
    ],
    usptoCpc: ['G06N20/00', 'G06F18/24', 'G06Q10/063'],
    patentabilityFactors: {
      novelty: 8.0,
      nonObviousness: 8.5,
      utility: 8.5,
      enablement: 8.5
    },
    riskAssessment: {
      level: 'medium',
      concerns: ["Confidence aggregation is known; specific factors and construction context add novelty"]
    }
  },

  // ============== TIER 3: GOOD PATENTABILITY (Score 7.0-7.9) ==============
  {
    id: 8,
    name: "Phonetic Wake Word Matching with Fuzzy Recognition",
    tier: 3,
    patentabilityScore: 7.8,
    category: 'voice-ai',
    sourceFiles: [
      'supabase/functions/fasto-realtime-token/index.ts'
    ],
    noveltyAnalysis: `This system uses fuzzy phonetic matching to recognize wake word variants spoken with different accents or in noisy environments. Unlike exact-match wake word detection, this approach accepts phonetically similar variants.`,
    technicalDifferentiators: [
      "Phonetic encoding of wake word variants",
      "Fuzzy string matching for recognition",
      "Accent-tolerant variant library",
      "Noise-robust detection algorithms"
    ],
    priorArt: [
      { title: "Alexa wake word detection", limitation: "Proprietary; likely uses similar techniques" }
    ],
    independentClaim: `A method for wake word detection using fuzzy phonetic matching, comprising:
(a) maintaining a library of phonetic encodings for wake word variants;
(b) receiving audio input and performing speech-to-text transcription;
(c) generating phonetic encoding of recognized words;
(d) comparing phonetic encodings against the variant library using fuzzy matching;
(e) activating voice command mode when a match is found within a similarity threshold.`,
    dependentClaims: [
      "The method of claim 1, wherein the variant library includes accent-specific pronunciations."
    ],
    usptoCpc: ['G10L15/08', 'G10L15/22'],
    patentabilityFactors: {
      novelty: 7.5,
      nonObviousness: 7.5,
      utility: 8.5,
      enablement: 8.5
    },
    riskAssessment: {
      level: 'high',
      concerns: ["Wake word detection is heavily patented by major tech companies"]
    }
  },
  {
    id: 9,
    name: "Failure Detection and Categorization Pipeline",
    tier: 3,
    patentabilityScore: 7.6,
    category: 'learning',
    sourceFiles: [
      'supabase/functions/agent-hub/index.ts'
    ],
    noveltyAnalysis: `This system detects and categorizes voice command failures using phrase pattern matching and LLM analysis, logging failure types for system improvement.`,
    technicalDifferentiators: [
      "Failure phrase pattern matching",
      "Category classification of failures",
      "Feedback loop for model improvement",
      "Failure rate tracking by category"
    ],
    priorArt: [
      { title: "Error logging systems", limitation: "Generic; not voice-command specific" }
    ],
    independentClaim: `A method for voice command failure detection and categorization, comprising:
(a) monitoring voice command execution outcomes;
(b) detecting failure indicators through phrase pattern matching and execution status;
(c) categorizing detected failures into types including intent misunderstanding, entity extraction failure, and tool execution error;
(d) logging categorized failures with contextual metadata;
(e) aggregating failure data to identify improvement opportunities.`,
    dependentClaims: [
      "The method of claim 1, wherein failure categories trigger specific remediation workflows."
    ],
    usptoCpc: ['G06F11/07', 'G10L15/22'],
    patentabilityFactors: {
      novelty: 7.5,
      nonObviousness: 7.5,
      utility: 8.0,
      enablement: 8.0
    },
    riskAssessment: {
      level: 'medium',
      concerns: ["Error detection is general; voice-command specificity needed"]
    }
  },
  {
    id: 10,
    name: "CRM Workflow Progress Visualization with Phase Tracking",
    tier: 3,
    patentabilityScore: 7.5,
    category: 'workflow',
    sourceFiles: [
      'src/components/crm/CRMProgressBoard.tsx',
      'src/components/crm/CRMWorkflowVisualization.tsx'
    ],
    noveltyAnalysis: `This system provides visual progress tracking through customizable workflow phases for construction CRM, with step-level granularity and document attachment at each step.`,
    technicalDifferentiators: [
      "Multi-phase workflow definition",
      "Step-level progress tracking",
      "Document attachment per step",
      "Visual progress indicators",
      "Automated phase transitions"
    ],
    priorArt: [
      { title: "Kanban boards", limitation: "Generic; not construction-specific phases" },
      { title: "CRM pipelines", limitation: "Sales-focused; not project-delivery focused" }
    ],
    independentClaim: `A system for construction CRM workflow progress visualization, comprising:
(a) a workflow definition module storing phase and step configurations for construction project delivery;
(b) a progress tracking module recording step completion status and timestamps;
(c) a document management module enabling attachment of documents to specific workflow steps;
(d) a visualization module rendering progress through phases with step-level indicators.`,
    dependentClaims: [
      "The system of claim 1, wherein phases include lead capture, estimation, contracting, production, and completion."
    ],
    usptoCpc: ['G06Q10/06', 'G06Q30/02'],
    patentabilityFactors: {
      novelty: 7.0,
      nonObviousness: 7.5,
      utility: 8.5,
      enablement: 8.5
    },
    riskAssessment: {
      level: 'medium',
      concerns: ["Workflow visualization is common; construction-specific phases add some novelty"]
    }
  },

  // ============== TIER 4: MODERATE PATENTABILITY (Score 6.0-6.9) ==============
  {
    id: 11,
    name: "PDF Proposal Generation with Photo Integration",
    tier: 4,
    patentabilityScore: 6.8,
    category: 'integration',
    sourceFiles: [
      'src/hooks/useContractPdf.tsx',
      'src/components/pdf/ProposalPDF.tsx'
    ],
    noveltyAnalysis: `This system generates PDF proposals with automatic photo integration from the estimation workflow, including company branding and electronic signature capability.`,
    technicalDifferentiators: [
      "Automatic photo selection from workflow",
      "GPS-tagged photo embedding",
      "Electronic signature integration",
      "Template-based branding"
    ],
    priorArt: [
      { title: "PDF generation libraries", limitation: "Generic document generation" },
      { title: "Proposal software", limitation: "Manual photo selection" }
    ],
    independentClaim: `A method for generating construction proposals with automatic photo integration, comprising:
(a) retrieving estimation data from a workflow session;
(b) automatically selecting relevant photos captured during the estimation workflow;
(c) embedding selected photos with GPS metadata in a proposal document template;
(d) generating a PDF document with company branding, measurements, pricing, and photos;
(e) enabling electronic signature capture on the generated proposal.`,
    dependentClaims: [
      "The method of claim 1, wherein photo selection prioritizes photos with highest quality scores."
    ],
    usptoCpc: ['G06F40/186', 'G06Q30/02'],
    patentabilityFactors: {
      novelty: 6.5,
      nonObviousness: 7.0,
      utility: 8.0,
      enablement: 8.5
    },
    riskAssessment: {
      level: 'high',
      concerns: ["PDF generation and proposal software are well-established"]
    }
  },
  {
    id: 12,
    name: "Real-Time Voice Activity Detection over WebRTC",
    tier: 4,
    patentabilityScore: 6.5,
    category: 'voice-ai',
    sourceFiles: [
      'supabase/functions/fasto-realtime-token/index.ts'
    ],
    noveltyAnalysis: `This implementation uses server-side VAD over WebRTC for efficient bandwidth utilization, but VAD itself is well-established technology.`,
    technicalDifferentiators: [
      "Server-side VAD processing",
      "WebRTC streaming integration",
      "Bandwidth optimization",
      "Speech segment isolation"
    ],
    priorArt: [
      { title: "WebRTC voice applications", limitation: "Common architecture pattern" }
    ],
    independentClaim: `A method for bandwidth-efficient voice command processing, comprising:
(a) establishing a WebRTC audio stream from a client device to a server;
(b) performing server-side voice activity detection on the incoming audio stream;
(c) processing only speech-containing segments for transcription;
(d) returning transcription results through the WebRTC data channel.`,
    dependentClaims: [],
    usptoCpc: ['H04M3/56', 'G10L25/78'],
    patentabilityFactors: {
      novelty: 6.0,
      nonObviousness: 6.5,
      utility: 8.0,
      enablement: 8.5
    },
    riskAssessment: {
      level: 'high',
      concerns: ["VAD and WebRTC are well-established; limited novel combination"]
    }
  }
];

// Summary statistics for UI display
export const patentSummary = {
  totalFeatures: patentableFeatures.length,
  byTier: {
    tier1: patentableFeatures.filter(f => f.tier === 1).length,
    tier2: patentableFeatures.filter(f => f.tier === 2).length,
    tier3: patentableFeatures.filter(f => f.tier === 3).length,
    tier4: patentableFeatures.filter(f => f.tier === 4).length
  },
  byCategory: {
    'voice-ai': patentableFeatures.filter(f => f.category === 'voice-ai').length,
    'computer-vision': patentableFeatures.filter(f => f.category === 'computer-vision').length,
    'workflow': patentableFeatures.filter(f => f.category === 'workflow').length,
    'mobile': patentableFeatures.filter(f => f.category === 'mobile').length,
    'learning': patentableFeatures.filter(f => f.category === 'learning').length,
    'integration': patentableFeatures.filter(f => f.category === 'integration').length
  },
  averageScore: patentableFeatures.reduce((sum, f) => sum + f.patentabilityScore, 0) / patentableFeatures.length,
  topRecommendations: [
    "File provisional for Tier 1 features immediately (Agentic Voice OS, Hybrid Roof Analysis, Self-Improving AI)",
    "Bundle Tier 2 features in secondary filings within 6 months",
    "Conduct prior art search for Tier 3-4 features before investing in applications"
  ]
};

// Filing strategy recommendations
export const filingStrategy = {
  priority1: {
    title: "Immediate Provisional Filing (Within 30 Days)",
    features: [1, 2, 3],
    rationale: "Highest novelty and business value. Establishes priority date for core innovations.",
    estimatedCost: "$3,000-5,000 per provisional"
  },
  priority2: {
    title: "Secondary Filing (Within 6 Months)",
    features: [4, 5, 6, 7],
    rationale: "Strong patentability with construction-specific differentiators.",
    estimatedCost: "$2,500-4,000 per provisional"
  },
  priority3: {
    title: "Evaluate and Decide (Within 12 Months)",
    features: [8, 9, 10, 11, 12],
    rationale: "Requires additional prior art research. Consider trade secret protection as alternative.",
    estimatedCost: "$1,500-2,500 per provisional + prior art search"
  }
};
