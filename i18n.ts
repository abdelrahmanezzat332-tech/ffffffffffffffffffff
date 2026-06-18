export type Language = "en" | "ar";

export type ClientStatus =
  | "New Lead"
  | "Contacted"
  | "Discovery Scheduled"
  | "Diagnosis Pending"
  | "Proposal Sent"
  | "Approved"
  | "Active Client"
  | "Managed Monthly"
  | "On Hold"
  | "Closed"
  | "Lost";

export type ProjectStatus =
  | "Draft"
  | "Diagnosis"
  | "Scope Review"
  | "Proposal"
  | "Approved"
  | "In Progress"
  | "Waiting Client"
  | "Internal Review"
  | "Ready for Delivery"
  | "Delivered"
  | "Managed Monthly"
  | "Paused"
  | "Closed";

export type PhaseStatus = "Not Started" | "In Progress" | "Waiting Client" | "Internal Review" | "Approved" | "Done";
export type TaskStatus = "Backlog" | "To Do" | "Doing" | "Waiting Client" | "Review" | "Done" | "Cancelled";
export type DeliverableStatus = "Not Started" | "Draft" | "Internal Review" | "Sent to Client" | "Approved" | "Needs Revision" | "Final";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type ManagedStatus = "Active" | "Waiting Client" | "Under Review" | "Updates Done" | "Monthly Report Sent" | "Paused";
export type DocumentStatus = "Not Started" | "Draft" | "Internal Review" | "Sent to Client" | "Needs Revision" | "Approved" | "Final";
export type DocumentType = "Client Service Brief" | "Input Files / Links" | "Master Execution Plan" | "Service Layer Plan" | "Monthly Review Report";
export type InputGroup = "Company Information" | "Business Links" | "Client Materials" | "Project Notes";
export type InputStatus = "Missing" | "Requested" | "Received" | "Reviewed" | "Not Needed";
export type MonthlyCycleStatus = "Review" | "Prioritize" | "Improve" | "Report" | "Plan Next";
export type RiskSeverity = "Low" | "Medium" | "High";
export type RiskStatus = "Open" | "Watching" | "Resolved";

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  role: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  source: string;
  status: ClientStatus;
  notes: string;
  createdAt: string;
  lastContactAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  whenToUse: string;
  outputs: string[];
  defaultPhases: string[];
  defaultDeliverables: string[];
  defaultTasks: string[];
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  selectedServiceIds: string[];
  status: ProjectStatus;
  priority: Priority;
  owner: string;
  currentPhase: string;
  nextAction: string;
  nextActionOwner: string;
  nextActionDueDate: string;
  nextActionStatus: TaskStatus;
  servicePath: "Full Business Operating System" | "Specific Service Layers";
  problem: string;
  goal: string;
  scope: string;
  outOfScope: string;
  assumptions: string;
  successIndicators: string;
  internalNotes: string;
  planSummary: string;
  risks: string;
  managedSupport: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  status: PhaseStatus;
  owner: string;
  approvalGate: string;
}

export interface Task {
  id: string;
  projectId: string;
  phaseId: string;
  title: string;
  owner: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  relatedService: string;
  notes: string;
}

export interface Deliverable {
  id: string;
  projectId: string;
  title: string;
  type: string;
  serviceLayer: string;
  status: DeliverableStatus;
  link: string;
  notes: string;
}

export interface FileLink {
  id: string;
  projectId: string;
  title: string;
  category: string;
  type: string;
  url: string;
  note: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  projectId: string;
  date: string;
  attendees: string;
  summary: string;
  decisions: string;
  actionItems: string;
  nextMeeting: string;
}

export interface MonthlyCycle {
  id: string;
  clientId: string;
  projectId: string;
  month: string;
  status: ManagedStatus | MonthlyCycleStatus;
  goals: string;
  updates: string;
  issues: string;
  backlog: string;
  reportLink: string;
  nextPriorities: string;
  nextReviewDate: string;
}

