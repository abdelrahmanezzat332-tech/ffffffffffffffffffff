import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  LinkIcon,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  UsersRound,
  Wrench
} from "lucide-react";
import {
  AppData,
  Client,
  ClientStatus,
  DocumentStatus,
  InputChecklistItem,
  Language,
  Meeting,
  MonthlyCycle,
  Priority,
  Project,
  ProjectDocument,
  ProjectStatus,
  RiskItem,
  Service,
  ServiceLayerPlan,
  Task,
  TaskStatus,
  allowedLinkTypes,
  createId,
  createEmptyData,
  createSeedData,
  documentStatuses,
  generateProjectDefaults,
  migrateAppData
} from "./data";
import { useT } from "./i18n";

type Page = "dashboard" | "clients" | "projects" | "services" | "tasks" | "support" | "settings" | "workspace";
type ModalName = "client" | "project" | "task" | "document" | "meeting" | null;
type TaskView = "all" | "my" | "today" | "overdue" | "waiting" | "review" | "high" | "done";
type WorkspaceTab = "overview" | "scope" | "services" | "documents" | "tasks" | "meetings" | "risks" | "activity" | "support";
type ProjectFilters = { status: string; client: string; service: string; owner: string; priority: string; flag: string };
type AttentionItem = { id: string; projectId: string; project: string; client: string; type: string; owner: string; dueDate: string; tone: "neutral" | "warn" | "danger" };
type Density = "compact" | "comfortable";

const DATA_KEY = "aura-command-center-data";
const LANG_KEY = "aura-command-center-language";
const DENSITY_KEY = "aura-command-center-density";
const owners = ["Amir", "Farah", "AURA Team"];
const projectStatuses: ProjectStatus[] = ["Draft", "Diagnosis", "Scope Review", "Proposal", "Approved", "In Progress", "Waiting Client", "Internal Review", "Ready for Delivery", "Delivered", "Managed Monthly", "Paused", "Closed"];
const clientStatuses: ClientStatus[] = ["New Lead", "Contacted", "Discovery Scheduled", "Diagnosis Pending", "Proposal Sent", "Approved", "Active Client", "Managed Monthly", "On Hold", "Closed", "Lost"];
const taskStatuses: TaskStatus[] = ["Backlog", "To Do", "Doing", "Waiting Client", "Review", "Done", "Cancelled"];
const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];

