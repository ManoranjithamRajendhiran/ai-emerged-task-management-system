import { useState, useEffect, useCallback } from "react";

const BASE_URL = "http://localhost:8000";

const ROLES = ["PROJECT_SUCCESS_MANAGER", "PROJECT_MANAGER", "TEAM_LEAD", "TEAM_MEMBER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"];

// ─── Auth helpers ───────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("jwt_token"); }
function setToken(t) { localStorage.setItem("jwt_token", t); }
function clearToken() { localStorage.removeItem("jwt_token"); }
function getUser() {
  const t = getToken();
  if (!t) return null;
  try { return JSON.parse(atob(t.split(".")[1])); } catch { return null; }
}

async function apiFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(BASE_URL + path, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const PALETTE = {
  bg: "#0f1117",
  surface: "#16191f",
  card: "#1c2028",
  border: "#272b35",
  accent: "#5b8af0",
  accentSoft: "#1e2d4d",
  text: "#e8eaf0",
  muted: "#8891a4",
  danger: "#e05c5c",
  success: "#4caf7d",
  warning: "#e8a84c",
  info: "#5b8af0",
};

const badge = (status) => {
  const map = {
    PENDING: { bg: "#2a2318", color: "#e8a84c" },
    IN_PROGRESS: { bg: "#1a2540", color: "#5b8af0" },
    COMPLETED: { bg: "#1a2e24", color: "#4caf7d" },
    BLOCKED: { bg: "#2e1a1a", color: "#e05c5c" },
    LOW: { bg: "#1a2e24", color: "#4caf7d" },
    MEDIUM: { bg: "#2a2318", color: "#e8a84c" },
    HIGH: { bg: "#2a1f18", color: "#e8824c" },
    CRITICAL: { bg: "#2e1a1a", color: "#e05c5c" },
    PROJECT_MANAGER: { bg: "#1e2d4d", color: "#5b8af0" },
    TEAM_LEAD: { bg: "#231e3a", color: "#9b8af0" },
    TEAM_MEMBER: { bg: "#1e2d2d", color: "#4cafa4" },
    PROJECT_SUCCESS_MANAGER: { bg: "#2e2318", color: "#e8c44c" },
  };
  const s = map[status] || { bg: "#23262e", color: "#8891a4" };
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    background: s.bg,
    color: s.color,
    fontFamily: "monospace",
  };
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
const styles = {
  input: {
    width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${PALETTE.border}`,
    background: "#13161d", color: PALETTE.text, fontSize: 14, outline: "none",
    boxSizing: "border-box",
  },
  btn: (variant = "primary") => ({
    padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14,
    fontWeight: 600, transition: "opacity 0.15s",
    background: variant === "primary" ? PALETTE.accent : variant === "danger" ? PALETTE.danger : "#272b35",
    color: variant === "ghost" ? PALETTE.muted : "#fff",
  }),
  card: { background: PALETTE.card, borderRadius: 12, border: `1px solid ${PALETTE.border}`, padding: "1.25rem" },
  label: { display: "block", fontSize: 12, color: PALETTE.muted, marginBottom: 5, fontWeight: 500 },
  select: {
    width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${PALETTE.border}`,
    background: "#13161d", color: PALETTE.text, fontSize: 14, outline: "none", boxSizing: "border-box",
  },
};

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={styles.label}>{label}</label>}
      <input style={styles.input} {...props} />
    </div>
  );
}
function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={styles.label}>{label}</label>}
      <select style={styles.select} {...props}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}
function Textarea({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={styles.label}>{label}</label>}
      <textarea style={{ ...styles.input, height: 80, resize: "vertical" }} {...props} />
    </div>
  );
}
function Btn({ children, variant, loading, style, ...props }) {
  return (
    <button style={{ ...styles.btn(variant), opacity: loading ? 0.6 : 1, ...style }} disabled={loading} {...props}>
      {loading ? "…" : children}
    </button>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const colors = { success: PALETTE.success, error: PALETTE.danger, info: PALETTE.accent };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, background: PALETTE.card,
      border: `1px solid ${colors[type] || PALETTE.border}`, borderRadius: 10,
      padding: "12px 18px", color: colors[type] || PALETTE.text, fontSize: 14, zIndex: 9999,
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)", maxWidth: 320,
    }}>{msg}</div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{ ...styles.card, minWidth: 360, maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: PALETTE.text, fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: PALETTE.muted, cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ ...styles.card, textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || PALETTE.accent }}>{value}</div>
      <div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────