export interface Activity {
  id: string;
  projectId: string;
  type: string;
  message: string;
  createdAt: string;
  owner?: string;
  section?: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  type: DocumentType;
  relatedServiceId?: string;
  status: DocumentStatus;
  link: string;
  linkType: string;
  owner: string;
  notes: string;
  updatedAt: string;
}

export interface InputChecklistItem {
  id: string;
  projectId: string;
  group: InputGroup;
  title: string;
  status: InputStatus;
  link: string;
  note: string;
}

export interface ServiceLayerPlan {
  id: string;
  projectId: string;
  serviceId: string;
  objective: string;
  included: string;
  executionSteps: string;
  requiredInputs: string;
  expectedOutputs: string;
  status: DocumentStatus;
  documentLink: string;
}

export interface RiskItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  owner: string;
  status: RiskStatus;
  mitigation: string;
  dueDate: string;
}

export interface AppData {
  clients: Client[];
  services: Service[];
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
  deliverables: Deliverable[];
  fileLinks: FileLink[];
  documents: ProjectDocument[];
  inputChecklist: InputChecklistItem[];
  serviceLayerPlans: ServiceLayerPlan[];
  risks: RiskItem[];
  meetings: Meeting[];
  monthlyCycles: MonthlyCycle[];
  activities: Activity[];
  teamMembers: string[];
}

export const defaultTeamMembers = ["Amir", "Partner"];