const navItems = [
  { id: "dashboard", label: "dashboard", icon: LayoutDashboard },
  { id: "clients", label: "clients", icon: UsersRound },
  { id: "projects", label: "projects", icon: FolderKanban },
  { id: "services", label: "services", icon: BriefcaseBusiness },
  { id: "tasks", label: "tasks", icon: ClipboardList },
  { id: "support", label: "managedSupport", icon: Wrench },
  { id: "settings", label: "settings", icon: Settings }
] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(task: Task) {
  return task.dueDate < todayIso() && task.status !== "Done" && task.status !== "Cancelled";
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function loadData() {
  try {
    const saved = localStorage.getItem(DATA_KEY);
    if (saved) return migrateAppData(JSON.parse(saved) as Partial<AppData>);
  } catch {
    localStorage.removeItem(DATA_KEY);
  }
  return createEmptyData();
}

function teamOptions(data: AppData) {
  const assigned = [
    ...data.projects.flatMap((project) => [project.owner, project.nextActionOwner]),
    ...data.phases.map((phase) => phase.owner),
    ...data.tasks.map((task) => task.owner),
    ...data.documents.map((document) => document.owner),
    ...data.risks.map((risk) => risk.owner)
  ].filter(Boolean);
  return Array.from(new Set([...(data.teamMembers?.length ? data.teamMembers : ["Amir", "Partner"]), ...assigned]));
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem(LANG_KEY) === "ar" ? "ar" : "en"));
  const [density, setDensity] = useState<Density>(() => (localStorage.getItem(DENSITY_KEY) === "comfortable" ? "comfortable" : "compact"));
  const [data, setData] = useState<AppData>(loadData);
  const [page, setPage] = useState<Page>("dashboard");
  const [returnPage, setReturnPage] = useState<Page>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(data.projects[0]?.id ?? "");
  const [selectedClientId, setSelectedClientId] = useState(data.clients[0]?.id ?? "");
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("overview");
  const [modal, setModal] = useState<ModalName>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [taskView, setTaskView] = useState<TaskView>("all");
  const [settingsJson, setSettingsJson] = useState("");
  const [projectFilters, setProjectFilters] = useState<ProjectFilters>({ status: "All", client: "All", service: "All", owner: "All", priority: "All", flag: "All" });

  const t = useT(language);
  const isRtl = language === "ar";
  const clientsById = useMemo(() => Object.fromEntries(data.clients.map((client) => [client.id, client])), [data.clients]);
  const servicesById = useMemo(() => Object.fromEntries(data.services.map((service) => [service.id, service])), [data.services]);
  const selectedProject = data.projects.find((project) => project.id === selectedProjectId) ?? data.projects[0];
  const selectedClient = data.clients.find((client) => client.id === selectedClientId) ?? data.clients[0];
  const teamMembers = useMemo(() => teamOptions(data), [data]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    localStorage.setItem(LANG_KEY, language);
  }, [language, isRtl]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }, [data]);

  const updateData = (next: AppData) => setData(migrateAppData(next));
  const loadDemoData = () => {
    const next = createSeedData();
    setData(next);
    setSelectedProjectId(next.projects[0]?.id ?? "");
    setSelectedClientId(next.clients[0]?.id ?? "");
    setPage("dashboard");
  };
  const resetWorkspace = () => {
    const next = createEmptyData();
    setData(next);
    setSelectedProjectId("");
    setSelectedClientId("");
    setPage("dashboard");
  };
  const openWorkspace = (projectId: string, from: Page = page) => {
    setSelectedProjectId(projectId);
    setReturnPage(from === "workspace" ? "projects" : from);
    setWorkspaceTab("overview");
    setPage("workspace");
  };
  const addActivity = (projectId: string, type: string, message: string, owner?: string, section?: string) => {
    setData((current) => ({ ...current, activities: [{ id: createId("act"), projectId, type, message, owner, section, createdAt: todayIso() }, ...current.activities] }));
  };

  const metrics = useMemo(() => {
    const activeClients = data.clients.filter((client) => ["Active Client", "Managed Monthly", "Approved"].includes(client.status)).length;
    return [
      { label: t("activeClients"), value: activeClients, icon: UsersRound },
      { label: t("activeProjects"), value: data.projects.filter((project) => !["Closed", "Delivered"].includes(project.status)).length, icon: FolderKanban },
      { label: t("diagnosis"), value: data.projects.filter((project) => project.status === "Diagnosis").length, icon: Search },
      { label: t("waitingClient"), value: data.projects.filter((project) => project.status === "Waiting Client").length + data.tasks.filter((task) => task.status === "Waiting Client").length, icon: CalendarDays },
      { label: t("internalReview"), value: data.documents.filter((doc) => doc.status === "Internal Review").length, icon: CheckCircle2 },
      { label: t("overdueTasks"), value: data.tasks.filter(isOverdue).length, icon: AlertTriangle },
      { label: t("supportClients"), value: data.monthlyCycles.length, icon: Wrench },
      { label: t("noNextAction"), value: data.projects.filter((project) => !project.nextAction.trim()).length, icon: AlertTriangle }
    ];
  }, [data, t]);

  const filteredProjects = data.projects.filter((project) => {
    const haystack = [project.name, clientsById[project.clientId]?.companyName, project.owner, project.status, project.nextAction].join(" ").toLowerCase();
    const flagMatch =
      projectFilters.flag === "All" ||
      (projectFilters.flag === "Waiting Client" && project.status === "Waiting Client") ||
      (projectFilters.flag === "Managed Monthly" && project.managedSupport) ||
      (projectFilters.flag === "No Next Action" && !project.nextAction.trim());
    return (
      haystack.includes(searchQuery.toLowerCase()) &&
      (projectFilters.status === "All" || project.status === projectFilters.status) &&
      (projectFilters.client === "All" || project.clientId === projectFilters.client) &&
      (projectFilters.service === "All" || project.selectedServiceIds.includes(projectFilters.service)) &&
      (projectFilters.owner === "All" || project.owner === projectFilters.owner) &&
      (projectFilters.priority === "All" || project.priority === projectFilters.priority) &&
      flagMatch
    );
  });

  const filteredTasks = data.tasks.filter((task) => {
    if (taskView === "my") return task.owner === owners[0] && task.status !== "Done";
    if (taskView === "today") return task.dueDate === todayIso() && task.status !== "Done";
    if (taskView === "overdue") return isOverdue(task);
    if (taskView === "waiting") return task.status === "Waiting Client";
    if (taskView === "review") return task.status === "Review";
    if (taskView === "high") return ["High", "Urgent"].includes(task.priority);
    if (taskView === "done") return task.status === "Done";
    return true;
  });

  const openDocumentModal = (documentId?: string) => {
    const fallback = selectedProject ? data.documents.find((doc) => doc.projectId === selectedProject.id)?.id ?? "" : "";
    setEditingDocumentId(documentId ?? fallback);
    setModal("document");
  };

  return (
    <div className="min-h-screen bg-aura-mist text-aura-ink">
      <div className={cx("flex min-h-screen", isRtl && "flex-row-reverse")}>
        <Sidebar page={page} setPage={setPage} t={t} />
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-aura-mist/95 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-aura-gold">AURA Command Center</p>
                <h1 className="text-2xl font-bold">{page === "workspace" ? t("workspace") : t(navItems.find((item) => item.id === page)?.label ?? "dashboard")}</h1>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative min-w-0 md:w-80">
                  <Search className={cx("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400", isRtl ? "right-3" : "left-3")} />
                  <input className={cx("focus-ring w-full rounded border border-slate-200 bg-white py-2 text-sm shadow-sm", isRtl ? "pr-9 pl-3" : "pl-9 pr-3")} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t("search")} />
                </div>
                <button className="focus-ring inline-flex items-center justify-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>
                  <Globe2 className="h-4 w-4" />
                  {language === "en" ? "AR" : "EN"}
                </button>
                <Button onClick={() => setModal("project")} icon={Plus}>{t("quickCreate")}</Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 lg:hidden">
              {navItems.map((item) => (
                <button key={item.id} className={cx("rounded border px-2 py-2 text-xs font-semibold", page === item.id ? "border-aura-ink bg-aura-ink text-white" : "border-slate-200 bg-white")} onClick={() => setPage(item.id)}>
                  {t(item.label)}
                </button>
              ))}
            </div>
          </header>

          <div className="px-4 py-4 lg:px-6">
            {page === "dashboard" && <ActionDashboard data={data} metrics={metrics} clientsById={clientsById} servicesById={servicesById} t={t} setModal={setModal} openWorkspace={openWorkspace} openDocumentModal={openDocumentModal} loadDemoData={loadDemoData} />}
            {page === "clients" && <ClientsPage data={data} selectedClient={selectedClient} setSelectedClientId={setSelectedClientId} setModal={setModal} clientsById={clientsById} t={t} isRtl={isRtl} openWorkspace={openWorkspace} />}
            {page === "projects" && <ProjectsPage data={data} filteredProjects={filteredProjects} projectFilters={projectFilters} setProjectFilters={setProjectFilters} setModal={setModal} clientsById={clientsById} servicesById={servicesById} teamMembers={teamMembers} t={t} openWorkspace={openWorkspace} />}
            {page === "services" && <ServicesPage data={data} t={t} />}
            {page === "tasks" && <TasksPage data={data} tasks={filteredTasks} view={taskView} setView={setTaskView} setModal={setModal} clientsById={clientsById} t={t} />}
            {page === "support" && <ManagedSupportPage data={data} clientsById={clientsById} servicesById={servicesById} t={t} openWorkspace={openWorkspace} />}
            {page === "settings" && <SettingsPage data={data} setData={updateData} settingsJson={settingsJson} setSettingsJson={setSettingsJson} language={language} setLanguage={setLanguage} density={density} setDensity={setDensity} loadDemoData={loadDemoData} resetWorkspace={resetWorkspace} t={t} />}
            {page === "workspace" && selectedProject && (
              <ProjectWorkspace
                data={data}
                setData={updateData}
                project={selectedProject}
                clientsById={clientsById}
                servicesById={servicesById}
                t={t}
                isRtl={isRtl}
                tab={workspaceTab}
                setTab={setWorkspaceTab}
                back={() => setPage(returnPage)}
                setModal={setModal}
                openDocumentModal={openDocumentModal}
                addActivity={addActivity}
              />
            )}
          </div>
        </main>
      </div>

      {modal === "client" && <ClientModal t={t} onClose={() => setModal(null)} onSave={(client) => {
        setData((current) => ({ ...current, clients: [client, ...current.clients] }));
        setSelectedClientId(client.id);
        setModal(null);
      }} />}
      {modal === "project" && <ProjectModal data={data} teamMembers={teamMembers} t={t} onClose={() => setModal(null)} onSave={(project) => {
        const defaults = generateProjectDefaults(project, data.services);
        const monthlyCycle: MonthlyCycle[] = project.managedSupport ? [{ id: createId("cycle"), clientId: project.clientId, projectId: project.id, month: "Current Month", status: "Review", goals: "Review, prioritize, improve, report, and plan next.", updates: "", issues: "", backlog: "", reportLink: "", nextPriorities: "", nextReviewDate: todayIso() }] : [];
        const next = migrateAppData({
          ...data,
          projects: [project, ...data.projects],
          phases: [...defaults.phases, ...data.phases],
          tasks: [...defaults.tasks, ...data.tasks],
          deliverables: [...defaults.deliverables, ...data.deliverables],
          monthlyCycles: [...monthlyCycle, ...data.monthlyCycles],
          activities: [{ id: createId("act"), projectId: project.id, type: "project created", message: `${project.name}: ${t("generated")}`, createdAt: todayIso() }, ...data.activities]
        });
        setData(next);
        setSelectedProjectId(project.id);
        setReturnPage("projects");
        setWorkspaceTab("documents");
        setPage("workspace");
        setModal(null);
      }} />}
      {modal === "task" && <TaskModal data={data} selectedProjectId={selectedProject?.id} teamMembers={teamMembers} t={t} onClose={() => setModal(null)} onSave={(task) => {
        setData((current) => ({ ...current, tasks: [task, ...current.tasks] }));
        addActivity(task.projectId, "task created", task.title);
        setModal(null);
      }} />}
      {modal === "meeting" && <MeetingModal data={data} selectedProjectId={selectedProject?.id} t={t} onClose={() => setModal(null)} onSave={(meeting) => {
        setData((current) => ({ ...current, meetings: [meeting, ...current.meetings] }));
        addActivity(meeting.projectId, "meeting added", meeting.summary);
        setModal(null);
      }} />}
      {modal === "document" && (
        <DocumentModal
          document={data.documents.find((doc) => doc.id === editingDocumentId)}
          t={t}
          onClose={() => setModal(null)}
          onSave={(document) => {
            setData((current) => ({ ...current, documents: current.documents.map((doc) => doc.id === document.id ? document : doc) }));
            addActivity(document.projectId, "document updated", document.title);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function Sidebar({ page, setPage, t }: { page: Page; setPage: (page: Page) => void; t: (key: string) => string }) {
  return (
    <aside className="hidden w-60 shrink-0 bg-aura-ink text-white lg:block">
      <div className="flex h-full flex-col px-4 py-5">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded bg-aura-gold text-sm font-black text-aura-ink">A</div>
          <div>
            <p className="text-lg font-bold">AURA</p>
            <p className="text-xs text-slate-300">Command Center</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id || (page === "workspace" && item.id === "projects");
            return (
              <button key={item.id} className={cx("focus-ring flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition", active ? "bg-white text-aura-ink shadow-soft" : "text-slate-300 hover:bg-white/10 hover:text-white")} onClick={() => setPage(item.id)}>
                <Icon className="h-4 w-4" />
                <span>{t(item.label)}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold">{t("supportCycle")}</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{t("monthlyFlow")}</p>
        </div>
      </div>
    </aside>
  );
}

function ActionDashboard({ data, metrics, clientsById, servicesById, t, setModal, openWorkspace, openDocumentModal, loadDemoData }: { data: AppData; metrics: Array<{ label: string; value: number; icon: typeof UsersRound }>; clientsById: Record<string, Client>; servicesById: Record<string, Service>; t: (key: string) => string; setModal: (modal: ModalName) => void; openWorkspace: (id: string, from?: Page) => void; openDocumentModal: () => void; loadDemoData: () => void }) {
  const projectById = Object.fromEntries(data.projects.map((project) => [project.id, project]));
  const attentionItems: AttentionItem[] = [
    ...data.projects.filter((project) => !project.nextAction.trim()).map((project) => ({ id: `project-${project.id}`, projectId: project.id, project: project.name, client: clientsById[project.clientId]?.companyName ?? "-", type: t("noNextAction"), owner: project.owner, dueDate: project.nextActionDueDate || "-", tone: "danger" as const })),
    ...data.tasks.filter((task) => isOverdue(task) || task.status === "Waiting Client").map((task) => {
      const project = projectById[task.projectId];
      return { id: `task-${task.id}`, projectId: task.projectId, project: project?.name ?? "-", client: clientsById[project?.clientId ?? ""]?.companyName ?? "-", type: isOverdue(task) ? t("overdue") : t("waitingClient"), owner: task.owner, dueDate: task.dueDate, tone: isOverdue(task) ? "danger" as const : "warn" as const };
    }),
    ...data.risks.filter((risk) => risk.status !== "Resolved").map((risk) => {
      const project = projectById[risk.projectId];
      return { id: `risk-${risk.id}`, projectId: risk.projectId, project: project?.name ?? "-", client: clientsById[project?.clientId ?? ""]?.companyName ?? "-", type: t("blockedRisk"), owner: risk.owner, dueDate: risk.dueDate, tone: risk.severity === "High" ? "danger" as const : "warn" as const };
    }),
    ...data.documents.filter((doc) => doc.status === "Internal Review" || doc.status === "Needs Revision").map((doc) => {
      const project = projectById[doc.projectId];
      return { id: `doc-${doc.id}`, projectId: doc.projectId, project: project?.name ?? "-", client: clientsById[project?.clientId ?? ""]?.companyName ?? "-", type: translateStatus(doc.status, t), owner: doc.owner, dueDate: doc.updatedAt, tone: doc.status === "Needs Revision" ? "danger" as const : "warn" as const };
    }),
    ...data.meetings.filter((meeting) => meeting.date >= todayIso()).map((meeting) => {
      const project = projectById[meeting.projectId];
      return { id: `meeting-${meeting.id}`, projectId: meeting.projectId, project: project?.name ?? "-", client: clientsById[project?.clientId ?? ""]?.companyName ?? "-", type: t("upcomingMeetings"), owner: meeting.attendees, dueDate: meeting.date, tone: "neutral" as const };
    })
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 10);
  const pipelineGroups: ProjectStatus[] = ["Diagnosis", "Scope Review", "In Progress", "Waiting Client", "Internal Review", "Ready for Delivery", "Delivered", "Managed Monthly"];

  if (!data.clients.length && !data.projects.length) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="w-full max-w-3xl rounded border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-aura-gold">AURA Command Center</p>
          <h2 className="mt-2 text-2xl font-bold">{t("startFirstWorkspace")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t("startFirstWorkspaceSubtitle")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button icon={UsersRound} onClick={() => setModal("client")}>{t("createClient")}</Button>
            <Button icon={FolderKanban} onClick={() => setModal("project")}>{t("createProject")}</Button>
            <Button icon={Sparkles} onClick={loadDemoData}>{t("loadDemoData")}</Button>
          </div>
          <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{t("localStorageWarning")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title={t("needsAttention")} icon={AlertTriangle}>
        <div className="overflow-x-auto thin-scrollbar rounded border border-slate-200 bg-white">
          <table className="min-w-[780px] w-full text-sm">
            <thead className="border-b border-slate-200 bg-aura-mist text-xs uppercase text-slate-500">
              <tr>{[t("project"), t("client"), t("type"), t("owner"), t("dueDate"), ""].map((heading, index) => <th key={`${heading}-${index}`} className="px-3 py-2 text-start font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {attentionItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-3 font-semibold">{item.project}</td>
                  <td className="px-3 py-3 text-slate-600">{item.client}</td>
                  <td className="px-3 py-3"><Badge tone={item.tone}>{item.type}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">{item.owner}</td>
                  <td className="px-3 py-3 text-slate-600">{item.dueDate || "-"}</td>
                  <td className="px-3 py-3"><SmallButton onClick={() => openWorkspace(item.projectId, "dashboard")}>{t("openWorkspace")}</SmallButton></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!attentionItems.length && <EmptyState text={t("emptyState")} />}
        </div>
      </Section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className={cx(metric.label === t("noNextAction") && metric.value > 0 && "border-amber-300 bg-amber-50")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold">{metric.value}</p>
                </div>
                <div className="rounded bg-aura-mist p-2 text-aura-plum"><Icon className="h-5 w-5" /></div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_.75fr]">
        <Section title={t("activeProjects")} icon={FolderKanban}>
          <div className="grid gap-3 xl:grid-cols-2">
            {data.projects.filter((project) => !["Closed", "Delivered"].includes(project.status)).map((project) => (
              <ProjectCard key={project.id} project={project} client={clientsById[project.clientId]} serviceNames={project.selectedServiceIds.map((id) => servicesById[id]?.name).filter(Boolean)} t={t} onClick={() => openWorkspace(project.id, "dashboard")} />
            ))}
          </div>
        </Section>
        <Section title={t("quickActions")} icon={Plus}>
          <div className="grid gap-2">
            <Button icon={UsersRound} onClick={() => setModal("client")}>{t("createClient")}</Button>
            <Button icon={FolderKanban} onClick={() => setModal("project")}>{t("createProject")}</Button>
            <Button icon={ClipboardList} onClick={() => setModal("task")}>{t("addTask")}</Button>
            <Button icon={MessageSquarePlus} onClick={() => setModal("meeting")}>{t("addMeeting")}</Button>
            <Button icon={FileText} onClick={openDocumentModal}>{t("addDocumentLink")}</Button>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.9fr]">
        <Section title={t("pipeline")} icon={BarChart3}>
          <div className="grid gap-3 md:grid-cols-2">
            {pipelineGroups.map((status) => {
              const projects = data.projects.filter((project) => project.status === status);
              return (
                <div key={status} className="rounded border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">{status}</p>
                    <Badge>{projects.length}</Badge>
                  </div>
                  <SimpleList items={projects.slice(0, 2).map((project) => ({ title: project.name, meta: `${clientsById[project.clientId]?.companyName} · ${project.nextAction || t("noNextAction")}` }))} empty={t("emptyState")} compact />
                </div>
              );
            })}
          </div>
        </Section>
        <Section title={t("recentActivity")} icon={Sparkles}>
          <SimpleList items={data.activities.slice(0, 8).map((activity) => ({ title: activity.message, meta: [activity.createdAt, activity.section, activity.owner, activity.type].filter(Boolean).join(" · ") }))} empty={t("emptyState")} />
        </Section>
      </div>
    </div>
  );
}

function Dashboard({ data, metrics, clientsById, servicesById, t, setModal, openWorkspace, openDocumentModal }: { data: AppData; metrics: Array<{ label: string; value: number; icon: typeof UsersRound }>; clientsById: Record<string, Client>; servicesById: Record<string, Service>; t: (key: string) => string; setModal: (modal: ModalName) => void; openWorkspace: (id: string, from?: Page) => void; openDocumentModal: () => void }) {
  const projectById = Object.fromEntries(data.projects.map((project) => [project.id, project]));
  const attentionTasks = data.tasks.filter((task) => isOverdue(task) || task.status === "Waiting Client").slice(0, 5);
  const attentionProjects = data.projects.filter((project) => !project.nextAction.trim() || ["Waiting Client", "Internal Review"].includes(project.status)).slice(0, 5);
  const reviewDocs = data.documents.filter((doc) => doc.status === "Internal Review" || doc.status === "Needs Revision").slice(0, 4);
  const attentionItems: AttentionItem[] = [
    ...data.projects
      .filter((project) => !project.nextAction.trim())
      .map((project) => ({ id: `project-${project.id}`, projectId: project.id, project: project.name, client: clientsById[project.clientId]?.companyName ?? "-", type: t("noNextAction"), owner: project.owner, dueDate: project.nextActionDueDate || "-", tone: "danger" as const })),
    ...data.tasks
      .filter((task) => isOverdue(task) || task.status === "Waiting Client")
      .map((task) => {
        const project = projectById[task.projectId];
        return { id: `task-${task.id}`, projectId: task.projectId, project: project?.name ?? "-", client: clientsById[project?.clientId ?? ""]?.companyName ?? "-", type: isOverdue(task) ? t("overdue") : t("waitingClient"), owner: task.owner, dueDate: task.dueDate, tone: isOverdue(task) ? "danger" as const : "warn" as const };
      }),
    ...data.risks
      .filter((risk) => risk.status !== "Resolved")
      .map((risk) => {
        const project = projectById[risk.projectId];
        return { id: `risk-${risk.id}`, projectId: risk.projectId, project: project?.name ?? "-", client: clientsById[project?.clientId ?? ""]?.companyName ?? "-", type: t("blockedRisk"), owner: risk.owner, dueDate: risk.dueDate, tone: risk.severity === "High" ? "danger" as const : "warn" as const };
      }),
    ...data.documents
      .filter((doc) => doc.status === "Internal Review" || doc.status === "Needs Revision")
      .map((doc) => {
        const project = projectById[doc.projectId];
        return { id: `doc-${doc.id}`, projectId: doc.projectId, project: project?.name ?? "-", client: clientsById[project?.clientId ?? ""]?.companyName ?? "-", type: translateStatus(doc.status, t), owner: doc.owner, dueDate: doc.updatedAt, tone: doc.status === "Needs Revision" ? "danger" as const : "warn" as const };
      }),
    ...data.meetings
      .filter((meeting) => meeting.date >= todayIso())
      .map((meeting) => {
        const project = projectById[meeting.projectId];
        return { id: `meeting-${meeting.id}`, projectId: meeting.projectId, project: project?.name ?? "-", client: clientsById[project?.clientId ?? ""]?.companyName ?? "-", type: t("upcomingMeetings"), owner: meeting.attendees, dueDate: meeting.date, tone: "neutral" as const };
      })
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 10);
  const pipelineGroups: ProjectStatus[] = ["Diagnosis", "Scope Review", "In Progress", "Waiting Client", "Internal Review", "Ready for Delivery", "Delivered", "Managed Monthly"];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className={cx(metric.label === t("noNextAction") && metric.value > 0 && "border-amber-300 bg-amber-50")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-bold">{metric.value}</p>
                </div>
                <div className="rounded bg-aura-mist p-2 text-aura-plum"><Icon className="h-5 w-5" /></div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_.75fr]">
        <Section title={t("needsAttention")} icon={AlertTriangle}>
          <div className="grid gap-3">
            {[...attentionProjects.map((project) => ({ id: project.id, title: project.name, meta: project.nextAction || t("noNextAction"), projectId: project.id, tone: "warn" })), ...attentionTasks.map((task) => ({ id: task.id, title: task.title, meta: `${task.dueDate} · ${task.status}`, projectId: task.projectId, tone: isOverdue(task) ? "danger" : "warn" })), ...reviewDocs.map((doc) => ({ id: doc.id, title: doc.title, meta: doc.status, projectId: doc.projectId, tone: "warn" }))].map((item) => (
              <button key={item.id} className="focus-ring flex w-full items-center justify-between rounded border border-slate-200 bg-white p-3 text-start hover:border-aura-gold" onClick={() => openWorkspace(item.projectId, "dashboard")}>
                <span>
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="block text-xs text-slate-500">{item.meta}</span>
                </span>
                <Badge tone={item.tone === "danger" ? "danger" : "warn"}>{item.tone === "danger" ? t("overdue") : t("needsAttention")}</Badge>
              </button>
            ))}
          </div>
        </Section>
        <Section title={t("quickActions")} icon={Plus}>
          <div className="grid gap-2">
            <Button icon={UsersRound} onClick={() => setModal("client")}>{t("createClient")}</Button>
            <Button icon={FolderKanban} onClick={() => setModal("project")}>{t("createProject")}</Button>
            <Button icon={ClipboardList} onClick={() => setModal("task")}>{t("addTask")}</Button>
            <Button icon={MessageSquarePlus} onClick={() => setModal("meeting")}>{t("addMeeting")}</Button>
            <Button icon={FileText} onClick={openDocumentModal}>{t("addDocumentLink")}</Button>
          </div>
        </Section>
      </div>

      <Section title={t("activeProjects")} icon={FolderKanban}>
        <div className="grid gap-3 xl:grid-cols-3">
          {data.projects.filter((project) => !["Closed", "Delivered"].includes(project.status)).map((project) => (
            <ProjectCard key={project.id} project={project} client={clientsById[project.clientId]} serviceNames={project.selectedServiceIds.map((id) => servicesById[id]?.name).filter(Boolean)} t={t} onClick={() => openWorkspace(project.id, "dashboard")} />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.9fr]">
        <Section title={t("pipeline")} icon={BarChart3}>
          <div className="grid gap-3 md:grid-cols-2">
            {pipelineGroups.map((status) => {
              const projects = data.projects.filter((project) => project.status === status);
              return (
                <div key={status} className="rounded border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">{status}</p>
                    <Badge>{projects.length}</Badge>
                  </div>
                  <SimpleList items={projects.slice(0, 2).map((project) => ({ title: project.name, meta: `${clientsById[project.clientId]?.companyName} · ${project.nextAction || t("noNextAction")}` }))} empty={t("emptyState")} compact />
                </div>
              );
            })}
          </div>
        </Section>
        <Section title={t("recentActivity")} icon={Sparkles}>
          <SimpleList items={data.activities.slice(0, 8).map((activity) => ({ title: activity.message, meta: `${activity.createdAt} · ${activity.type}` }))} empty={t("emptyState")} />
        </Section>
      </div>
    </div>
  );
}

function ClientsPage({ data, selectedClient, setSelectedClientId, setModal, clientsById, t, isRtl, openWorkspace }: { data: AppData; selectedClient: Client; setSelectedClientId: (id: string) => void; setModal: (modal: ModalName) => void; clientsById: Record<string, Client>; t: (key: string) => string; isRtl: boolean; openWorkspace: (id: string, from?: Page) => void }) {
  const relatedProjects = data.projects.filter((project) => project.clientId === selectedClient?.id);
  const lastMeeting = data.meetings.find((meeting) => relatedProjects.some((project) => project.id === meeting.projectId));
  const managed = relatedProjects.some((project) => project.managedSupport);
  const docCount = data.documents.filter((doc) => relatedProjects.some((project) => project.id === doc.projectId)).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Section title={t("clients")} icon={UsersRound} action={<Button onClick={() => setModal("client")} icon={Plus}>{t("createClient")}</Button>}>
        <div className="overflow-x-auto thin-scrollbar">
          <table className="min-w-[820px] w-full text-sm">
            <thead className="text-slate-500">
              <tr className={cx("border-b border-slate-200", isRtl && "text-right")}>
                {[t("company"), t("contact"), t("role"), t("phone"), t("email"), t("industry"), t("status"), t("lastContact")].map((heading, index) => <th key={`${heading}-${index}`} className="py-3 font-semibold text-start">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.clients.map((client) => (
                <tr key={client.id} className={cx("cursor-pointer border-b border-slate-100 hover:bg-aura-mist", selectedClient?.id === client.id && "bg-amber-50")} onClick={() => setSelectedClientId(client.id)}>
                  <td className="py-3 font-semibold">{client.companyName}</td>
                  <td>{client.contactName}</td>
                  <td>{client.role}</td>
                  <td>{client.phone}</td>
                  <td>{client.email}</td>
                  <td>{client.industry}</td>
                  <td><Badge>{client.status}</Badge></td>
                  <td>{client.lastContactAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title={t("clientProfile")} icon={ClipboardList}>
        {selectedClient && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{selectedClient.companyName}</h2>
              <p className="text-sm text-slate-500">{selectedClient.industry} · {selectedClient.source}</p>
            </div>
            <InfoGrid items={[
              [t("contact"), selectedClient.contactName],
              [t("role"), selectedClient.role],
              [t("phone"), selectedClient.phone],
              [t("email"), selectedClient.email],
              [t("website"), selectedClient.website],
              [t("status"), selectedClient.status],
              [t("documentsSummary"), `${docCount} ${t("documents")}`],
              [t("managedSupport"), managed ? t("active") : "-"],
              [t("lastMeeting"), lastMeeting ? `${lastMeeting.date}: ${lastMeeting.summary}` : "-"],
              [t("nextAction"), relatedProjects.find((project) => project.nextAction)?.nextAction || t("noNextAction")]
            ]} />
            <div>
              <p className="text-sm font-semibold">{t("projects")}</p>
              <div className="mt-2 grid gap-2">
                {relatedProjects.map((project) => (
                  <button key={project.id} className="focus-ring rounded border border-slate-200 bg-white p-3 text-start hover:border-aura-gold" onClick={() => openWorkspace(project.id, "clients")}>
                    <span className="block font-semibold">{project.name}</span>
                    <span className="block text-xs text-slate-500">{project.status} · {project.nextAction || t("noNextAction")}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function ProjectsPage({ data, filteredProjects, projectFilters, setProjectFilters, setModal, clientsById, servicesById, teamMembers, t, openWorkspace }: { data: AppData; filteredProjects: Project[]; projectFilters: ProjectFilters; setProjectFilters: (filters: ProjectFilters) => void; setModal: (modal: ModalName) => void; clientsById: Record<string, Client>; servicesById: Record<string, Service>; teamMembers: string[]; t: (key: string) => string; openWorkspace: (id: string, from?: Page) => void }) {
  return (
    <div className="space-y-6">
      <Section title={t("filters")} icon={Search} action={<Button onClick={() => setModal("project")} icon={Plus}>{t("createProject")}</Button>}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <FilterSelect label={t("status")} value={projectFilters.status} options={["All", ...projectStatuses]} onChange={(value) => setProjectFilters({ ...projectFilters, status: value })} />
          <FilterSelect label={t("client")} value={projectFilters.client} options={["All", ...data.clients.map((client) => client.id)]} optionLabels={Object.fromEntries(data.clients.map((client) => [client.id, client.companyName]))} onChange={(value) => setProjectFilters({ ...projectFilters, client: value })} />
          <FilterSelect label={t("services")} value={projectFilters.service} options={["All", ...data.services.map((service) => service.id)]} optionLabels={Object.fromEntries(data.services.map((service) => [service.id, service.name]))} onChange={(value) => setProjectFilters({ ...projectFilters, service: value })} />
          <FilterSelect label={t("owner")} value={projectFilters.owner} options={["All", ...teamMembers]} onChange={(value) => setProjectFilters({ ...projectFilters, owner: value })} />
          <FilterSelect label={t("priority")} value={projectFilters.priority} options={["All", ...priorities]} onChange={(value) => setProjectFilters({ ...projectFilters, priority: value })} />
          <FilterSelect label={t("nextAction")} value={projectFilters.flag} options={["All", "Waiting Client", "Managed Monthly", "No Next Action"]} onChange={(value) => setProjectFilters({ ...projectFilters, flag: value })} />
        </div>
      </Section>
      <Section title={t("projects")} icon={FolderKanban}>
        <div className="grid gap-3 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} client={clientsById[project.clientId]} serviceNames={project.selectedServiceIds.map((id) => servicesById[id]?.name).filter(Boolean)} t={t} onClick={() => openWorkspace(project.id, "projects")} />
          ))}
          {!filteredProjects.length && <EmptyState text={t("emptyState")} />}
        </div>
      </Section>
    </div>
  );
}

function ProjectWorkspace({ data, setData, project, clientsById, servicesById, t, isRtl, tab, setTab, back, setModal, openDocumentModal, addActivity }: { data: AppData; setData: (data: AppData) => void; project: Project; clientsById: Record<string, Client>; servicesById: Record<string, Service>; t: (key: string) => string; isRtl: boolean; tab: WorkspaceTab; setTab: (tab: WorkspaceTab) => void; back: () => void; setModal: (modal: ModalName) => void; openDocumentModal: (documentId?: string) => void; addActivity: (projectId: string, type: string, message: string, owner?: string, section?: string) => void }) {
  const client = clientsById[project.clientId];
  const phases = data.phases.filter((phase) => phase.projectId === project.id);
  const tasks = data.tasks.filter((task) => task.projectId === project.id);
  const documents = data.documents.filter((doc) => doc.projectId === project.id);
  const meetings = data.meetings.filter((meeting) => meeting.projectId === project.id);
  const activities = data.activities.filter((activity) => activity.projectId === project.id);
  const risks = data.risks.filter((risk) => risk.projectId === project.id);
  const monthlyCycle = data.monthlyCycles.find((cycle) => cycle.projectId === project.id);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const tabs: Array<[WorkspaceTab, string]> = [
    ["overview", t("overview")],
    ["scope", t("clientScope")],
    ["services", t("services")],
    ["documents", t("documents")],
    ["tasks", t("tasks")],
    ["meetings", t("meetingsDecisions")],
    ["risks", t("risksBlockers")],
    ["activity", t("activity")]
  ];
  if (project.managedSupport) tabs.push(["support", t("monthlySupport")]);

  const updateProject = (patch: Partial<Project>) => {
    setData({ ...data, projects: data.projects.map((item) => item.id === project.id ? { ...item, ...patch, updatedAt: todayIso() } : item) });
  };
  const createNextActionFromTask = (task: Task) => {
    updateProject({ nextAction: task.title, nextActionOwner: task.owner, nextActionDueDate: task.dueDate, nextActionStatus: task.status });
    addActivity(project.id, "next action updated", task.title);
  };
  const updateInputItem = (item: InputChecklistItem, patch: Partial<InputChecklistItem>) => {
    setData({ ...data, inputChecklist: data.inputChecklist.map((current) => current.id === item.id ? { ...current, ...patch } : current) });
  };
  const updatePlan = (plan: ServiceLayerPlan, patch: Partial<ServiceLayerPlan>) => {
    setData({ ...data, serviceLayerPlans: data.serviceLayerPlans.map((current) => current.id === plan.id ? { ...current, ...patch } : current) });
  };
  const markDocumentFinal = (doc: ProjectDocument) => {
    setData({ ...data, documents: data.documents.map((item) => item.id === doc.id ? { ...item, status: "Final", updatedAt: todayIso() } : item) });
    addActivity(project.id, "document final", doc.title, doc.owner, t("documents"));
  };
  const addRisk = () => {
    const risk: RiskItem = { id: createId("risk"), projectId: project.id, title: t("newRisk"), description: "", severity: "Medium", owner: project.owner, status: "Open", mitigation: "", dueDate: todayIso() };
    setData({ ...data, risks: [risk, ...data.risks] });
    addActivity(project.id, "risk added", risk.title, risk.owner, t("risksBlockers"));
  };
  const docsForPhase = (phaseName: string) => {
    const lower = phaseName.toLowerCase();
    if (lower.includes("setup")) return documents.filter((doc) => doc.type === "Client Service Brief" || doc.type === "Input Files / Links");
    if (lower.includes("diagnosis") || lower.includes("scope")) return documents.filter((doc) => doc.type === "Master Execution Plan");
    if (lower.includes("operating") || lower.includes("build")) return documents.filter((doc) => doc.type === "Service Layer Plan");
    if (lower.includes("monthly")) return documents.filter((doc) => doc.type === "Monthly Review Report");
    return [];
  };

  return (
    <div className="space-y-6">
      <button className="focus-ring inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" onClick={back}>
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </button>

      <Card className={cx("p-3", !project.nextAction && "border-amber-300 bg-amber-50")}>
        <div className="grid gap-3 xl:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>{project.status}</Badge>
              <Badge tone={project.managedSupport ? "gold" : "neutral"}>{project.managedSupport ? t("managedSupport") : project.servicePath}</Badge>
            </div>
            <h2 className="text-xl font-bold">{project.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{client?.companyName} · {project.currentPhase}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.selectedServiceIds.map((id) => servicesById[id]?.name).filter(Boolean).map((name) => <Badge key={name} tone="gold">{name}</Badge>)}
            </div>
          </div>
          <InfoGrid compact items={[[t("owner"), project.owner], [t("priority"), project.priority], [t("lastUpdate"), project.updatedAt], [t("currentPhase"), project.currentPhase]]} />
        </div>
      </Card>

      <Card className={cx(!project.nextAction && "border-red-300 bg-red-50")}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">{t("nextAction")}</p>
            <h3 className={cx("mt-1 text-xl font-bold", !project.nextAction && "text-red-700")}>{project.nextAction || t("noNextAction")}</h3>
            <p className="mt-1 text-sm text-slate-600">{project.nextActionOwner || "-"} · {project.nextActionDueDate || "-"} · {project.nextActionStatus || "-"}</p>
          </div>
          <Button icon={ClipboardList} onClick={() => setTab("tasks")}>{t("createNextActionFromTask")}</Button>
        </div>
      </Card>

      <Section title={t("projectProgress")} icon={BarChart3}>
        <div className="grid gap-3 lg:grid-cols-4">
          {phases.map((phase) => {
            const phaseTasks = tasks.filter((task) => task.phaseId === phase.id);
            const completedTasks = phaseTasks.filter((task) => task.status === "Done").length;
            const phaseDocs = docsForPhase(phase.name);
            const isCurrent = phase.name === project.currentPhase;
            return (
              <div key={phase.id} className={cx("rounded border bg-white p-3", isCurrent ? "border-aura-gold ring-2 ring-aura-gold/20" : "border-slate-200")}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{phase.name}</p>
                  <Badge tone={phase.status === "Done" ? "success" : phase.status === "Waiting Client" ? "warn" : "neutral"}>{translatePhaseStatus(phase.status, t)}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{t("owner")}: {phase.owner}</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">{completedTasks}/{phaseTasks.length} {t("tasks")} · {phaseDocs.length} {t("documents")}</p>
                <p className="mt-1 text-xs text-slate-500">{phaseTasks.length} {t("tasks")} · {phaseDocs.length} {t("documents")}</p>
                <p className="mt-1 text-xs text-slate-500">{phase.approvalGate}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="sticky top-[89px] z-10 flex flex-wrap gap-2 border-y border-slate-200 bg-aura-mist/95 py-3 backdrop-blur">
        {tabs.map(([id, label]) => <button key={id} className={cx("focus-ring rounded border px-3 py-2 text-sm font-semibold", tab === id ? "border-aura-ink bg-aura-ink text-white" : "border-slate-200 bg-white")} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      {tab === "overview" && (
        <Section title={t("overview")} icon={FolderKanban}>
          <InfoGrid items={[[t("project"), project.name], [t("client"), client?.companyName], [t("selectedServices"), project.selectedServiceIds.map((id) => servicesById[id]?.name).filter(Boolean).join(", ")], [t("currentPhase"), project.currentPhase], [t("status"), project.status], [t("priority"), project.priority], [t("owner"), project.owner], [t("nextAction"), project.nextAction || t("noNextAction")]]} />
        </Section>
      )}

      {tab === "scope" && (
        <Section title={t("clientScope")} icon={UsersRound} action={<SmallButton onClick={() => setIsEditingScope(!isEditingScope)}>{isEditingScope ? t("done") : t("editScope")}</SmallButton>}>
          <div className="grid gap-3 xl:grid-cols-2">
            <Card>
              <h3 className="mb-3 font-bold">{t("clientInfo")}</h3>
              <InfoGrid compact items={[[t("company"), client?.companyName], [t("contact"), client?.contactName], [t("role"), client?.role], [t("phone"), client?.phone], [t("email"), client?.email], [t("website"), client?.website], [t("industry"), client?.industry]]} />
            </Card>
            <Card>
              <h3 className="mb-3 font-bold">{t("problemGoal")}</h3>
              <InfoGrid compact items={[[t("problem"), project.problem], [t("goal"), project.goal], [t("clientNeed"), project.planSummary], [t("biggestOpportunity"), project.successIndicators]]} />
            </Card>
            <Card>
              <h3 className="mb-3 font-bold">{t("scope")}</h3>
              <InfoGrid compact items={[[t("whatWeBuild"), project.scope], [t("whatWeDoNotBuild"), project.outOfScope], [t("servicePath"), project.servicePath], [t("assumptions"), project.assumptions]]} />
            </Card>
            <Card>
              <h3 className="mb-3 font-bold">{t("successIndicators")}</h3>
              <InfoGrid compact items={[[t("nextAction"), project.nextAction || t("noNextAction")], [t("successIndicators"), project.successIndicators], [t("internalNotes"), project.internalNotes]]} />
            </Card>
          </div>
          {isEditingScope && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InlineEdit label={t("whatWeBuild")} value={project.scope} onSave={(value) => updateProject({ scope: value })} />
              <InlineEdit label={t("whatWeDoNotBuild")} value={project.outOfScope} onSave={(value) => updateProject({ outOfScope: value })} />
              <InlineEdit label={t("successIndicators")} value={project.successIndicators} onSave={(value) => updateProject({ successIndicators: value })} />
              <InlineEdit label={t("internalNotes")} value={project.internalNotes} onSave={(value) => updateProject({ internalNotes: value })} />
            </div>
          )}
        </Section>
      )}

      {tab === "services" && (
        <Section title={t("services")} icon={BriefcaseBusiness}>
          <div className="grid gap-3 xl:grid-cols-2">
            {data.serviceLayerPlans.filter((plan) => plan.projectId === project.id).map((plan) => {
              const service = servicesById[plan.serviceId];
              const relatedTasks = tasks.filter((task) => task.relatedService === service?.name).length;
              return (
              <Card key={plan.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold">{service?.name ?? plan.serviceId}</h3>
                  <Badge>{translateStatus(plan.status, t)}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{service?.description ?? "-"}</p>
                <InfoGrid compact items={[[t("objective"), plan.objective], [t("included"), plan.included], [t("executionSteps"), plan.executionSteps], [t("requiredInputs"), plan.requiredInputs], [t("expectedOutputs"), plan.expectedOutputs], [t("relatedTasks"), `${relatedTasks}`], [t("link"), plan.documentLink || "-"]]} />
              </Card>
            );})}
            {!data.serviceLayerPlans.filter((plan) => plan.projectId === project.id).length && <EmptyState text={t("emptyState")} />}
          </div>
        </Section>
      )}

      {tab === "documents" && (
        <CompactDocumentsSection data={data} project={project} client={client} documents={documents} servicePlans={data.serviceLayerPlans.filter((plan) => plan.projectId === project.id)} servicesById={servicesById} t={t} openDocumentModal={openDocumentModal} markDocumentFinal={markDocumentFinal} updateInputItem={updateInputItem} updatePlan={updatePlan} isRtl={isRtl} />
      )}

      {tab === "tasks" && (
        <Section title={t("tasks")} icon={ClipboardList} action={<Button icon={Plus} onClick={() => setModal("task")}>{t("addTask")}</Button>}>
          <TasksByPhase data={data} setData={setData} project={project} tasks={tasks} t={t} isRtl={isRtl} createNextActionFromTask={createNextActionFromTask} addActivity={addActivity} />
        </Section>
      )}

      {tab === "meetings" && (
        <Section title={t("meetingsDecisions")} icon={MessageSquarePlus} action={<Button icon={Plus} onClick={() => setModal("meeting")}>{t("addMeeting")}</Button>}>
          <div className="grid gap-3">
            {meetings.map((meeting) => <Card key={meeting.id}><InfoGrid items={[[t("date"), meeting.date], [t("attendees"), meeting.attendees], [t("summary"), meeting.summary], [t("decisions"), meeting.decisions], [t("actionItems"), meeting.actionItems], [t("nextMeeting"), meeting.nextMeeting]]} /></Card>)}
            {!meetings.length && <EmptyState text={t("emptyState")} />}
          </div>
        </Section>
      )}

      {tab === "risks" && <RiskPanel risks={risks} t={t} addRisk={addRisk} />}
      {tab === "activity" && <Section title={t("activity")} icon={Sparkles}><SimpleList items={activities.map((item) => ({ title: item.message, meta: `${item.createdAt} · ${item.type}` }))} empty={t("emptyState")} /></Section>}
      {tab === "support" && monthlyCycle && <MonthlySupportPanel cycle={monthlyCycle} project={project} documents={documents} t={t} openDocumentModal={openDocumentModal} />}
    </div>
  );
}

function CompactDocumentsSection({ data, project, client, documents, servicePlans, servicesById, t, openDocumentModal, markDocumentFinal, updateInputItem, updatePlan, isRtl }: { data: AppData; project: Project; client?: Client; documents: ProjectDocument[]; servicePlans: ServiceLayerPlan[]; servicesById: Record<string, Service>; t: (key: string) => string; openDocumentModal: (id?: string) => void; markDocumentFinal: (doc: ProjectDocument) => void; updateInputItem: (item: InputChecklistItem, patch: Partial<InputChecklistItem>) => void; updatePlan: (plan: ServiceLayerPlan, patch: Partial<ServiceLayerPlan>) => void; isRtl: boolean }) {
  const inputItems = data.inputChecklist.filter((item) => item.projectId === project.id);
  const businessLinks = inputItems.filter((item) => item.group === "Business Links");
  const materials = inputItems.filter((item) => item.group === "Client Materials");
  const projectNotes = inputItems.filter((item) => item.group === "Project Notes");
  const docRows = documents.map((doc) => [
    translateDocTitle(doc.title, t),
    translateDocType(doc.type, t),
    doc.relatedServiceId ? servicesById[doc.relatedServiceId]?.name ?? doc.relatedServiceId : "-",
    translateStatus(doc.status, t),
    doc.owner,
    doc.link || "-",
    doc.updatedAt,
    doc.notes || "-"
  ]);

  return (
    <div className="space-y-6">
      <Section title={t("documents")} icon={FileText}>
        <MiniTable
          headers={[t("title"), t("type"), t("relatedService"), t("status"), t("owner"), t("link"), t("lastUpdate"), t("notes"), ""]}
          rows={docRows.map((row) => [...row, ""])}
          isRtl={isRtl}
          empty={t("noRecords")}
          actions={documents.map((doc) => (
            <div className="flex flex-wrap gap-1">
              <SmallButton onClick={() => openDocumentModal(doc.id)}>{t("addEditLink")}</SmallButton>
              <SmallButton onClick={() => openDocumentModal(doc.id)}>{t("updateStatus")}</SmallButton>
              <SmallButton onClick={() => openDocumentModal(doc.id)}>{t("addNote")}</SmallButton>
              <SmallButton onClick={() => markDocumentFinal(doc)}>{t("markFinal")}</SmallButton>
            </div>
          ))}
        />
      </Section>

      <Section title={t("inputFilesLinks")} icon={LinkIcon}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <h3 className="mb-3 font-bold">{t("companyInformation")}</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {[[t("company"), client?.companyName], [t("contact"), client?.contactName], [t("role"), client?.role], [t("phone"), client?.phone], [t("email"), client?.email], [t("website"), client?.website], [t("industry"), client?.industry], [t("source"), client?.source], [t("teamSize"), "-"], [t("location"), "-"]].map(([label, value], index) => (
                <label key={`${label}-${index}`} className="text-sm">
                  <span className="mb-1 block font-semibold text-slate-600">{label}</span>
                  <input className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" value={value ?? "-"} readOnly />
                </label>
              ))}
            </div>
          </Card>
          <ChecklistCard title={t("businessLinks")} items={businessLinks} t={t} updateInputItem={updateInputItem} linkOnly />
          <ChecklistCard title={t("clientMaterials")} items={materials} t={t} updateInputItem={updateInputItem} />
          <Card>
            <h3 className="mb-3 font-bold">{t("projectNotes")}</h3>
            <div className="grid gap-3">
              {projectNotes.map((item) => (
                <label key={item.id} className="text-sm">
                  <span className="mb-1 block font-semibold text-slate-600">{item.title}</span>
                  <textarea className="focus-ring min-h-20 w-full rounded border border-slate-200 px-3 py-2" value={item.note} onChange={(event) => updateInputItem(item, { note: event.target.value })} />
                </label>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section title={t("masterExecutionPlan")} icon={FileText}>
        <Card>
          <InfoGrid items={[[t("currentSituation"), project.planSummary], [t("coreProblem"), project.problem], [t("objective"), project.goal], [t("selectedServices"), project.selectedServiceIds.map((id) => servicesById[id]?.name).filter(Boolean).join(", ")], [t("proposedSystemMap"), project.scope], [t("executionPhases"), data.phases.filter((phase) => phase.projectId === project.id).map((phase) => phase.name).join(", ")], [t("outOfScope"), project.outOfScope], [t("nextStep"), project.nextAction || t("noNextAction")]]} />
        </Card>
      </Section>

      <Section title={t("serviceLayerPlans")} icon={BriefcaseBusiness}>
        <MiniTable
          headers={[t("services"), t("objective"), t("status"), t("link"), ""]}
          rows={servicePlans.map((plan) => [servicesById[plan.serviceId]?.name ?? plan.serviceId, plan.objective, translateStatus(plan.status, t), plan.documentLink || "-", ""])}
          isRtl={isRtl}
          empty={t("emptyState")}
          actions={servicePlans.map((plan) => (
            <div className="flex flex-wrap gap-1">
              <input className="focus-ring w-40 rounded border border-slate-200 px-2 py-1 text-xs" value={plan.documentLink} onChange={(event) => updatePlan(plan, { documentLink: event.target.value })} placeholder={t("link")} />
              <select className="focus-ring rounded border border-slate-200 bg-white px-2 py-1 text-xs" value={plan.status} onChange={(event) => updatePlan(plan, { status: event.target.value as DocumentStatus })}>
                {documentStatuses.map((status) => <option key={status} value={status}>{translateStatus(status, t)}</option>)}
              </select>
            </div>
          ))}
        />
      </Section>
    </div>
  );
}

function ChecklistCard({ title, items, t, updateInputItem, linkOnly }: { title: string; items: InputChecklistItem[]; t: (key: string) => string; updateInputItem: (item: InputChecklistItem, patch: Partial<InputChecklistItem>) => void; linkOnly?: boolean }) {
  return (
    <Card>
      <h3 className="mb-3 font-bold">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{item.title}</p>
              <select className="focus-ring rounded border border-slate-200 bg-white px-2 py-1 text-xs" value={item.status} onChange={(event) => updateInputItem(item, { status: event.target.value as InputChecklistItem["status"] })}>
                {["Missing", "Requested", "Received", "Reviewed", "Not Needed"].map((status) => <option key={status} value={status}>{translateInputStatus(status, t)}</option>)}
              </select>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <input className="focus-ring rounded border border-slate-200 px-2 py-1 text-sm" value={item.link} onChange={(event) => updateInputItem(item, { link: event.target.value })} placeholder={linkOnly ? "URL" : t("link")} />
              <input className="focus-ring rounded border border-slate-200 px-2 py-1 text-sm" value={item.note} onChange={(event) => updateInputItem(item, { note: event.target.value })} placeholder={t("notes")} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DocumentsSection({ data, project, documents, servicePlans, servicesById, t, openDocumentModal, markDocumentFinal, updateInputItem, updatePlan, isRtl }: { data: AppData; project: Project; documents: ProjectDocument[]; servicePlans: ServiceLayerPlan[]; servicesById: Record<string, Service>; t: (key: string) => string; openDocumentModal: (id?: string) => void; markDocumentFinal: (doc: ProjectDocument) => void; updateInputItem: (item: InputChecklistItem, patch: Partial<InputChecklistItem>) => void; updatePlan: (plan: ServiceLayerPlan, patch: Partial<ServiceLayerPlan>) => void; isRtl: boolean }) {
  const inputItems = data.inputChecklist.filter((item) => item.projectId === project.id);
  const planDoc = documents.find((doc) => doc.type === "Master Execution Plan");
  const groups = Array.from(new Set(inputItems.map((item) => item.group)));

  return (
    <div className="space-y-6">
      <Section title={t("documents")} icon={FileText}>
        <div className="grid gap-3 xl:grid-cols-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{translateDocTitle(doc.title, t)}</h3>
                  <p className="text-sm text-slate-500">{translateDocType(doc.type, t)}{doc.relatedServiceId ? ` · ${servicesById[doc.relatedServiceId]?.name ?? doc.relatedServiceId}` : ""}</p>
                </div>
                <Badge tone={doc.status === "Final" || doc.status === "Approved" ? "success" : doc.status === "Needs Revision" ? "danger" : doc.status === "Internal Review" ? "warn" : "neutral"}>{translateStatus(doc.status, t)}</Badge>
              </div>
              <InfoGrid compact items={[[t("link"), doc.link || "-"], [t("owner"), doc.owner], [t("lastUpdate"), doc.updatedAt], [t("notes"), doc.notes || "-"]]} />
              <div className="mt-3 flex flex-wrap gap-2">
                <SmallButton onClick={() => openDocumentModal(doc.id)}>{t("addEditLink")}</SmallButton>
                <SmallButton onClick={() => openDocumentModal(doc.id)}>{t("updateStatus")}</SmallButton>
                <SmallButton onClick={() => openDocumentModal(doc.id)}>{t("addNote")}</SmallButton>
                <SmallButton onClick={() => markDocumentFinal(doc)}>{t("markFinal")}</SmallButton>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t("inputFilesLinks")} icon={LinkIcon}>
        <div className="grid gap-4 xl:grid-cols-2">
          {groups.map((group) => (
            <Card key={group}>
              <h3 className="mb-3 font-bold">{translateInputGroup(group, t)}</h3>
              <div className="space-y-2">
                {inputItems.filter((item) => item.group === group).map((item) => (
                  <div key={item.id} className="rounded border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{item.title}</p>
                      <select className="focus-ring rounded border border-slate-200 bg-white px-2 py-1 text-xs" value={item.status} onChange={(event) => updateInputItem(item, { status: event.target.value as InputChecklistItem["status"] })}>
                        {["Missing", "Requested", "Received", "Reviewed", "Not Needed"].map((status) => <option key={status} value={status}>{translateInputStatus(status, t)}</option>)}
                      </select>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <input className="focus-ring rounded border border-slate-200 px-2 py-1 text-sm" value={item.link} onChange={(event) => updateInputItem(item, { link: event.target.value })} placeholder={t("link")} />
                      <input className="focus-ring rounded border border-slate-200 px-2 py-1 text-sm" value={item.note} onChange={(event) => updateInputItem(item, { note: event.target.value })} placeholder={t("notes")} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t("masterExecutionPlan")} icon={FileText}>
        <Card>
          <InfoGrid items={[[t("currentSituation"), project.planSummary], [t("coreProblem"), project.problem], [t("objective"), project.goal], [t("selectedServices"), project.selectedServiceIds.map((id) => servicesById[id]?.name).filter(Boolean).join(", ")], [t("proposedSystemMap"), project.scope], [t("executionPhases"), data.phases.filter((phase) => phase.projectId === project.id).map((phase) => phase.name).join(", ")], [t("expectedDeliverables"), data.deliverables.filter((item) => item.projectId === project.id).map((item) => item.title).join(", ")], [t("clientResponsibilities"), project.assumptions], [t("outOfScope"), project.outOfScope], [t("nextStep"), project.nextAction || t("noNextAction")], [t("link"), planDoc?.link || "-"]]} />
        </Card>
      </Section>

      <Section title={t("serviceLayerPlans")} icon={BriefcaseBusiness}>
        <div className="grid gap-3 xl:grid-cols-2">
          {servicePlans.map((plan) => (
            <Card key={plan.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{servicesById[plan.serviceId]?.name}</h3>
                <Badge>{translateStatus(plan.status, t)}</Badge>
              </div>
              <InfoGrid compact items={[[t("objective"), plan.objective], [t("included"), plan.included], [t("executionSteps"), plan.executionSteps], [t("requiredInputs"), plan.requiredInputs], [t("expectedOutputs"), plan.expectedOutputs], [t("link"), plan.documentLink || "-"]]} />
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input className="focus-ring rounded border border-slate-200 px-2 py-1 text-sm" value={plan.documentLink} onChange={(event) => updatePlan(plan, { documentLink: event.target.value })} placeholder={t("link")} />
                <select className="focus-ring rounded border border-slate-200 bg-white px-2 py-1 text-sm" value={plan.status} onChange={(event) => updatePlan(plan, { status: event.target.value as DocumentStatus })}>
                  {documentStatuses.map((status) => <option key={status} value={status}>{translateStatus(status, t)}</option>)}
                </select>
              </div>
            </Card>
          ))}
          {!servicePlans.length && <EmptyState text={t("emptyState")} />}
        </div>
      </Section>
    </div>
  );
}

function TasksByPhase({ data, setData, project, tasks, t, isRtl, createNextActionFromTask, addActivity }: { data: AppData; setData: (data: AppData) => void; project: Project; tasks: Task[]; t: (key: string) => string; isRtl: boolean; createNextActionFromTask: (task: Task) => void; addActivity: (projectId: string, type: string, message: string, owner?: string, section?: string) => void }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const phases = data.phases.filter((phase) => phase.projectId === project.id);
  const teamMembers = teamOptions(data);
  const updateTaskStatus = (task: Task, status: TaskStatus) => {
    setData({ ...data, tasks: data.tasks.map((item) => item.id === task.id ? { ...item, status } : item) });
    addActivity(project.id, status === "Done" ? "task completed" : "task status changed", `${task.title}: ${status}`, task.owner, t("tasks"));
  };
  const filtered = tasks.filter((task) => (statusFilter === "All" || task.status === statusFilter) && (ownerFilter === "All" || task.owner === ownerFilter) && (phaseFilter === "All" || task.phaseId === phaseFilter) && (serviceFilter === "All" || task.relatedService === serviceFilter));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <FilterSelect label={t("status")} value={statusFilter} options={["All", ...taskStatuses]} onChange={setStatusFilter} />
        <FilterSelect label={t("owner")} value={ownerFilter} options={["All", ...teamMembers]} onChange={setOwnerFilter} />
        <FilterSelect label={t("relatedPhase")} value={phaseFilter} options={["All", ...phases.map((phase) => phase.id)]} optionLabels={Object.fromEntries(phases.map((phase) => [phase.id, phase.name]))} onChange={setPhaseFilter} />
        <FilterSelect label={t("relatedService")} value={serviceFilter} options={["All", ...Array.from(new Set(tasks.map((task) => task.relatedService)))]} onChange={setServiceFilter} />
      </div>
      {phases.map((phase) => {
        const phaseTasks = filtered.filter((task) => task.phaseId === phase.id);
        if (!phaseTasks.length) return null;
        return (
          <Card key={phase.id}>
            <h3 className="mb-3 font-bold">{phase.name}</h3>
            <MiniTable
              headers={[t("title"), t("owner"), t("status"), t("priority"), t("dueDate"), t("relatedService"), t("nextAction")]}
              rows={phaseTasks.map((task) => [task.title, task.owner, "", task.priority, task.dueDate, task.relatedService, ""])}
              isRtl={isRtl}
              empty={t("noRecords")}
              actions={phaseTasks.map((task) => (
                <div className="flex flex-wrap gap-1">
                  <select className={cx("focus-ring rounded border px-2 py-1 text-xs", isOverdue(task) ? "border-red-300 bg-red-50" : task.status === "Waiting Client" ? "border-amber-300 bg-amber-50" : task.status === "Review" ? "border-blue-300 bg-blue-50" : ["High", "Urgent"].includes(task.priority) ? "border-red-300" : "border-slate-200")} value={task.status} onChange={(event) => updateTaskStatus(task, event.target.value as TaskStatus)}>
                    {taskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <SmallButton onClick={() => createNextActionFromTask(task)}>{t("createNextActionFromTask")}</SmallButton>
                </div>
              ))}
            />
          </Card>
        );
      })}
    </div>
  );
}

function MonthlySupportPanel({ cycle, project, documents, t, openDocumentModal }: { cycle: MonthlyCycle; project: Project; documents: ProjectDocument[]; t: (key: string) => string; openDocumentModal: (id?: string) => void }) {
  const report = documents.find((doc) => doc.type === "Monthly Review Report");
  return (
    <Section title={t("monthlySupport")} icon={Wrench} action={<Button icon={FileText} onClick={() => openDocumentModal(report?.id)}>{t("monthlyReviewReport")}</Button>}>
      <Card>
        <InfoGrid items={[[t("project"), project.name], [t("currentMonth"), cycle.month], [t("monthlyStatus"), String(cycle.status)], [t("monthGoals"), cycle.goals], [t("openIssues"), cycle.issues], [t("backlog"), cycle.backlog], [t("updates"), cycle.updates], [t("nextReview"), cycle.nextReviewDate], [t("reportLink"), cycle.reportLink || report?.link || "-"], [t("nextMonthPriorities"), cycle.nextPriorities]]} />
      </Card>
    </Section>
  );
}

function RiskPanel({ risks, t, addRisk }: { risks: RiskItem[]; t: (key: string) => string; addRisk: () => void }) {
  return (
    <Section title={t("risksBlockers")} icon={AlertTriangle} action={<Button icon={Plus} onClick={addRisk}>{t("addRisk")}</Button>}>
      <div className="grid gap-3 xl:grid-cols-2">
        {risks.map((risk) => (
          <Card key={risk.id} className={cx(risk.severity === "High" && risk.status !== "Resolved" && "border-red-300 bg-red-50")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">{risk.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{risk.description || "-"}</p>
              </div>
              <Badge tone={risk.status === "Resolved" ? "success" : risk.severity === "High" ? "danger" : "warn"}>{risk.severity} · {risk.status}</Badge>
            </div>
            <InfoGrid compact items={[[t("owner"), risk.owner], [t("dueDate"), risk.dueDate], [t("mitigation"), risk.mitigation || "-"]]} />
          </Card>
        ))}
        {!risks.length && <EmptyState text={t("noActiveRisks")} />}
      </div>
    </Section>
  );
}

function ServicesPage({ data, t }: { data: AppData; t: (key: string) => string }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {data.services.map((service) => (
        <Card key={service.id}>
          <h2 className="text-lg font-bold">{service.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{service.description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoMini title={t("whenToUse")} values={[service.whenToUse]} />
            <InfoMini title={t("keyOutputs")} values={service.outputs} />
            <InfoMini title={t("defaultPhases")} values={service.defaultPhases} />
            <InfoMini title={t("defaultDeliverables")} values={service.defaultDeliverables} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TasksPage({ data, tasks, view, setView, setModal, clientsById, t }: { data: AppData; tasks: Task[]; view: TaskView; setView: (view: TaskView) => void; setModal: (modal: ModalName) => void; clientsById: Record<string, Client>; t: (key: string) => string }) {
  const projectById = Object.fromEntries(data.projects.map((project) => [project.id, project]));
  const views: Array<[TaskView, string]> = [["all", t("all")], ["my", t("myTasks")], ["today", t("today")], ["overdue", t("overdue")], ["waiting", t("waitingClient")], ["review", t("review")], ["high", t("highPriority")], ["done", t("done")]];
  return (
    <Section title={t("tasks")} icon={ClipboardList} action={<Button onClick={() => setModal("task")} icon={Plus}>{t("addTask")}</Button>}>
      <div className="mb-4 flex flex-wrap gap-2">
        {views.map(([id, label]) => <button key={id} className={cx("focus-ring rounded border px-3 py-2 text-sm font-semibold", view === id ? "border-aura-ink bg-aura-ink text-white" : "border-slate-200 bg-white")} onClick={() => setView(id)}>{label}</button>)}
      </div>
      <div className="overflow-x-auto thin-scrollbar">
        <table className="min-w-[850px] w-full text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>{[t("title"), t("project"), t("client"), t("owner"), t("status"), t("priority"), t("dueDate"), t("relatedPhase")].map((heading, index) => <th key={`${heading}-${index}`} className="py-3 text-start">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const project = projectById[task.projectId];
              const phase = data.phases.find((item) => item.id === task.phaseId);
              return (
                <tr key={task.id} className="border-b border-slate-100">
                  <td className="py-3 font-semibold">{task.title}</td>
                  <td>{project?.name}</td>
                  <td>{clientsById[project?.clientId ?? ""]?.companyName}</td>
                  <td>{task.owner}</td>
                  <td><Badge tone={task.status === "Done" ? "success" : task.status === "Waiting Client" ? "warn" : "neutral"}>{task.status}</Badge></td>
                  <td><Badge tone={["High", "Urgent"].includes(task.priority) ? "danger" : "neutral"}>{task.priority}</Badge></td>
                  <td className={cx(isOverdue(task) && "font-semibold text-red-700")}>{task.dueDate}</td>
                  <td>{phase?.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!tasks.length && <EmptyState text={t("emptyState")} />}
      </div>
    </Section>
  );
}

function ManagedSupportPage({ data, clientsById, servicesById, t, openWorkspace }: { data: AppData; clientsById: Record<string, Client>; servicesById: Record<string, Service>; t: (key: string) => string; openWorkspace: (id: string, from?: Page) => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {data.monthlyCycles.map((cycle) => {
        const project = data.projects.find((item) => item.id === cycle.projectId);
        return (
          <Card key={cycle.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{clientsById[cycle.clientId]?.companyName}</h2>
                <p className="text-sm text-slate-500">{project?.name}</p>
              </div>
              <Badge tone={String(cycle.status) === "Review" ? "gold" : "neutral"}>{String(cycle.status)}</Badge>
            </div>
            <InfoGrid items={[[t("activeSystems"), project?.selectedServiceIds.map((id) => servicesById[id]?.name).filter(Boolean).join(", ") ?? ""], [t("monthGoals"), cycle.goals], [t("openIssues"), cycle.issues], [t("backlog"), cycle.backlog], [t("updates"), cycle.updates], [t("nextReview"), cycle.nextReviewDate], [t("reportLink"), cycle.reportLink || "-"], [t("nextAction"), cycle.nextPriorities || project?.nextAction || t("noNextAction")]]} />
            {project && <div className="mt-3"><Button icon={FolderKanban} onClick={() => openWorkspace(project.id, "support")}>{t("openWorkspace")}</Button></div>}
          </Card>
        );
      })}
      {!data.monthlyCycles.length && <EmptyState text={t("emptyState")} />}
    </div>
  );
}

function SettingsPage({ data, setData, settingsJson, setSettingsJson, language, setLanguage, density, setDensity, loadDemoData, resetWorkspace, t }: { data: AppData; setData: (data: AppData) => void; settingsJson: string; setSettingsJson: (value: string) => void; language: Language; setLanguage: (language: Language) => void; density: Density; setDensity: (density: Density) => void; loadDemoData: () => void; resetWorkspace: () => void; t: (key: string) => string }) {
  const [memberDraft, setMemberDraft] = useState("");
  const members = data.teamMembers?.length ? data.teamMembers : ["Amir", "Partner"];
  const updateTeamMember = (index: number, value: string) => {
    const next = members.map((member, memberIndex) => (memberIndex === index ? value : member)).filter((member) => member.trim());
    setData({ ...data, teamMembers: next });
  };
  const addTeamMember = () => {
    const value = memberDraft.trim();
    if (!value || members.includes(value)) return;
    setData({ ...data, teamMembers: [...members, value] });
    setMemberDraft("");
  };
  const removeTeamMember = (index: number) => {
    const next = members.filter((_, memberIndex) => memberIndex !== index);
    setData({ ...data, teamMembers: next.length ? next : ["Amir", "Partner"] });
  };
  const importData = () => {
    try {
      setData(JSON.parse(settingsJson) as AppData);
    } catch {
      alert(t("invalidJson"));
    }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title={t("settings")} icon={Settings}>
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t("localStorageWarning")}</p>
          </div>
        </div>
        <InfoGrid items={[[t("teamMembers"), members.join(", ")], [t("documents"), `${data.documents.length}`], [t("taskTemplates"), t("baseTaskTemplates")], [t("language"), language.toUpperCase()], [t("density"), t(density)], [t("persisted"), DATA_KEY]]} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button icon={Globe2} onClick={() => setLanguage(language === "en" ? "ar" : "en")}>{language === "en" ? "AR" : "EN"}</Button>
          <Button icon={Sparkles} onClick={loadDemoData}>{t("loadDemoData")}</Button>
          <Button icon={RefreshCw} onClick={resetWorkspace}>{t("resetWorkspace")}</Button>
          <Button icon={FileText} onClick={() => setSettingsJson(JSON.stringify(data, null, 2))}>{t("exportData")}</Button>
        </div>
      </Section>
      <Section title={t("teamMembers")} icon={UsersRound}>
        <div className="grid gap-2">
          {members.map((member, index) => (
            <div key={`${member}-${index}`} className="flex gap-2">
              <input className="focus-ring min-w-0 flex-1 rounded border border-slate-200 px-3 py-2 text-sm" value={member} onChange={(event) => updateTeamMember(index, event.target.value)} aria-label={t("teamMemberName")} />
              <SmallButton onClick={() => removeTeamMember(index)}>{t("remove")}</SmallButton>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="focus-ring min-w-0 flex-1 rounded border border-slate-200 px-3 py-2 text-sm" value={memberDraft} onChange={(event) => setMemberDraft(event.target.value)} placeholder={t("teamMemberName")} />
            <Button icon={Plus} onClick={addTeamMember}>{t("addTeamMember")}</Button>
          </div>
        </div>
      </Section>
      <Section title={t("preferences")} icon={Settings}>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField label={t("density")} value={density} options={[["compact", t("compact")], ["comfortable", t("comfortable")]]} onChange={(value) => setDensity(value as Density)} />
          <SelectField label={t("language")} value={language} options={[["en", "English"], ["ar", "العربية"]]} onChange={(value) => setLanguage(value as Language)} />
        </div>
      </Section>
      <Section title={`${t("exportData")} / ${t("importData")}`} icon={FileText}>
        <textarea className="focus-ring min-h-80 w-full rounded border border-slate-200 p-3 text-xs" value={settingsJson} onChange={(event) => setSettingsJson(event.target.value)} placeholder={t("jsonPlaceholder")} />
        <div className="mt-3 flex gap-2"><Button icon={FileText} onClick={importData}>{t("importData")}</Button></div>
      </Section>
    </div>
  );
}

function ProjectCard({ project, client, serviceNames, t, onClick }: { project: Project; client: Client; serviceNames: string[]; t: (key: string) => string; onClick: () => void }) {
  return (
    <button className={cx("focus-ring w-full rounded border bg-white p-3 text-start shadow-sm transition hover:border-aura-gold", !project.nextAction ? "border-amber-300 bg-amber-50" : "border-slate-200")} onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{project.name}</h3>
          <p className="text-sm text-slate-500">{client?.companyName}</p>
        </div>
        <Badge tone={project.status === "Waiting Client" || !project.nextAction ? "warn" : project.status === "Delivered" ? "success" : "neutral"}>{project.status}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{serviceNames.slice(0, 3).map((name) => <Badge key={name} tone="gold">{name}</Badge>)}</div>
      <InfoGrid compact items={[[t("currentPhase"), project.currentPhase], [t("owner"), project.owner], [t("nextAction"), project.nextAction || t("noNextAction")], [t("lastUpdate"), project.updatedAt]]} />
      <div className="mt-3"><Badge tone="gold">{t("openWorkspace")}</Badge></div>
    </button>
  );
}

function ClientModal({ t, onClose, onSave }: { t: (key: string) => string; onClose: () => void; onSave: (client: Client) => void }) {
  const [form, setForm] = useState({ companyName: "", contactName: "", role: "", phone: "", email: "", website: "", industry: "", source: "" });
  return (
    <Modal title={t("createClient")} onClose={onClose}>
      <FormGrid>{Object.entries(form).map(([key, value]) => <Field key={key} label={key} value={value} onChange={(next) => setForm({ ...form, [key]: next })} />)}</FormGrid>
      <ModalActions t={t} onClose={onClose} onSave={() => onSave({ id: createId("client"), ...form, status: "New Lead", notes: "Created from AURA Command Center.", createdAt: todayIso(), lastContactAt: todayIso() })} />
    </Modal>
  );
}

function ProjectModal({ data, teamMembers, t, onClose, onSave }: { data: AppData; teamMembers: string[]; t: (key: string) => string; onClose: () => void; onSave: (project: Project) => void }) {
  const [selectedServices, setSelectedServices] = useState<string[]>(["workflow"]);
  const [form, setForm] = useState({ clientId: data.clients[0]?.id ?? "", name: "", type: "Specific Service Layers", owner: teamMembers[0] ?? "Amir", priority: "Medium" as Priority, nextAction: "", nextActionDueDate: todayIso() });
  const managedSupport = selectedServices.includes("managed") || form.type === "Managed Monthly Support";
  const toggleService = (id: string) => setSelectedServices((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const save = () => {
    const fullLayers = ["workflow", "dashboards", "software", "automation", "marketing", "startup"];
    const services = form.type === "Full System" ? ["full-system", ...fullLayers] : Array.from(new Set(selectedServices));
    onSave({
      id: createId("project"),
      clientId: form.clientId,
      name: form.name || "Untitled AURA Project",
      selectedServiceIds: managedSupport ? Array.from(new Set([...services, "managed"])) : services,
      status: managedSupport ? "Managed Monthly" : "Draft",
      priority: form.priority,
      owner: form.owner,
      currentPhase: managedSupport ? "Managed Monthly Support" : "Setup & Intake",
      nextAction: form.nextAction,
      nextActionOwner: form.owner,
      nextActionDueDate: form.nextActionDueDate,
      nextActionStatus: form.nextAction ? "To Do" : "Backlog",
      servicePath: form.type === "Full System" ? "Full Business Operating System" : "Specific Service Layers",
      problem: "Needs diagnosis before delivery work begins.",
      goal: "Define the right operating path and deliver clean internal systems.",
      scope: "Generated from selected service layers.",
      outOfScope: "Heavy file uploads, public marketing pages, and advanced permissions.",
      assumptions: "Client materials will be linked externally.",
      successIndicators: "Clear scope, visible progress, completed documents, and confirmed next action.",
      internalNotes: "",
      planSummary: "Diagnosis will define the execution plan and related service layer documents.",
      risks: form.nextAction ? "No major risk logged yet." : "Project needs a confirmed next action.",
      managedSupport,
      createdAt: todayIso(),
      updatedAt: todayIso()
    });
  };
  return (
    <Modal title={t("createProject")} onClose={onClose}>
      <FormGrid>
        <SelectField label={t("client")} value={form.clientId} options={data.clients.map((client) => [client.id, client.companyName])} onChange={(value) => setForm({ ...form, clientId: value })} />
        <Field label={t("project")} value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <SelectField label={t("projectType")} value={form.type} options={[["Full System", t("fullSystem")], ["Specific Service Layers", t("specificLayers")], ["Managed Monthly Support", t("managedMonthly")]]} onChange={(value) => setForm({ ...form, type: value })} />
        <SelectField label={t("owner")} value={form.owner} options={teamMembers.map((owner) => [owner, owner])} onChange={(value) => setForm({ ...form, owner: value })} />
        <SelectField label={t("priority")} value={form.priority} options={priorities.map((priority) => [priority, priority])} onChange={(value) => setForm({ ...form, priority: value as Priority })} />
        <Field label={t("nextAction")} value={form.nextAction} onChange={(value) => setForm({ ...form, nextAction: value })} />
        <Field label={t("nextActionDueDate")} value={form.nextActionDueDate} type="date" onChange={(value) => setForm({ ...form, nextActionDueDate: value })} />
      </FormGrid>
      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold">{t("selectedServices")}</p>
        {form.type === "Full System" && <div className="mb-3 rounded border border-aura-gold bg-amber-50 p-3 text-sm text-amber-900">{t("fullSystemIncludes")}</div>}
        <div className="grid gap-2 md:grid-cols-2">
          {data.services.filter((service) => service.id !== "full-system").map((service) => (
            <button key={service.id} type="button" className={cx("focus-ring rounded border p-3 text-start text-sm", selectedServices.includes(service.id) ? "border-aura-gold bg-amber-50" : "border-slate-200 bg-white")} onClick={() => toggleService(service.id)}>
              <span className="font-semibold">{service.name}</span>
              <span className="mt-1 block text-xs text-slate-500">{service.description}</span>
            </button>
          ))}
        </div>
      </div>
      <ModalActions t={t} onClose={onClose} onSave={save} />
    </Modal>
  );
}

function TaskModal({ data, selectedProjectId, teamMembers, t, onClose, onSave }: { data: AppData; selectedProjectId?: string; teamMembers: string[]; t: (key: string) => string; onClose: () => void; onSave: (task: Task) => void }) {
  const [form, setForm] = useState({ projectId: selectedProjectId ?? data.projects[0]?.id ?? "", title: "", owner: teamMembers[0] ?? "Amir", status: "To Do" as TaskStatus, priority: "Medium" as Priority, dueDate: todayIso(), relatedService: "Manual task", notes: "" });
  const phases = data.phases.filter((phase) => phase.projectId === form.projectId);
  const [phaseId, setPhaseId] = useState(phases[0]?.id ?? "");
  return (
    <Modal title={t("addTask")} onClose={onClose}>
      <FormGrid>
        <SelectField label={t("project")} value={form.projectId} options={data.projects.map((project) => [project.id, project.name])} onChange={(value) => { setForm({ ...form, projectId: value }); setPhaseId(data.phases.find((phase) => phase.projectId === value)?.id ?? ""); }} />
        <Field label={t("title")} value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <SelectField label={t("owner")} value={form.owner} options={teamMembers.map((owner) => [owner, owner])} onChange={(value) => setForm({ ...form, owner: value })} />
        <SelectField label={t("status")} value={form.status} options={taskStatuses.map((status) => [status, status])} onChange={(value) => setForm({ ...form, status: value as TaskStatus })} />
        <SelectField label={t("priority")} value={form.priority} options={priorities.map((priority) => [priority, priority])} onChange={(value) => setForm({ ...form, priority: value as Priority })} />
        <Field label={t("dueDate")} value={form.dueDate} type="date" onChange={(value) => setForm({ ...form, dueDate: value })} />
        <SelectField label={t("relatedPhase")} value={phaseId} options={phases.map((phase) => [phase.id, phase.name])} onChange={setPhaseId} />
        <Field label={t("relatedService")} value={form.relatedService} onChange={(value) => setForm({ ...form, relatedService: value })} />
      </FormGrid>
      <ModalActions t={t} onClose={onClose} onSave={() => onSave({ id: createId("task"), ...form, phaseId })} />
    </Modal>
  );
}

function MeetingModal({ data, selectedProjectId, t, onClose, onSave }: { data: AppData; selectedProjectId?: string; t: (key: string) => string; onClose: () => void; onSave: (meeting: Meeting) => void }) {
  const [form, setForm] = useState({ projectId: selectedProjectId ?? data.projects[0]?.id ?? "", date: todayIso(), attendees: "", summary: "", decisions: "", actionItems: "", nextMeeting: todayIso() });
  return (
    <Modal title={t("addMeeting")} onClose={onClose}>
      <FormGrid>
        <SelectField label={t("project")} value={form.projectId} options={data.projects.map((project) => [project.id, project.name])} onChange={(value) => setForm({ ...form, projectId: value })} />
        <Field label={t("date")} value={form.date} type="date" onChange={(value) => setForm({ ...form, date: value })} />
        <Field label={t("attendees")} value={form.attendees} onChange={(value) => setForm({ ...form, attendees: value })} />
        <Field label={t("summary")} value={form.summary} onChange={(value) => setForm({ ...form, summary: value })} />
        <Field label={t("decisions")} value={form.decisions} onChange={(value) => setForm({ ...form, decisions: value })} />
        <Field label={t("actionItems")} value={form.actionItems} onChange={(value) => setForm({ ...form, actionItems: value })} />
        <Field label={t("nextMeeting")} value={form.nextMeeting} type="date" onChange={(value) => setForm({ ...form, nextMeeting: value })} />
      </FormGrid>
      <ModalActions t={t} onClose={onClose} onSave={() => onSave({ id: createId("meet"), ...form })} />
    </Modal>
  );
}

function DocumentModal({ document, t, onClose, onSave }: { document?: ProjectDocument; t: (key: string) => string; onClose: () => void; onSave: (document: ProjectDocument) => void }) {
  const [form, setForm] = useState<ProjectDocument | undefined>(document);
  if (!form) return <Modal title={t("documents")} onClose={onClose}><EmptyState text={t("emptyState")} /></Modal>;
  return (
    <Modal title={translateDocTitle(form.title, t)} onClose={onClose}>
      <FormGrid>
        <Field label={t("link")} value={form.link} onChange={(value) => setForm({ ...form, link: value })} />
        <SelectField label={t("type")} value={form.linkType} options={allowedLinkTypes.map((type) => [type, type])} onChange={(value) => setForm({ ...form, linkType: value })} />
        <SelectField label={t("status")} value={form.status} options={documentStatuses.map((status) => [status, translateStatus(status, t)])} onChange={(value) => setForm({ ...form, status: value as DocumentStatus })} />
        <Field label={t("owner")} value={form.owner} onChange={(value) => setForm({ ...form, owner: value })} />
        <Field label={t("notes")} value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
      </FormGrid>
      <ModalActions t={t} onClose={onClose} onSave={() => onSave({ ...form, updatedAt: todayIso() })} />
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-aura-ink/55 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded bg-white p-4 shadow-soft thin-scrollbar">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={onClose}>{useT("en")("close")}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ t, onClose, onSave }: { t: (key: string) => string; onClose: () => void; onSave: () => void }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button className="focus-ring rounded border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={onClose}>{t("cancel")}</button>
      <button className="focus-ring rounded bg-aura-ink px-4 py-2 text-sm font-semibold text-white" onClick={onSave}>{t("save")}</button>
    </div>
  );
}

function Section({ title, icon: Icon, children, action }: { title: string; icon: typeof UsersRound; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded border border-slate-200 bg-white p-2 text-aura-plum"><Icon className="h-4 w-4" /></div>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("rounded border border-slate-200 bg-white p-3 shadow-sm", className)}>{children}</div>;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warn" | "danger" | "gold" }) {
  return <span className={cx("inline-flex max-w-full items-center rounded px-2 py-1 text-xs font-semibold", tone === "success" && "bg-emerald-50 text-emerald-700", tone === "warn" && "bg-amber-50 text-amber-700", tone === "danger" && "bg-red-50 text-red-700", tone === "gold" && "bg-[#f8edcf] text-[#7a5a14]", tone === "neutral" && "bg-slate-100 text-slate-600")}>{children}</span>;
}

function Button({ children, icon: Icon, onClick }: { children: React.ReactNode; icon: typeof Plus; onClick: () => void }) {
  return <button className="focus-ring inline-flex items-center justify-center gap-2 rounded bg-aura-ink px-3 py-2 text-sm font-semibold text-white shadow-sm" onClick={onClick}><Icon className="h-4 w-4" />{children}</button>;
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="focus-ring rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold hover:border-aura-gold" onClick={onClick}>{children}</button>;
}

function InfoGrid({ items, compact }: { items: Array<[string, string | undefined]>; compact?: boolean }) {
  return (
    <div className={cx("grid gap-3", compact ? "mt-3" : "mt-2 md:grid-cols-2")}>
      {items.map(([label, value], index) => (
        <div key={`${label}-${value}-${index}`} className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
          <p className="mt-1 break-words text-sm text-slate-700">{value || "-"}</p>
        </div>
      ))}
    </div>
  );
}

function InfoMini({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-slate-600">{values.map((value) => <li key={value}>- {value}</li>)}</ul>
    </div>
  );
}

function SimpleList({ items, empty, compact }: { items: Array<{ title: string; meta: string }>; empty: string; compact?: boolean }) {
  if (!items.length) return <EmptyState text={empty} />;
  return <div className={cx("space-y-2", compact && "mt-3")}>{items.map((item) => <div key={`${item.title}-${item.meta}`} className="rounded border border-slate-200 bg-white p-3"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.meta}</p></div>)}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">{text}</div>;
}

function MiniTable({ headers, rows, isRtl, empty, actions }: { headers: string[]; rows: string[][]; isRtl: boolean; empty: string; actions?: React.ReactNode[] }) {
  if (!rows.length) return <EmptyState text={empty} />;
  return (
    <div className="overflow-x-auto thin-scrollbar">
      <table className="min-w-[760px] w-full text-sm">
        <thead><tr className="border-b border-slate-200 text-slate-500">{headers.map((header, index) => <th key={`${header}-${index}`} className={cx("py-2 font-semibold", isRtl ? "text-right" : "text-left")}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`} className="border-b border-slate-100">
              {row.map((cell, index) => <td key={`${cell}-${index}`} className="max-w-56 break-words py-2 text-slate-700">{index === row.length - 1 && actions ? actions[rowIndex] : cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilterSelect({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-semibold text-slate-600">{label}</span>
      <select className="focus-ring w-full rounded border border-slate-200 bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option === "All" ? "All" : optionLabels?.[option] ?? option}</option>)}
      </select>
    </label>
  );
}

function InlineEdit({ label, value, onSave }: { label: string; value: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="text-sm">
      <span className="mb-1 block font-semibold text-slate-600">{label}</span>
      <textarea className="focus-ring min-h-24 w-full rounded border border-slate-200 px-3 py-2" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onSave(draft)} />
    </label>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-semibold text-slate-600">{label}</span>
      <input className="focus-ring w-full rounded border border-slate-200 px-3 py-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-semibold text-slate-600">{label}</span>
      <select className="focus-ring w-full rounded border border-slate-200 bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function translateStatus(status: string, t: (key: string) => string) {
  return t(`status.${status}`) === `status.${status}` ? status : t(`status.${status}`);
}

function translatePhaseStatus(status: string, t: (key: string) => string) {
  return t(`phase.${status}`) === `phase.${status}` ? status : t(`phase.${status}`);
}

function translateDocType(type: string, t: (key: string) => string) {
  const key = `doc.${type}`;
  return t(key) === key ? type : t(key);
}

function translateDocTitle(title: string, t: (key: string) => string) {
  if (title.includes("Client Service Brief")) return t("clientServiceBrief");
  if (title.includes("Input Files / Links")) return t("inputFilesLinks");
  if (title.includes("Master Execution Plan")) return t("masterExecutionPlan");
  if (title.includes("Monthly Review Report")) return t("monthlyReviewReport");
  return title;
}

function translateInputGroup(group: string, t: (key: string) => string) {
  const key = `inputGroup.${group}`;
  return t(key) === key ? group : t(key);
}

function translateInputStatus(status: string, t: (key: string) => string) {
  const key = `inputStatus.${status}`;
  return t(key) === key ? status : t(key);
}