// AUTH
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "TEAM_MEMBER" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      if (mode === "register") {
        await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(form) });
        setMode("login");
      } else {
        const res = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        if (res.error) { setErr(res.error); setLoading(false); return; }
        setToken(res.access_token);
        onAuth();
      }
    } catch (ex) { setErr(ex.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: PALETTE.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ ...styles.card, width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <h1 style={{ margin: 0, color: PALETTE.text, fontSize: 22, fontWeight: 700 }}>AI Task Manager</h1>
          <p style={{ color: PALETTE.muted, fontSize: 13, marginTop: 6 }}>AI-powered project & team management</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === m ? PALETTE.accent : PALETTE.border, color: "#fff", fontSize: 13, fontWeight: 600,
            }}>{m === "login" ? "Sign In" : "Register"}</button>
          ))}
        </div>
        <form onSubmit={submit}>
          {mode === "register" && <Input label="Full Name" value={form.name} onChange={set("name")} required placeholder="John Doe" />}
          <Input label="Email" type="email" value={form.email} onChange={set("email")} required placeholder="you@company.com" />
          <Input label="Password" type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" />
          {mode === "register" && (
            <Select label="Role" value={form.role} onChange={set("role")} options={ROLES.map(r => ({ value: r, label: r.replace(/_/g, " ") }))} />
          )}
          {err && <div style={{ color: PALETTE.danger, fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <Btn style={{ width: "100%" }} loading={loading} type="submit">
            {mode === "login" ? "Sign In" : "Create Account"}
          </Btn>
        </form>
      </div>
    </div>
  );
}

// PROJECTS
function ProjectsPage({ toast, user }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const canCreate = user?.role === "PROJECT_MANAGER";

  const load = useCallback(async () => {
    setLoading(true);
    try { setProjects(await apiFetch("/projects/all")); } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch("/projects/create", { method: "POST", body: JSON.stringify(form) });
      toast("Project created!", "success"); setModal(false); load();
    } catch (ex) { toast(ex.message, "error"); }
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: PALETTE.text }}>Projects</h2>
        {canCreate && <Btn onClick={() => setModal(true)}>+ New Project</Btn>}
      </div>
      {loading ? <div style={{ color: PALETTE.muted }}>Loading…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {projects.map(p => (
            <div key={p.project_id} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <h3 style={{ margin: 0, color: PALETTE.text, fontSize: 15 }}>{p.title}</h3>
                <span style={badge(p.status)}>{p.status}</span>
              </div>
              <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 12px" }}>{p.description}</p>
              <div style={{ fontSize: 12, color: PALETTE.muted }}>
                {p.start_date && <span>📅 {p.start_date} → {p.end_date}</span>}
              </div>
            </div>
          ))}
          {!projects.length && <div style={{ color: PALETTE.muted, fontSize: 14 }}>No projects yet.</div>}
        </div>
      )}
      {modal && (
        <Modal title="Create Project" onClose={() => setModal(false)}>
          <form onSubmit={save}>
            <Input label="Title" value={form.title} onChange={set("title")} required />
            <Textarea label="Description" value={form.description} onChange={set("description")} required />
            <Input label="Start Date" type="date" value={form.start_date} onChange={set("start_date")} />
            <Input label="End Date" type="date" value={form.end_date} onChange={set("end_date")} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(false)} type="button">Cancel</Btn>
              <Btn loading={saving} type="submit">Create</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// TEAMS
function TeamsPage({ toast, user }) {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modal, setModal] = useState(null); // "team" | "member"
  const [teamForm, setTeamForm] = useState({ project_id: "", team_name: "", team_lead_id: "" });
  const [memberForm, setMemberForm] = useState({ team_id: "", user_id: "" });
  const [saving, setSaving] = useState(false);
  const setT = k => e => setTeamForm(f => ({ ...f, [k]: e.target.value }));
  const setM = k => e => setMemberForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    apiFetch("/user/all").then(setUsers).catch(() => {});
    apiFetch("/projects/all").then(setProjects).catch(() => {});
  }, []);

  async function createTeam(e) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await apiFetch("/teams/create", { method: "POST", body: JSON.stringify(teamForm) });
      setTeams(t => [...t, { ...teamForm, team_id: res.team_id, team_name: teamForm.team_name }]);
      toast("Team created!", "success"); setModal(null);
    } catch (ex) { toast(ex.message, "error"); }
    setSaving(false);
  }

  async function addMember(e) {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch("/teams/add-member", { method: "POST", body: JSON.stringify(memberForm) });
      toast("Member added!", "success"); setModal(null);
    } catch (ex) { toast(ex.message, "error"); }
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: PALETTE.text }}>Teams</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setModal("member")}>+ Add Member</Btn>
          <Btn onClick={() => setModal("team")}>+ New Team</Btn>
        </div>
      </div>
      {teams.length === 0 && (
        <div style={{ color: PALETTE.muted, fontSize: 14 }}>No teams created yet. Create a team to get started.</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {teams.map(t => (
          <div key={t.team_id} style={styles.card}>
            <h3 style={{ margin: "0 0 8px", color: PALETTE.text, fontSize: 15 }}>{t.team_name}</h3>
            <div style={{ fontSize: 12, color: PALETTE.muted }}>Project: {t.project_id?.slice(0, 8)}…</div>
          </div>
        ))}
      </div>

      {modal === "team" && (
        <Modal title="Create Team" onClose={() => setModal(null)}>
          <form onSubmit={createTeam}>
            <Select label="Project" value={teamForm.project_id} onChange={setT("project_id")} required
              options={[{ value: "", label: "Select project…" }, ...projects.map(p => ({ value: p.project_id, label: p.title }))]} />
            <Input label="Team Name" value={teamForm.team_name} onChange={setT("team_name")} required />
            <Select label="Team Lead" value={teamForm.team_lead_id} onChange={setT("team_lead_id")} required
              options={[{ value: "", label: "Select team lead…" }, ...users.map(u => ({ value: u.user_id, label: `${u.name} (${u.role})` }))]} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(null)} type="button">Cancel</Btn>
              <Btn loading={saving} type="submit">Create</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === "member" && (
        <Modal title="Add Team Member" onClose={() => setModal(null)}>
          <form onSubmit={addMember}>
            <Input label="Team ID" value={memberForm.team_id} onChange={setM("team_id")} required placeholder="UUID of the team" />
            <Select label="User" value={memberForm.user_id} onChange={setM("user_id")} required
              options={[{ value: "", label: "Select user…" }, ...users.map(u => ({ value: u.user_id, label: `${u.name} (${u.role})` }))]} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(null)} type="button">Cancel</Btn>
              <Btn loading={saving} type="submit">Add</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// TASKS
function TasksPage({ toast, user }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ project_id: "", assigned_to: "", title: "", description: "", priority: "MEDIUM", due_date: "" });
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const canCreate = ["TEAM_LEAD", "PROJECT_MANAGER", "PROJECT_SUCCESS_MANAGER"].includes(user?.role);
  const canUpdateStatus = user?.role === "TEAM_MEMBER";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, u, p] = await Promise.all([apiFetch("/tasks/all"), apiFetch("/user/all"), apiFetch("/projects/all")]);
      setTasks(t); setUsers(u); setProjects(p);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createTask(e) {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch("/tasks/create", { method: "POST", body: JSON.stringify(form) });
      toast("Task created!", "success"); setModal(null); load();
    } catch (ex) { toast(ex.message, "error"); }
    setSaving(false);
  }

  async function updateStatus() {
    setSaving(true);
    try {
      await apiFetch(`/tasks/status/${statusTarget}`, { method: "PUT", body: JSON.stringify({ status: newStatus }) });
      toast("Status updated!", "success"); setStatusTarget(null); load();
    } catch (ex) { toast(ex.message, "error"); }
    setSaving(false);
  }

  const userName = id => users.find(u => u.user_id === id)?.name || id?.slice(0, 8) + "…";
  const projectName = id => projects.find(p => p.project_id === id)?.title || id?.slice(0, 8) + "…";
  const filtered = filter === "ALL" ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: PALETTE.text }}>Tasks</h2>
        {canCreate && <Btn onClick={() => setModal("create")}>+ New Task</Btn>}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["ALL", ...TASK_STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "5px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: filter === s ? PALETTE.accent : PALETTE.border, color: "#fff",
          }}>{s}</button>
        ))}
      </div>
      {loading ? <div style={{ color: PALETTE.muted }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(t => (
            <div key={t.task_id} style={{ ...styles.card, display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ color: PALETTE.text, fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                  <span style={badge(t.status)}>{t.status}</span>
                  <span style={badge(t.priority)}>{t.priority}</span>
                </div>
                <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 8px" }}>{t.description}</p>
                <div style={{ fontSize: 12, color: PALETTE.muted, display: "flex", gap: 16 }}>
                  <span>👤 {userName(t.assigned_to)}</span>
                  <span>📁 {projectName(t.project_id)}</span>
                  {t.due_date && <span>📅 {t.due_date}</span>}
                  <span>⭐ {t.productivity_points}pts</span>
                </div>
              </div>
              {(canCreate || canUpdateStatus) && (
                <button onClick={() => { setStatusTarget(t.task_id); setNewStatus(t.status); setModal("status"); }}
                  style={{ ...styles.btn("ghost"), fontSize: 12, padding: "5px 12px", whiteSpace: "nowrap" }}>
                  Update Status
                </button>
              )}
            </div>
          ))}
          {!filtered.length && <div style={{ color: PALETTE.muted, fontSize: 14 }}>No tasks found.</div>}
        </div>
      )}

      {modal === "create" && (
        <Modal title="Create Task" onClose={() => setModal(null)}>
          <form onSubmit={createTask}>
            <Select label="Project" value={form.project_id} onChange={set("project_id")} required
              options={[{ value: "", label: "Select project…" }, ...projects.map(p => ({ value: p.project_id, label: p.title }))]} />
            <Select label="Assign To" value={form.assigned_to} onChange={set("assigned_to")} required
              options={[{ value: "", label: "Select user…" }, ...users.map(u => ({ value: u.user_id, label: `${u.name} — ${u.role}` }))]} />
            <Input label="Title" value={form.title} onChange={set("title")} required />
            <Textarea label="Description" value={form.description} onChange={set("description")} required />
            <Select label="Priority" value={form.priority} onChange={set("priority")}
              options={PRIORITIES.map(p => ({ value: p, label: p }))} />
            <Input label="Due Date" type="date" value={form.due_date} onChange={set("due_date")} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(null)} type="button">Cancel</Btn>
              <Btn loading={saving} type="submit">Create Task</Btn>
            </div>
          </form>
        </Modal>
      )}

      {modal === "status" && (
        <Modal title="Update Task Status" onClose={() => setModal(null)}>
          <Select label="New Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}
            options={TASK_STATUSES.map(s => ({ value: s, label: s }))} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setModal(null)} type="button">Cancel</Btn>
            <Btn loading={saving} onClick={updateStatus}>Update</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ReportBox ────────────────────────────────────────────────────────────────
function ReportBox({ title, content }) {
  return (
    <div style={{ marginTop: 16, background: "#0a0d12", borderRadius: 10, border: `1px solid ${PALETTE.border}`, overflow: "hidden" }}>
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${PALETTE.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE.success }} />
        <span style={{ fontSize: 11, color: PALETTE.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      </div>
      <div style={{ padding: 14, maxHeight: 400, overflowY: "auto" }}>
        <p style={{
          color: content?.startsWith("Report generation failed") || content?.startsWith("error") ? PALETTE.danger : PALETTE.text,
          fontSize: 13, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.8,
        }}>{content}</p>
      </div>
    </div>
  );
}

// AI TOOLS
function AIPage({ toast, user }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState({});
  const set = k => v => setLoading(l => ({ ...l, [k]: v }));

  // AI Task Assigner
  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [aiResult, setAiResult] = useState(null);

  // AI Team Builder
  const [teamProjectTitle, setTeamProjectTitle] = useState("");
  const [teamProjectDesc, setTeamProjectDesc] = useState("");
  const [teamSuggest, setTeamSuggest] = useState(null);

  // Meeting Summarizer
  const [transcript, setTranscript] = useState("");
  const [meetingResult, setMeetingResult] = useState(null);

  // Member Report
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberReport, setMemberReport] = useState(null);

  // Overall Report
  const [overallReport, setOverallReport] = useState(null);

  // ── Role flags ─────────────────────────────────────────────────────────────
  const role = user?.role;
  const canMemberReport = ["PROJECT_SUCCESS_MANAGER", "PROJECT_MANAGER", "TEAM_LEAD"].includes(role);
  const isMember = role === "TEAM_MEMBER";
  const canOverallReport = ["PROJECT_SUCCESS_MANAGER", "PROJECT_MANAGER"].includes(role);
  // PSM and PM get all agent tools; TEAM_LEAD and TEAM_MEMBER only get Meeting + Report
  const canUseAgents = ["PROJECT_SUCCESS_MANAGER", "PROJECT_MANAGER"].includes(role);

  // Orchestrator
  const [orchProjectId, setOrchProjectId] = useState("");
  const [orchProjectTitle, setOrchProjectTitle] = useState("");
  const [orchResult, setOrchResult] = useState(null);

  // AI Productivity Analysis
  const [productivityAnalysis, setProductivityAnalysis] = useState(null);
  // ── Data loading ───────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch("/projects/all").then(setProjects).catch(() => {});
    apiFetch("/user/all").then(setUsers).catch(() => {});
  }, []);

  // ── AI Task Assigner ───────────────────────────────────────────────────────
  async function generateTasks() {
    if (!projectId) { toast("Please select a project", "error"); return; }
    set("tasks")(true);
    try {
      const res = await apiFetch(
        `/ai/generate-tasks?project_title=${encodeURIComponent(projectTitle)}&project_id=${projectId}`,
        { method: "POST" }
      );
      setAiResult(res.ai_tasks);
      toast("Tasks generated and assigned!", "success");
    } catch (ex) { toast(ex.message, "error"); }
    set("tasks")(false);
  }

  // ── AI Team Builder ────────────────────────────────────────────────────────
  async function suggestTeam() {
    if (!teamProjectTitle) { toast("Please enter a project title", "error"); return; }
    set("team")(true);
    try {
      const res = await apiFetch(
        `/ai/suggest-team?project_title=${encodeURIComponent(teamProjectTitle)}&project_description=${encodeURIComponent(teamProjectDesc)}`,
        { method: "POST" }
      );
      setTeamSuggest(res.suggestion);
      toast("Team suggestion ready!", "success");
    } catch (ex) { toast(ex.message, "error"); }
    set("team")(false);
  }

  // ── Meeting Summarizer ─────────────────────────────────────────────────────
  async function summarizeMeeting() {
    if (!transcript.trim()) { toast("Please paste a transcript", "error"); return; }
    set("meeting")(true);
    try {
      const res = await apiFetch(
        `/meeting/summarize?transcript=${encodeURIComponent(transcript)}`,
        { method: "POST" }
      );
      setMeetingResult(res.meeting_summary);
    } catch (ex) { toast(ex.message, "error"); }
    set("meeting")(false);
  }

  
  // ── Member Report ──────────────────────────────────────────────────────────
  async function generateMemberReport() {
    const targetId = isMember ? user?.user_id : selectedMemberId;
    if (!targetId) { toast("Please select a member", "error"); return; }
    set("memberReport")(true);
    try {
      const res = await apiFetch(`/reports/member/${targetId}`);
      setMemberReport(res.report || res.error);
    } catch (ex) { toast(ex.message, "error"); }
    set("memberReport")(false);
  }

  // ── Overall Report ─────────────────────────────────────────────────────────
  async function generateOverallReport() {
    set("overallReport")(true);
    try {
      const res = await apiFetch("/reports/generate");
      setOverallReport(res.report || res.error);
    } catch (ex) { toast(ex.message, "error"); }
    set("overallReport")(false);
  }
  // ── Orchestrator Full Workflow ─────────────────────────────────────────────
    async function runFullWorkflow() {
      if (!orchProjectId) { toast("Please select a project", "error"); return; }
      set("workflow")(true);
      try {
        const res = await apiFetch(
          `/orchestrator/run-workflow?project_title=${encodeURIComponent(orchProjectTitle)}&project_id=${orchProjectId}`,
          { method: "POST" }
        );
        setOrchResult(res);
        toast("Full workflow completed!", "success");
      } catch (ex) { toast(ex.message, "error"); }
      set("workflow")(false);
    }

    // ── AI Productivity Analysis ───────────────────────────────────────────────
    async function runProductivityAnalysis() {
      set("prodAnalysis")(true);
      try {
        const res = await apiFetch("/productivity/analyze");
        setProductivityAnalysis(res.analysis || res.error);
      } catch (ex) { toast(ex.message, "error"); }
      set("prodAnalysis")(false);
    }
  // ── Download as text file ──────────────────────────────────────────────────
  function downloadReportAsPDF(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: PALETTE.text }}>AI Tools</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>

        {/* ── AI Team Builder ── PSM + PM only */}
        {canUseAgents && <div style={styles.card}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>🧠</div>
          <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>AI Team Builder</h3>
          <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
            AI analyses every employee's skills and GitHub profile to suggest the perfect team for your project.
          </p>
          <Input label="Project Title" value={teamProjectTitle} onChange={e => setTeamProjectTitle(e.target.value)} placeholder="E-Commerce Platform" />
          <Textarea label="Project Description" value={teamProjectDesc} onChange={e => setTeamProjectDesc(e.target.value)} placeholder="Describe what the project involves…" />
          <Btn loading={loading.team} onClick={suggestTeam} style={{ width: "100%" }}>Suggest Best Team with AI</Btn>
          {teamSuggest && (
            <div style={{ marginTop: 16 }}>
              <div style={{ background: "#0f1117", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 6 }}>⭐ Suggested Team Lead</div>
                <div style={{ color: PALETTE.accent, fontWeight: 700, fontSize: 14 }}>{teamSuggest.suggested_team_lead?.name}</div>
                <div style={{ color: PALETTE.muted, fontSize: 12, marginTop: 4 }}>{teamSuggest.suggested_team_lead?.reason}</div>
              </div>
              <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 8 }}>👥 Suggested Members</div>
              {teamSuggest.suggested_members?.map((m, i) => (
                <div key={i} style={{ background: "#0f1117", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ color: PALETTE.text, fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                    <span style={badge("TEAM_MEMBER")}>{m.skills}</span>
                  </div>
                  <div style={{ color: PALETTE.muted, fontSize: 12, marginTop: 4 }}>{m.reason}</div>
                </div>
              ))}
              {teamSuggest.team_summary && (
                <div style={{ background: "#1a2540", borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: PALETTE.accent }}>{teamSuggest.team_summary}</div>
                </div>
              )}
            </div>
          )}
        </div>}

        {/* ── AI Task Assigner ── PSM + PM only */}
        {canUseAgents && <div style={styles.card}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>🤖</div>
          <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>AI Task Assigner</h3>
          <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
            AI generates tasks and assigns each one to the best person based on their individual skills and workload.
          </p>
          <Select label="Project" value={projectId} onChange={e => {
            setProjectId(e.target.value);
            const p = projects.find(p => p.project_id === e.target.value);
            if (p) setProjectTitle(p.title);
          }} options={[{ value: "", label: "Select project…" }, ...projects.map(p => ({ value: p.project_id, label: p.title }))]} />
          <Input label="Project Title Override" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="Or type project title" />
          <Btn loading={loading.tasks} onClick={generateTasks} style={{ width: "100%" }}>Generate & Assign Tasks with AI</Btn>
          {Array.isArray(aiResult) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 8 }}>Tasks assigned per person</div>
              {aiResult.map((t, i) => (
                <div key={i} style={{ background: "#0f1117", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ color: PALETTE.text, fontWeight: 600, fontSize: 13 }}>{t.title}</span>
                    <span style={badge(t.priority)}>{t.priority}</span>
                  </div>
                  <div style={{ color: PALETTE.muted, fontSize: 12, marginBottom: 6 }}>{t.description}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontSize: 12, color: PALETTE.accent }}>👤 {t.assigned_to}</span>
                    {t.reason && <span style={{ fontSize: 11, color: PALETTE.muted, fontStyle: "italic" }}>{t.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {aiResult && !Array.isArray(aiResult) && (
            <div style={{ marginTop: 12, color: PALETTE.danger, fontSize: 13 }}>
              {typeof aiResult === "object" ? aiResult.error : aiResult}
            </div>
          )}
        </div>}

        {/* ── Meeting Summarizer ── all roles */}
        <div style={styles.card}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>📝</div>
          <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>Meeting Summarizer</h3>
          <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
            Paste a meeting transcript and get an AI-generated summary of decisions and action items.
          </p>
          <Textarea label="Transcript" value={transcript} onChange={e => setTranscript(e.target.value)}
            placeholder="Paste meeting transcript here…" style={{ height: 120 }} />
          <Btn loading={loading.meeting} onClick={summarizeMeeting} style={{ width: "100%" }}>Summarize Meeting</Btn>
          {meetingResult && (
            <ReportBox title="Meeting Summary" content={meetingResult} />
          )}
        </div>
        
        {/* ── Full Project Workflow Orchestrator ── PSM + PM only */}
        {canUseAgents && <div style={styles.card}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>⚡</div>
          <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>Full Project Workflow</h3>
          <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
            The Orchestrator Agent runs a complete automated workflow — generates all tasks,
            assigns them to the right people, and produces a full project report in one click.
          </p>
          <Select label="Project" value={orchProjectId} onChange={e => {
            setOrchProjectId(e.target.value);
            const p = projects.find(p => p.project_id === e.target.value);
            if (p) setOrchProjectTitle(p.title);
          }} options={[{ value: "", label: "Select project…" }, ...projects.map(p => ({ value: p.project_id, label: p.title }))]} />
          <Btn loading={loading.workflow} onClick={runFullWorkflow} style={{ width: "100%", background: "linear-gradient(135deg, #5b8af0, #9b8af0)" }}>
            ⚡ Run Full Workflow
          </Btn>
          {orchResult && (
            <div style={{ marginTop: 16 }}>
              {/* Tasks */}
              {Array.isArray(orchResult.generated_tasks) && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 8, fontWeight: 600 }}>
                    ✅ {orchResult.generated_tasks.length} Tasks Generated & Assigned
                  </div>
                  {orchResult.generated_tasks.map((t, i) => (
                    <div key={i} style={{ background: "#0f1117", borderRadius: 8, padding: 10, marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ color: PALETTE.text, fontWeight: 600, fontSize: 13 }}>{t.title}</span>
                        <span style={badge(t.priority)}>{t.priority}</span>
                      </div>
                      <span style={{ fontSize: 12, color: PALETTE.accent }}>👤 {t.assigned_to}</span>
                      {t.reason && <div style={{ fontSize: 11, color: PALETTE.muted, fontStyle: "italic", marginTop: 3 }}>{t.reason}</div>}
                    </div>
                  ))}
                </div>
              )}
              {/* Report */}
              {orchResult.report && (
                <>
                  <ReportBox title="Auto-Generated Project Report" content={orchResult.report} />
                  <button
                    onClick={() => downloadReportAsPDF(orchResult.report, "workflow-report.txt")}
                    style={{
                      marginTop: 12, width: "100%", padding: "9px 18px", borderRadius: 8,
                      border: `1px solid ${PALETTE.success}`, cursor: "pointer", fontSize: 13,
                      fontWeight: 600, background: "transparent", color: PALETTE.success,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    ⬇ Download Report
                  </button>
                </>
              )}
            </div>
          )}
        </div>}

        {/* ── AI Productivity Analysis ── PSM + PM only */}
        {canUseAgents && <div style={styles.card}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>🧬</div>
          <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>AI Productivity Analysis</h3>
          <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
            The Productivity Agent analyses every team member's workload, detects burnout risk,
            evaluates task distribution and gives actionable recommendations.
          </p>
          <Btn loading={loading.prodAnalysis} onClick={runProductivityAnalysis} style={{ width: "100%", background: "linear-gradient(135deg, #4caf7d, #5b8af0)" }}>
            🧬 Analyse Team Productivity
          </Btn>
          {productivityAnalysis && typeof productivityAnalysis === "object" && (
            <div style={{ marginTop: 16 }}>
              {/* Team Health */}
              {productivityAnalysis.team_health && (
                <div style={{ background: "#1a2540", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: PALETTE.accent, fontWeight: 600, marginBottom: 4 }}>🏥 Team Health</div>
                  <div style={{ fontSize: 13, color: PALETTE.text }}>{productivityAnalysis.team_health}</div>
                </div>
              )}
              {/* At Risk */}
              {productivityAnalysis.at_risk_members?.length > 0 && (
                <div style={{ background: "#2e1a1a", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: PALETTE.danger, fontWeight: 600, marginBottom: 4 }}>⚠ At Risk Members</div>
                  <div style={{ fontSize: 13, color: PALETTE.text }}>{productivityAnalysis.at_risk_members.join(", ")}</div>
                </div>
              )}
              {/* Top Performer */}
              {productivityAnalysis.top_performer && (
                <div style={{ background: "#1a2e24", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: PALETTE.success, fontWeight: 600, marginBottom: 4 }}>🏆 Top Performer</div>
                  <div style={{ fontSize: 13, color: PALETTE.text }}>{productivityAnalysis.top_performer}</div>
                </div>
              )}
              {/* Per Member */}
              <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 8, fontWeight: 600 }}>Individual Analysis</div>
              {productivityAnalysis.members?.map((m, i) => {
                const riskColor = { LOW: PALETTE.success, MEDIUM: PALETTE.warning, HIGH: PALETTE.danger }[m.burnout_risk] || PALETTE.muted;
                const workloadColor = { UNDERLOADED: PALETTE.muted, BALANCED: PALETTE.success, OVERLOADED: PALETTE.danger }[m.workload_status] || PALETTE.muted;
                return (
                  <div key={i} style={{ background: "#0f1117", borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${PALETTE.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ color: PALETTE.text, fontWeight: 700, fontSize: 14 }}>{m.name}</span>
                      <span style={{ color: PALETTE.accent, fontWeight: 700, fontSize: 16 }}>{m.productivity_score}<span style={{ fontSize: 11, color: PALETTE.muted }}>/100</span></span>
                    </div>
                    {/* Score bar */}
                    <div style={{ background: PALETTE.border, borderRadius: 99, height: 5, marginBottom: 10, overflow: "hidden" }}>
                      <div style={{ width: `${m.productivity_score}%`, height: "100%", background: PALETTE.accent, borderRadius: 99 }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#1a1a2e", color: riskColor, fontWeight: 600 }}>
                        🔥 Burnout: {m.burnout_risk}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#1a1a2e", color: workloadColor, fontWeight: 600 }}>
                        ⚖ Workload: {m.workload_status}
                      </span>
                    </div>
                    {m.strengths && <div style={{ fontSize: 12, color: PALETTE.success, marginBottom: 4 }}>💪 {m.strengths}</div>}
                    {m.recommendations && <div style={{ fontSize: 12, color: PALETTE.warning }}>💡 {m.recommendations}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {productivityAnalysis && typeof productivityAnalysis === "string" && (
            <div style={{ marginTop: 12, color: PALETTE.danger, fontSize: 13 }}>{productivityAnalysis}</div>
          )}
        </div>}
        {/* ── Member Performance Report ── all roles (TEAM_MEMBER sees own only) ── */}
        {(canMemberReport || isMember) && (
          <div style={styles.card}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>👤</div>
            <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>Member Performance Report</h3>
            <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
              {isMember
                ? "Generate an AI report on your own task performance and productivity."
                : "Generate an AI performance report for any individual team member."}
            </p>
            {!isMember ? (
              <Select
                label="Select Member"
                value={selectedMemberId}
                onChange={e => { setSelectedMemberId(e.target.value); setMemberReport(null); }}
                options={[
                  { value: "", label: "Choose a member…" },
                  ...users.map(u => ({ value: u.user_id, label: `${u.name} — ${u.role?.replace(/_/g, " ")}` })),
                ]}
              />
            ) : (
              <div style={{ background: PALETTE.accentSoft, borderRadius: 8, marginBottom: 14, padding: "10px 14px" }}>
                <span style={{ fontSize: 13, color: PALETTE.accent, fontWeight: 600 }}>
                  📋 Generating report for: {user?.name || user?.email}
                </span>
              </div>
            )}
            <Btn
              loading={loading.memberReport}
              onClick={generateMemberReport}
              style={{ width: "100%" }}
              variant={selectedMemberId || isMember ? "primary" : "ghost"}
            >
              Generate Member Report
            </Btn>
            {memberReport && (
              <>
                <ReportBox title="Member Performance Report" content={memberReport} />
                <button
                  onClick={() => downloadReportAsPDF(memberReport, `member-report-${selectedMemberId || "me"}.txt`)}
                  style={{
                    marginTop: 12, width: "100%", padding: "9px 18px", borderRadius: 8,
                    border: `1px solid ${PALETTE.success}`, cursor: "pointer", fontSize: 13,
                    fontWeight: 600, background: "transparent", color: PALETTE.success,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  ⬇ Download Report
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Overall Project Report ── PROJECT_SUCCESS_MANAGER and PROJECT_MANAGER only ── */}
        {canOverallReport && (
          <div style={styles.card}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>📊</div>
            <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>Overall Project Report</h3>
            <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
              Generate a comprehensive AI analysis report across all projects and full team performance.
            </p>
            <Btn loading={loading.overallReport} onClick={generateOverallReport} style={{ width: "100%" }}>
              Generate Overall AI Report
            </Btn>
            {overallReport && (
              <>
                <ReportBox title="Overall Project Report" content={overallReport} />
                {role === "PROJECT_SUCCESS_MANAGER" && (
                  <button
                    onClick={() => downloadReportAsPDF(overallReport, "overall-project-report.txt")}
                    style={{
                      marginTop: 12, width: "100%", padding: "9px 18px", borderRadius: 8,
                      border: `1px solid ${PALETTE.success}`, cursor: "pointer", fontSize: 13,
                      fontWeight: 600, background: "transparent", color: PALETTE.success,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    ⬇ Download Report
                  </button>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// PRODUCTIVITY
function ProductivityPage({ toast }) {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch("/productivity/all"), apiFetch("/user/all")])
      .then(([p, u]) => { setData(p); setUsers(u); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const userName = id => users.find(u => u.user_id === id)?.name || id?.slice(0, 8);
  const total = data.reduce((a, d) => a + (d.tasks_completed || 0), 0);
  const top = data.reduce((a, d) => (!a || (d.tasks_completed || 0) > (a.tasks_completed || 0)) ? d : a, null);

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: PALETTE.text }}>Productivity</h2>
      {loading ? <div style={{ color: PALETTE.muted }}>Loading…</div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
            <Stat label="Total Tasks Completed" value={total} color={PALETTE.success} />
            <Stat label="Team Members Tracked" value={data.length} color={PALETTE.accent} />
            {top && <Stat label="Top Performer" value={userName(top.user_id)} color={PALETTE.warning} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.map(d => {
              const max = Math.max(...data.map(x => x.tasks_completed || 0), 1);
              const pct = ((d.tasks_completed || 0) / max) * 100;
              return (
                <div key={d.id || d.user_id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: PALETTE.text, fontSize: 14, fontWeight: 600 }}>{userName(d.user_id)}</span>
                    <span style={{ color: PALETTE.muted, fontSize: 13 }}>{d.tasks_completed || 0} completed</span>
                  </div>
                  <div style={{ background: PALETTE.border, borderRadius: 99, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: PALETTE.accent, borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
            {!data.length && <div style={{ color: PALETTE.muted, fontSize: 14 }}>No productivity data yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}

// USERS
function UsersPage({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/user/all").then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const initials = name => name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const roleColors = {
    PROJECT_SUCCESS_MANAGER: "#e8c44c",
    PROJECT_MANAGER: "#5b8af0",
    TEAM_LEAD: "#9b8af0",
    TEAM_MEMBER: "#4cafa4",
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: PALETTE.text }}>Team Members</h2>
      {loading ? <div style={{ color: PALETTE.muted }}>Loading…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {users.map(u => (
            <div key={u.user_id} style={styles.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", background: PALETTE.accentSoft, color: PALETTE.accent,
                  fontWeight: 700, fontSize: 14,
                }}>{initials(u.name)}</div>
                <div>
                  <div style={{ color: PALETTE.text, fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <div style={{ color: PALETTE.muted, fontSize: 12 }}>{u.email}</div>
                </div>
              </div>
              <span style={badge(u.role)}>{u.role?.replace(/_/g, " ")}</span>
              <div style={{ marginTop: 8, fontSize: 12, color: u.is_available ? PALETTE.success : PALETTE.danger }}>
                {u.is_available ? "● Available" : "● Unavailable"}
              </div>
            </div>
          ))}
          {!users.length && <div style={{ color: PALETTE.muted, fontSize: 14 }}>No users found.</div>}
        </div>
      )}
    </div>
  );
}

// DASHBOARD
function DashboardPage({ user }) {
  const [stats, setStats] = useState({ tasks: 0, projects: 0, users: 0 });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch("/tasks/all"), apiFetch("/projects/all"), apiFetch("/user/all")])
      .then(([t, p, u]) => {
        setTasks(t);
        setStats({ tasks: t.length, projects: p.length, users: u.length });
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const byStatus = TASK_STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s).length }), {});

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", color: PALETTE.text }}>Welcome back 👋</h2>
        <p style={{ color: PALETTE.muted, margin: 0, fontSize: 14 }}>
          Signed in as <span style={{ color: PALETTE.accent }}>{user?.email}</span> — {user?.role?.replace(/_/g, " ")}
        </p>
      </div>
      {loading ? <div style={{ color: PALETTE.muted }}>Loading…</div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
            <Stat label="Total Tasks" value={stats.tasks} color={PALETTE.accent} />
            <Stat label="Projects" value={stats.projects} color={PALETTE.warning} />
            <Stat label="Team Members" value={stats.users} color={PALETTE.success} />
            <Stat label="Completed" value={byStatus.COMPLETED || 0} color={PALETTE.success} />
          </div>

          <h3 style={{ color: PALETTE.text, fontSize: 15, marginBottom: 14 }}>Task Status Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 28 }}>
            {TASK_STATUSES.map(s => (
              <div key={s} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={badge(s)}>{s}</span>
                  <div style={{ fontSize: 26, fontWeight: 700, color: PALETTE.text, marginTop: 8 }}>{byStatus[s] || 0}</div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ color: PALETTE.text, fontSize: 15, marginBottom: 14 }}>Recent Tasks</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.slice(0, 5).map(t => (
              <div key={t.task_id} style={{ ...styles.card, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={badge(t.status)}>{t.status}</span>
                <span style={{ color: PALETTE.text, fontSize: 14, flex: 1 }}>{t.title}</span>
                <span style={badge(t.priority)}>{t.priority}</span>
              </div>
            ))}
            {!tasks.length && <div style={{ color: PALETTE.muted, fontSize: 14 }}>No tasks yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "projects", label: "Projects", icon: "📁" },
  { id: "teams", label: "Teams", icon: "👥" },
  { id: "tasks", label: "Tasks", icon: "✓" },
  { id: "ai", label: "AI Tools", icon: "🤖" },
  { id: "productivity", label: "Productivity", icon: "📈" },
  { id: "users", label: "Users", icon: "👤" },
];

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [page, setPage] = useState("dashboard");
  const [toast, setToast_] = useState({ msg: "", type: "info" });
  const user = getUser();

  function showToast(msg, type = "info") {
    setToast_({ msg, type });
    setTimeout(() => setToast_({ msg: "", type: "info" }), 3000);
  }

  function logout() { clearToken(); setAuthed(false); }

  if (!authed) return <AuthPage onAuth={() => setAuthed(true)} />;

  const pages = {
    dashboard: <DashboardPage user={user} />,
    projects: <ProjectsPage toast={showToast} user={user} />,
    teams: <TeamsPage toast={showToast} user={user} />,
    tasks: <TasksPage toast={showToast} user={user} />,
    ai: <AIPage toast={showToast} user={user} />,
    productivity: <ProductivityPage toast={showToast} />,
    users: <UsersPage toast={showToast} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: PALETTE.bg, fontFamily: "'Segoe UI', system-ui, sans-serif", color: PALETTE.text }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: PALETTE.surface, borderRight: `1px solid ${PALETTE.border}`,
        display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${PALETTE.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>⚡</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: PALETTE.text }}>AI Task Manager</div>
          <div style={{ fontSize: 11, color: PALETTE.muted, marginTop: 2 }}>{user?.role?.replace(/_/g, " ")}</div>
        </div>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
            background: page === n.id ? PALETTE.accentSoft : "none", border: "none", cursor: "pointer",
            color: page === n.id ? PALETTE.accent : PALETTE.muted, fontSize: 13, fontWeight: page === n.id ? 600 : 400,
            textAlign: "left", borderLeft: `3px solid ${page === n.id ? PALETTE.accent : "transparent"}`,
          }}>
            <span>{n.icon}</span> {n.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${PALETTE.border}` }}>
          <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 8, wordBreak: "break-all" }}>{user?.email}</div>
          <button onClick={logout} style={{
            width: "100%", padding: "7px 0", borderRadius: 7, border: `1px solid ${PALETTE.border}`,
            background: "none", color: PALETTE.danger, cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", minWidth: 0 }}>
        {pages[page]}
      </main>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