export const serviceCatalog: Service[] = [
  {
    id: "full-system",
    name: "Full Business Operating System",
    description: "Complete support for clients who need AURA to shape the full operating system.",
    whenToUse: "Use when the client needs diagnosis, workflows, dashboards, tools, automation, growth, delivery, and ongoing improvement.",
    outputs: ["Diagnosis", "Operating map", "Dashboards", "Internal tools", "Automations", "Growth system", "Handover plan"],
    defaultPhases: ["Setup & Intake", "Diagnosis & Scope Lock", "Operating Design", "Build & Implementation", "Testing, Review & Training", "Delivery & Handover"],
    defaultDeliverables: ["Diagnosis report", "Operating system blueprint", "Delivery checklist", "Training notes"],
    defaultTasks: ["Confirm full system path", "Map all active workflows", "Define system ownership", "Prepare end-to-end roadmap"]
  },
  {
    id: "workflow",
    name: "Workflow & Operations Design",
    description: "The core transformation layer for how work moves, who owns it, and where decisions happen.",
    whenToUse: "Use when the business is active but work is unclear, duplicated, manual, or hard to manage.",
    outputs: ["Current workflow map", "Bottleneck list", "Role map", "Operating recommendations"],
    defaultPhases: ["Setup & Intake", "Diagnosis & Scope Lock", "Operating Design", "Testing, Review & Training", "Delivery & Handover"],
    defaultDeliverables: ["Workflow map", "Responsibility matrix", "Operations recommendations"],
    defaultTasks: ["Map current workflow", "Identify bottlenecks", "Define responsibilities", "Create operating map", "Prepare workflow recommendations"]
  },
  {
    id: "dashboards",
    name: "Business Systems & Dashboards",
    description: "Executive and team dashboards for pipelines, projects, maintenance, reporting, and decisions.",
    whenToUse: "Use when the client needs visibility across operations, performance, or delivery.",
    outputs: ["KPI list", "Data source map", "Dashboard structure", "Reporting cadence"],
    defaultPhases: ["Setup & Intake", "Diagnosis & Scope Lock", "Build & Implementation", "Testing, Review & Training", "Delivery & Handover"],
    defaultDeliverables: ["Dashboard wireframe", "Dashboard link", "Reporting guide"],
    defaultTasks: ["Define KPIs", "Identify data sources", "Design dashboard structure", "Build dashboard views", "Review with internal team"]
  },
  {
    id: "software",
    name: "Internal Software & Tools",
    description: "Lightweight custom tools such as CRMs, quotation flows, forms, reports, exports, and approvals.",
    whenToUse: "Use when off-the-shelf tools do not fit a repeated internal process.",
    outputs: ["Requirements", "Screen map", "Data model", "Prototype", "Tested user flow"],
    defaultPhases: ["Setup & Intake", "Diagnosis & Scope Lock", "Operating Design", "Build & Implementation", "Testing, Review & Training", "Delivery & Handover"],
    defaultDeliverables: ["Tool requirements", "Prototype", "Final tool link", "Handover notes"],
    defaultTasks: ["Define tool requirements", "Create screen map", "Define data model", "Build prototype", "Test user flow"]
  },
  {
    id: "automation",
    name: "Automation & AI Agents",
    description: "Automations, alerts, reports, follow-up messages, and AI agents for insight or opportunities.",
    whenToUse: "Use when repeatable work can be triggered, routed, reported, or summarized automatically.",
    outputs: ["Trigger map", "Action map", "Test workflow", "Alert/report logic"],
    defaultPhases: ["Setup & Intake", "Diagnosis & Scope Lock", "Build & Implementation", "Testing, Review & Training", "Delivery & Handover"],
    defaultDeliverables: ["Automation map", "Test report", "Automation links"],
    defaultTasks: ["Define triggers", "Define actions", "Build automation map", "Create test workflow", "Test alerts and reports"]
  },
  {
    id: "marketing",
    name: "Marketing & Growth System",
    description: "Positioning, content strategy, case studies, campaigns, lead tracking, and marketing dashboards.",
    whenToUse: "Use when growth needs a system, not disconnected posts or campaigns.",
    outputs: ["Positioning", "Content pillars", "Campaign plan", "Lead tracking", "Marketing dashboard"],
    defaultPhases: ["Setup & Intake", "Diagnosis & Scope Lock", "Operating Design", "Build & Implementation", "Delivery & Handover"],
    defaultDeliverables: ["Positioning map", "Campaign plan", "Marketing dashboard"],
    defaultTasks: ["Define positioning", "Define content pillars", "Create campaign plan", "Define lead tracking", "Prepare marketing dashboard"]
  },
  {
    id: "startup",
    name: "Startup & Business Structuring",
    description: "Offer maps, business models, launch roadmaps, and operating checklists for early teams.",
    whenToUse: "Use when the client is shaping a new offer, operation, or business model.",
    outputs: ["Offer map", "Business model", "Launch roadmap", "Operating checklist"],
    defaultPhases: ["Setup & Intake", "Diagnosis & Scope Lock", "Operating Design", "Delivery & Handover"],
    defaultDeliverables: ["Offer map", "Launch roadmap", "Operating checklist"],
    defaultTasks: ["Clarify offer", "Map launch roadmap", "Define operating checklist", "Prepare structuring recommendations"]
  },
  {
    id: "managed",
    name: "Managed Systems Partner",
    description: "Monthly support after delivery where AURA improves systems, workflows, automations, and growth.",
    whenToUse: "Use when the client needs AURA to stay responsible for monthly system improvement.",
    outputs: ["Monthly review", "Completed improvements", "Issues solved", "Recommendations", "Next month roadmap"],
    defaultPhases: ["Managed Monthly Support"],
    defaultDeliverables: ["Monthly report", "Improvement backlog", "Next month roadmap"],
    defaultTasks: ["Create monthly review cycle", "Add improvement backlog", "Create monthly report link", "Schedule review meeting"]
  }
];

export const basePhaseNames = [
  "Setup & Intake",
  "Diagnosis & Scope Lock",
  "Operating Design",
  "Build & Implementation",
  "Testing, Review & Training",
  "Delivery & Handover"
];

export const baseTasks = [
  "Create client profile",
  "Select service layers",
  "Collect initial information",
  "Add client links and files",
  "Schedule diagnosis session",
  "Write diagnosis notes",
  "Define scope",
  "Confirm next action",
  "Prepare proposal or sprint plan"
];

export const fileCategories = [
  "Client Materials",
  "Proposal / Offer",
  "Diagnosis",
  "Workflow Maps",
  "Dashboard Links",
  "Software / Tool Links",
  "Automation Links",
  "Marketing Assets",
  "Meeting Recordings",
  "Final Delivery"
];

export const allowedLinkTypes = [
  "Google Drive",
  "Google Docs",
  "PDF link",
  "Notion",
  "Figma",
  "GitHub",
  "Vercel",
  "Dashboard link",
  "Website link",
  "Other URL"
];

