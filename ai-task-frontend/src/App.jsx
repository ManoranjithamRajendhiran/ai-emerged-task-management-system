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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "TEAM_MEMBER", skills: "", github_url: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      if (mode === "register") {
       await apiFetch("/auth/register", { 
        method: "POST", 
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          skills: form.skills,
          github_url: form.github_url
        }) 
      });
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
            <>
              <Select label="Role" value={form.role} onChange={set("role")} options={ROLES.map(r => ({ value: r, label: r.replace(/_/g, " ") }))} />
              <Input label="Skills (comma separated)" value={form.skills} onChange={set("skills")} placeholder="React, Python, FastAPI, SQL" />
              <Input label="GitHub Profile URL" value={form.github_url} onChange={set("github_url")} placeholder="https://github.com/yourusername" />
            </>
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
  apiFetch("/teams/all").then(setTeams).catch(() => {});
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

// AI TOOLS
function AIPage({ toast, user }) {
  const [projects, setProjects] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [meetingResult, setMeetingResult] = useState(null);
  const [report, setReport] = useState(null);
  const [teamSuggest, setTeamSuggest] = useState(null);
  const [teamProjectTitle, setTeamProjectTitle] = useState("");
  const [teamProjectDesc, setTeamProjectDesc] = useState("");
  const [loading, setLoading] = useState({});
  const set = k => v => setLoading(l => ({ ...l, [k]: v }));
  const canReport = user?.role === "PROJECT_SUCCESS_MANAGER";

  useEffect(() => { apiFetch("/projects/all").then(setProjects).catch(() => {}); }, []);

  async function generateTasks() {
    set("tasks")(true);
    try {
      const res = await apiFetch(`/ai/generate-tasks?project_title=${encodeURIComponent(projectTitle)}&project_id=${projectId}`, { method: "POST" });
      setAiResult(res.ai_tasks);
    } catch (ex) { toast(ex.message, "error"); }
    set("tasks")(false);
  }

  async function suggestTeam() {
    set("team")(true);
    try {
      const res = await apiFetch(`/ai/suggest-team?project_title=${encodeURIComponent(teamProjectTitle)}&project_description=${encodeURIComponent(teamProjectDesc)}`, { method: "POST" });
      setTeamSuggest(res.suggestion);
    } catch (ex) { toast(ex.message, "error"); }
    set("team")(false);
  }

  async function summarizeMeeting() {
    set("meeting")(true);
    try {
      const res = await apiFetch(`/meeting/summarize?transcript=${encodeURIComponent(transcript)}`, { method: "POST" });
      setMeetingResult(res.meeting_summary);
    } catch (ex) { toast(ex.message, "error"); }
    set("meeting")(false);
  }

  async function generateReport() {
    set("report")(true);
    try {
      const res = await apiFetch("/reports/generate");
      setReport(res.report);
    } catch (ex) { toast(ex.message, "error"); }
    set("report")(false);
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: PALETTE.text }}>AI Tools</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>

        {/* AI Team Suggester */}
        <div style={styles.card}>
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
                <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 6 }}>Suggested Team Lead</div>
                <div style={{ color: PALETTE.accent, fontWeight: 700, fontSize: 14 }}>{teamSuggest.suggested_team_lead?.name}</div>
                <div style={{ color: PALETTE.muted, fontSize: 12, marginTop: 4 }}>{teamSuggest.suggested_team_lead?.reason}</div>
              </div>
              <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 8 }}>Suggested Members</div>
              {teamSuggest.suggested_members?.map((m, i) => (
                <div key={i} style={{ background: "#0f1117", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
        </div>

        {/* Generate Tasks per person */}
        <div style={styles.card}>
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: PALETTE.accent }}>👤 {t.assigned_to}</span>
                    {t.reason && <span style={{ fontSize: 11, color: PALETTE.muted, fontStyle: "italic" }}>{t.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meeting Summarizer */}
        <div style={styles.card}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>📝</div>
          <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>Meeting Summarizer</h3>
          <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
            Paste a meeting transcript and get an AI-generated summary of decisions and action items.
          </p>
          <Textarea label="Transcript" value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste meeting transcript here…" style={{ height: 120 }} />
          <Btn loading={loading.meeting} onClick={summarizeMeeting} style={{ width: "100%" }}>Summarize Meeting</Btn>
          {meetingResult && (
            <div style={{ marginTop: 16, background: "#0f1117", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 8 }}>Summary</div>
              <p style={{ color: PALETTE.text, fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{meetingResult}</p>
            </div>
          )}
        </div>

        {/* AI Report */}
        {canReport && (
          <div style={styles.card}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>📊</div>
            <h3 style={{ margin: "0 0 6px", color: PALETTE.text, fontSize: 15 }}>Project Report</h3>
            <p style={{ color: PALETTE.muted, fontSize: 13, margin: "0 0 16px" }}>
              Generate a comprehensive AI analysis report across all projects and team performance.
            </p>
            <Btn loading={loading.report} onClick={generateReport} style={{ width: "100%" }}>Generate AI Report</Btn>
            {report && (
              <div style={{ marginTop: 16, background: "#0f1117", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: PALETTE.muted, marginBottom: 8 }}>Report</div>
                <p style={{ color: PALETTE.text, fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{report}</p>
              </div>
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