export const documentStatuses: DocumentStatus[] = ["Not Started", "Draft", "Internal Review", "Sent to Client", "Needs Revision", "Approved", "Final"];

const today = new Date();
const iso = (offset = 0) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export function createSeedData(): AppData {
  const clients: Client[] = [
    {
      id: "client-pzone",
      companyName: "P.Zone International",
      contactName: "Demo Contact",
      role: "Operations Lead",
      phone: "+20 100 000 0000",
      email: "ops@pzone.example",
      website: "https://example.com",
      industry: "Training & operations",
      source: "Partner referral",
      status: "Active Client",
      notes: "Demo client for multi-service operating system support.",
      createdAt: iso(-30),
      lastContactAt: iso(-1)
    },
    {
      id: "client-interior",
      companyName: "Demo Interior Studio",
      contactName: "Mona Samir",
      role: "Founder",
      phone: "+20 111 111 1111",
      email: "mona@example.com",
      website: "https://interior.example",
      industry: "Interior design",
      source: "Inbound",
      status: "Diagnosis Pending",
      notes: "Needs cleaner quotation, approvals, and project workflow.",
      createdAt: iso(-18),
      lastContactAt: iso(-3)
    },
    {
      id: "client-startup",
      companyName: "Demo Startup Client",
      contactName: "Omar Hafez",
      role: "Co-founder",
      phone: "+20 122 222 2222",
      email: "omar@example.com",
      website: "https://startup.example",
      industry: "Startup",
      source: "Founder network",
      status: "Proposal Sent",
      notes: "Early business structuring and launch system.",
      createdAt: iso(-12),
      lastContactAt: iso(-2)
    }
  ];

  const projects: Project[] = [
    {
      id: "project-pzone",
      clientId: "client-pzone",
      name: "P.Zone Operating Growth System",
      selectedServiceIds: ["dashboards", "automation", "marketing", "managed"],
      status: "In Progress",
      priority: "High",
      owner: "Amir",
      currentPhase: "Build & Implementation",
      nextAction: "Review dashboard structure with internal team",
      nextActionOwner: "Amir",
      nextActionDueDate: iso(2),
      nextActionStatus: "Doing",
      servicePath: "Specific Service Layers",
      problem: "Teams need one clear view of pipeline, delivery, and growth work.",
      goal: "Create a practical operating dashboard with automations and monthly support.",
      scope: "Dashboards, automation map, growth tracking, and managed monthly cycle.",
      outOfScope: "Heavy file uploads and advanced permissions.",
      assumptions: "Client keeps external file storage in Drive and Notion.",
      successIndicators: "A clear dashboard, reviewed automations, and monthly support cadence.",
      internalNotes: "Keep the first delivery practical and easy to hand over.",
      planSummary: "Build the operating visibility layer first, then connect automation and monthly reporting.",
      risks: "Data ownership and source freshness need clear owners.",
      managedSupport: true,
      createdAt: iso(-24),
      updatedAt: iso(-1)
    },
    {
      id: "project-interior",
      clientId: "client-interior",
      name: "Studio Workflow & Quotation Tool",
      selectedServiceIds: ["software", "workflow"],
      status: "Diagnosis",
      priority: "Medium",
      owner: "Farah",
      currentPhase: "Diagnosis & Scope Lock",
      nextAction: "Complete diagnosis notes after client call",
      nextActionOwner: "Farah",
      nextActionDueDate: iso(1),
      nextActionStatus: "Doing",
      servicePath: "Specific Service Layers",
      problem: "Quotation and design approval steps are scattered.",
      goal: "Design a simple workflow and internal quotation tool prototype.",
      scope: "Workflow map, requirements, prototype, and handover notes.",
      outOfScope: "Accounting, inventory, and customer-facing portals.",
      assumptions: "Team will provide sample quotation files.",
      successIndicators: "Approved workflow map and usable quotation prototype.",
      internalNotes: "Diagnosis should lock approval rules before build starts.",
      planSummary: "Clarify the studio workflow, then prototype the quotation tool around the approved process.",
      risks: "Approval rules may change during build.",
      managedSupport: false,
      createdAt: iso(-15),
      updatedAt: iso(-2)
    },
    {
      id: "project-startup",
      clientId: "client-startup",
      name: "Startup Launch Structure",
      selectedServiceIds: ["startup", "marketing"],
      status: "Proposal",
      priority: "Medium",
      owner: "Amir",
      currentPhase: "Scope Review",
      nextAction: "",
      nextActionOwner: "Amir",
      nextActionDueDate: iso(0),
      nextActionStatus: "Backlog",
      servicePath: "Specific Service Layers",
      problem: "The offer and launch path need sharper structure.",
      goal: "Create a launch roadmap, offer map, and early growth system.",
      scope: "Offer map, positioning, content pillars, campaign plan.",
      outOfScope: "Product development and paid media spend.",
      assumptions: "Founders will decide on one primary offer before build.",
      successIndicators: "Clear offer map, launch checklist, and first campaign plan.",
      internalNotes: "Project is intentionally flagged because the next action is missing.",
      planSummary: "Use structuring work to make the launch plan concrete before growth execution.",
      risks: "No next action has been confirmed yet.",
      managedSupport: false,
      createdAt: iso(-10),
      updatedAt: iso(-5)
    }
  ];

  const phases: Phase[] = [
    ...basePhaseNames.map((name, index) => ({
      id: `phase-pzone-${index}`,
      projectId: "project-pzone",
      name,
      status: index < 2 ? "Done" as PhaseStatus : index === 3 ? "In Progress" as PhaseStatus : "Not Started" as PhaseStatus,
      owner: index < 3 ? "Amir" : "Farah",
      approvalGate: index === 1 ? "Scope confirmed by client" : "Internal approval"
    })),
    { id: "phase-pzone-managed", projectId: "project-pzone", name: "Managed Monthly Support", status: "Not Started", owner: "Amir", approvalGate: "Monthly support agreement" },
    ...basePhaseNames.slice(0, 5).map((name, index) => ({
      id: `phase-interior-${index}`,
      projectId: "project-interior",
      name,
      status: index === 0 ? "Done" as PhaseStatus : index === 1 ? "In Progress" as PhaseStatus : "Not Started" as PhaseStatus,
      owner: "Farah",
      approvalGate: "Client confirmation"
    })),
    ...basePhaseNames.slice(0, 4).map((name, index) => ({
      id: `phase-startup-${index}`,
      projectId: "project-startup",
      name,
      status: index === 0 ? "Approved" as PhaseStatus : index === 1 ? "Internal Review" as PhaseStatus : "Not Started" as PhaseStatus,
      owner: "Amir",
      approvalGate: "Founder approval"
    }))
  ];

  const tasks: Task[] = [
    { id: "task-1", projectId: "project-pzone", phaseId: "phase-pzone-3", title: "Build dashboard views", owner: "Farah", status: "Doing", priority: "High", dueDate: iso(1), relatedService: "Business Systems & Dashboards", notes: "Use demo data only." },
    { id: "task-2", projectId: "project-pzone", phaseId: "phase-pzone-3", title: "Test alerts and reports", owner: "Amir", status: "To Do", priority: "Medium", dueDate: iso(3), relatedService: "Automation & AI Agents", notes: "Confirm triggers before client review." },
    { id: "task-3", projectId: "project-interior", phaseId: "phase-interior-1", title: "Write diagnosis notes", owner: "Farah", status: "Doing", priority: "High", dueDate: iso(-1), relatedService: "Workflow & Operations Design", notes: "Overdue demo task." },
    { id: "task-4", projectId: "project-startup", phaseId: "phase-startup-1", title: "Confirm next action", owner: "Amir", status: "Waiting Client", priority: "High", dueDate: iso(0), relatedService: "Startup & Business Structuring", notes: "Client needs to pick offer direction." }
  ];

  const deliverables: Deliverable[] = [
    { id: "del-1", projectId: "project-pzone", title: "Dashboard structure", type: "Dashboard", serviceLayer: "Business Systems & Dashboards", status: "Internal Review", link: "https://example.com/dashboard", notes: "Demo dashboard link." },
    { id: "del-2", projectId: "project-interior", title: "Workflow map", type: "Map", serviceLayer: "Workflow & Operations Design", status: "Draft", link: "", notes: "To be reviewed internally." },
    { id: "del-3", projectId: "project-startup", title: "Launch roadmap", type: "Roadmap", serviceLayer: "Startup & Business Structuring", status: "Not Started", link: "", notes: "Pending scope approval." }
  ];

  const fileLinks: FileLink[] = [
    { id: "file-1", projectId: "project-pzone", title: "Client Drive folder", category: "Client Materials", type: "Google Drive", url: "https://drive.google.com", note: "External storage folder.", createdAt: iso(-20) },
    { id: "file-2", projectId: "project-pzone", title: "Automation map", category: "Automation Links", type: "Miro", url: "https://example.com/automation", note: "Demo map link.", createdAt: iso(-4) }
  ];

  const meetings: Meeting[] = [
    { id: "meet-1", projectId: "project-pzone", date: iso(2), attendees: "AURA, P.Zone team", summary: "Dashboard review and next sprint planning.", decisions: "Keep marketing dashboard in MVP.", actionItems: "Prepare review version.", nextMeeting: iso(9) },
    { id: "meet-2", projectId: "project-interior", date: iso(-1), attendees: "AURA, Studio founder", summary: "Diagnosis session.", decisions: "Quotation flow is the first tool priority.", actionItems: "Write diagnosis notes.", nextMeeting: iso(6) }
  ];

  const monthlyCycles: MonthlyCycle[] = [
    { id: "cycle-1", clientId: "client-pzone", projectId: "project-pzone", month: "Current Month", status: "Review", goals: "Stabilize dashboard and automation reporting.", updates: "Dashboard structure drafted.", issues: "Data source ownership is still open.", backlog: "Client health score, report automation.", reportLink: "https://example.com/report", nextPriorities: "Finish review, then schedule handover.", nextReviewDate: iso(12) }
  ];

  const activities: Activity[] = [
    { id: "act-1", projectId: "project-pzone", type: "phase changed", message: "Build & Implementation moved to Doing.", createdAt: iso(-1) },
    { id: "act-2", projectId: "project-interior", type: "meeting added", message: "Diagnosis meeting added.", createdAt: iso(-1) },
    { id: "act-3", projectId: "project-startup", type: "note added", message: "Project flagged with no next action.", createdAt: iso(-5) }
  ];

  const baseData = { clients, services: serviceCatalog, projects, phases, tasks, deliverables, fileLinks, documents: [], inputChecklist: [], serviceLayerPlans: [], risks: [], meetings, monthlyCycles, activities, teamMembers: defaultTeamMembers };
  return migrateAppData(baseData);
}

export function createEmptyData(): AppData {
  return migrateAppData({
    clients: [],
    services: serviceCatalog,
    projects: [],
    phases: [],
    tasks: [],
    deliverables: [],
    fileLinks: [],
    documents: [],
    inputChecklist: [],
    serviceLayerPlans: [],
    risks: [],
    meetings: [],
    monthlyCycles: [],
    activities: [],
    teamMembers: defaultTeamMembers
  });
}

export function generateProjectDefaults(project: Project, services: Service[]) {
  const selectedServices = services.filter((service) => project.selectedServiceIds.includes(service.id));
  const phaseNames = Array.from(new Set([...basePhaseNames, ...(project.managedSupport ? ["Managed Monthly Support"] : [])]));
  const phases = phaseNames.map<Phase>((name, index) => ({
    id: createId("phase"),
    projectId: project.id,
    name,
    status: index === 0 ? "In Progress" : "Not Started",
    owner: project.owner,
    approvalGate: name === "Diagnosis & Scope Lock" ? "Scope approved before delivery work" : "AURA internal review"
  }));
  const setupPhase = phases[0];
  const diagnosisPhase = phases[1] ?? setupPhase;
  const allTasks = Array.from(new Set([...baseTasks, ...selectedServices.flatMap((service) => service.defaultTasks)]));
  const tasks = allTasks.map<Task>((title, index) => ({
    id: createId("task"),
    projectId: project.id,
    phaseId: title.toLowerCase().includes("diagnosis") || title.toLowerCase().includes("scope") ? diagnosisPhase.id : setupPhase.id,
    title,
    owner: project.owner,
    status: index < 3 ? "To Do" : "Backlog",
    priority: index < 2 ? project.priority : "Medium",
    dueDate: iso(index + 2),
    relatedService: selectedServices[index % Math.max(selectedServices.length, 1)]?.name ?? "AURA",
    notes: "Generated from selected services."
  }));
  const deliverables = Array.from(new Set(selectedServices.flatMap((service) => service.defaultDeliverables))).map<Deliverable>((title, index) => ({
    id: createId("del"),
    projectId: project.id,
    title,
    type: title.includes("Dashboard") ? "Dashboard" : title.includes("map") || title.includes("Map") ? "Map" : "Document",
    serviceLayer: selectedServices[index % Math.max(selectedServices.length, 1)]?.name ?? "AURA",
    status: "Not Started",
    link: "",
    notes: "Generated default deliverable."
  }));
  return { phases, tasks, deliverables };
}

export function migrateAppData(input: Partial<AppData>): AppData {
  const seed = {
    clients: input.clients ?? [],
    services: input.services?.length ? input.services : serviceCatalog,
    projects: input.projects ?? [],
    phases: input.phases ?? [],
    tasks: input.tasks ?? [],
    deliverables: input.deliverables ?? [],
    fileLinks: input.fileLinks ?? [],
    documents: input.documents ?? [],
    inputChecklist: input.inputChecklist ?? [],
    serviceLayerPlans: input.serviceLayerPlans ?? [],
    risks: input.risks ?? [],
    meetings: input.meetings ?? [],
    monthlyCycles: input.monthlyCycles ?? [],
    activities: input.activities ?? [],
    teamMembers: input.teamMembers?.length ? input.teamMembers : defaultTeamMembers
  };

  const projects = seed.projects.map((project) => ({
    ...project,
    nextActionOwner: project.nextActionOwner ?? project.owner ?? "AURA Team",
    nextActionDueDate: project.nextActionDueDate ?? project.updatedAt ?? iso(),
    nextActionStatus: project.nextActionStatus ?? "To Do",
    servicePath: project.servicePath ?? (project.selectedServiceIds?.includes("full-system") ? "Full Business Operating System" : "Specific Service Layers"),
    outOfScope: project.outOfScope ?? "Advanced permissions, heavy uploads, and unrelated business areas.",
    successIndicators: project.successIndicators ?? "Clear next action, approved scope, useful deliverables, and visible progress.",
    internalNotes: project.internalNotes ?? "",
    planSummary: project.planSummary ?? `Plan around ${project.currentPhase ?? "current phase"} for ${project.name}.`
  })) as Project[];

  const next: AppData = { ...seed, projects };
  for (const project of projects) {
    ensureProjectDocuments(next, project);
    ensureProjectInputChecklist(next, project);
    ensureServiceLayerPlans(next, project);
    ensureProjectRisks(next, project);
  }
  return next;
}

export function ensureProjectDocuments(data: AppData, project: Project) {
  const hasDoc = (type: DocumentType, relatedServiceId?: string) =>
    data.documents.some((doc) => doc.projectId === project.id && doc.type === type && (relatedServiceId ? doc.relatedServiceId === relatedServiceId : !doc.relatedServiceId));

  const pushDoc = (title: string, type: DocumentType, relatedServiceId?: string) => {
    if (!hasDoc(type, relatedServiceId)) {
      data.documents.push({
        id: createId("doc"),
        projectId: project.id,
        title,
        type,
        relatedServiceId,
        status: "Not Started",
        link: "",
        linkType: "Other URL",
        owner: project.owner,
        notes: "",
        updatedAt: project.updatedAt
      });
    }
  };

  pushDoc("Client Service Brief", "Client Service Brief");
  pushDoc("Input Files / Links", "Input Files / Links");
  pushDoc("Master Execution Plan", "Master Execution Plan");
  project.selectedServiceIds.filter((id) => id !== "managed" && id !== "full-system").forEach((serviceId) => {
    const service = data.services.find((item) => item.id === serviceId);
    pushDoc(`${service?.name ?? "Service"} Plan`, "Service Layer Plan", serviceId);
  });
  if (project.managedSupport || project.selectedServiceIds.includes("managed")) {
    pushDoc("Monthly Review Report", "Monthly Review Report", "managed");
  }
}

export function ensureProjectInputChecklist(data: AppData, project: Project) {
  const templates: Array<[InputGroup, string]> = [
    ["Company Information", "company name"],
    ["Company Information", "contact person"],
    ["Company Information", "role"],
    ["Company Information", "phone"],
    ["Company Information", "email"],
    ["Company Information", "website"],
    ["Company Information", "industry"],
    ["Company Information", "team size"],
    ["Company Information", "location"],
    ["Company Information", "source"],
    ["Business Links", "website link"],
    ["Business Links", "Facebook"],
    ["Business Links", "Instagram"],
    ["Business Links", "LinkedIn"],
    ["Business Links", "YouTube"],
    ["Business Links", "existing dashboard"],
    ["Business Links", "existing CRM"],
    ["Business Links", "Google Drive"],
    ["Business Links", "Notion / Airtable / Sheets"],
    ["Business Links", "internal tools"],
    ["Client Materials", "company profile"],
    ["Client Materials", "catalog"],
    ["Client Materials", "old proposal"],
    ["Client Materials", "current reports"],
    ["Client Materials", "current workflow screenshots"],
    ["Client Materials", "marketing samples"],
    ["Client Materials", "brand assets"],
    ["Client Materials", "meeting recording"],
    ["Client Materials", "other materials"],
    ["Project Notes", "main problem"],
    ["Project Notes", "client need"],
    ["Project Notes", "initial selected services"],
    ["Project Notes", "first meeting notes"],
    ["Project Notes", "biggest opportunity"],
    ["Project Notes", "missing information"]
  ];
  for (const [group, title] of templates) {
    if (!data.inputChecklist.some((item) => item.projectId === project.id && item.group === group && item.title === title)) {
      data.inputChecklist.push({ id: createId("input"), projectId: project.id, group, title, status: "Missing", link: "", note: "" });
    }
  }
}

export function ensureServiceLayerPlans(data: AppData, project: Project) {
  for (const serviceId of project.selectedServiceIds.filter((id) => id !== "managed" && id !== "full-system")) {
    if (!data.serviceLayerPlans.some((plan) => plan.projectId === project.id && plan.serviceId === serviceId)) {
      const service = data.services.find((item) => item.id === serviceId);
      data.serviceLayerPlans.push({
        id: createId("plan"),
        projectId: project.id,
        serviceId,
        objective: `Define the objective for ${service?.name ?? "this service"}.`,
        included: service?.outputs.join(", ") ?? "",
        executionSteps: service?.defaultPhases.join(", ") ?? "",
        requiredInputs: "Client materials, links, current workflow context, and approval feedback.",
        expectedOutputs: service?.defaultDeliverables.join(", ") ?? "",
        status: "Not Started",
        documentLink: ""
      });
    }
  }
}

export function ensureProjectRisks(data: AppData, project: Project) {
  const riskText = project.risks?.trim();
  if (!riskText || riskText === "No major risk logged yet.") return;
  if (data.risks.some((risk) => risk.projectId === project.id)) return;
  data.risks.push({
    id: createId("risk"),
    projectId: project.id,
    title: riskText.length > 80 ? `${riskText.slice(0, 77)}...` : riskText,
    description: riskText,
    severity: riskText.toLowerCase().includes("no next action") ? "High" : "Medium",
    owner: project.owner,
    status: "Open",
    mitigation: project.nextAction ? "Review during next internal checkpoint." : "Define and assign the next action before project work continues.",
    dueDate: project.nextActionDueDate || project.updatedAt || iso()
  });
}
