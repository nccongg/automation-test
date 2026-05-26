import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Settings, Globe, KeyRound, Trash2, AlertTriangle, Save, X, Eye, EyeOff,
} from "lucide-react";
import { updateProject, deleteProject } from "@/features/projects/api/projectsApi";
import PageHeader from "@/shared/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUTH_TYPES = [
  { value: "none", label: "None (public site)" },
  { value: "form", label: "Username / Password (form login)" },
  { value: "cookie", label: "Session cookie" },
];

function Section({ icon, title, description, children }) {
  const SectionIcon = icon;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/50">
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-500/10">
          <SectionIcon className="size-4 text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Auth config editor ───────────────────────────────────────────────────────

function AuthConfigEditor({ value, onChange }) {
  const authType = value?.type || "none";
  const [showPassword, setShowPassword] = useState(false);

  function setType(type) {
    if (type === "none") onChange(null);
    else if (type === "form") onChange({ type: "form", loginUrl: "", usernameSelector: "", passwordSelector: "", submitSelector: "", username: "", password: "" });
    else onChange({ type: "cookie", cookies: [{ name: "", value: "" }] });
  }

  function patch(fields) {
    onChange({ ...value, ...fields });
  }

  function patchCookie(fields) {
    const cookies = [...(value?.cookies || [{ name: "", value: "" }])];
    cookies[0] = { ...cookies[0], ...fields };
    onChange({ ...value, cookies });
  }

  const cookie = value?.cookies?.[0] || { name: "", value: "" };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Authentication type</Label>
        <select
          value={authType}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        >
          {AUTH_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {authType === "form" && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="ps-login-url">Login page URL</Label>
            <Input
              id="ps-login-url"
              placeholder="/login  or  https://yoursite.com/login"
              value={value?.loginUrl || ""}
              onChange={(e) => patch({ loginUrl: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ps-username-sel">Username selector</Label>
              <Input
                id="ps-username-sel"
                placeholder="#email"
                value={value?.usernameSelector || ""}
                onChange={(e) => patch({ usernameSelector: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ps-password-sel">Password selector</Label>
              <Input
                id="ps-password-sel"
                placeholder="#password"
                value={value?.passwordSelector || ""}
                onChange={(e) => patch({ passwordSelector: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ps-submit-sel">Submit button selector</Label>
            <Input
              id="ps-submit-sel"
              placeholder="button[type=submit]"
              value={value?.submitSelector || ""}
              onChange={(e) => patch({ submitSelector: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ps-username">Username</Label>
              <Input
                id="ps-username"
                autoComplete="off"
                value={value?.username || ""}
                onChange={(e) => patch({ username: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ps-password">Password</Label>
              <div className="relative">
                <Input
                  id="ps-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={value?.password || ""}
                  onChange={(e) => patch({ password: e.target.value })}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {authType === "cookie" && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">
            Paste a session cookie from your browser DevTools (Application → Cookies).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ps-cookie-name">Cookie name</Label>
              <Input
                id="ps-cookie-name"
                placeholder="session"
                value={cookie.name}
                onChange={(e) => patchCookie({ name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ps-cookie-value">Cookie value</Label>
              <Input
                id="ps-cookie-value"
                placeholder="abc123…"
                value={cookie.value}
                onChange={(e) => patchCookie({ value: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {authType === "none" && (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/30 px-4 py-3">
          No authentication — the agent will access pages as a guest.
        </p>
      )}
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteProjectDialog({ projectTitle, onConfirm, onCancel, loading }) {
  const [inputVal, setInputVal] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
        <div className="flex size-11 items-center justify-center rounded-xl bg-red-500/10 mb-4">
          <Trash2 className="size-5 text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Delete Project</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          This will permanently delete{" "}
          <span className="font-semibold text-foreground">{projectTitle}</span> and all
          associated test cases, runs, and objects. This action cannot be undone.
        </p>
        <div className="space-y-2 mb-5">
          <Label className="text-xs text-muted-foreground">
            Type <span className="font-mono font-semibold text-foreground">{projectTitle}</span> to confirm
          </Label>
          <Input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={projectTitle}
            className="font-mono"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            <X className="size-4 mr-1.5" /> Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || inputVal !== projectTitle}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Deleting…" : "Delete Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectSettingsPage() {
  const { project, projectId, onProjectUpdated } = useOutletContext();
  const navigate = useNavigate();

  // General fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [generalDirty, setGeneralDirty] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Auth config
  const [authConfig, setAuthConfig] = useState(null);
  const [authDirty, setAuthDirty] = useState(false);
  const [savingAuth, setSavingAuth] = useState(false);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!project) return;
    setName(project.title || "");
    setDescription(project.description || "");
    setBaseUrl(project.baseUrl || "");
    setAuthConfig(project.config?.auth ?? null);
    setGeneralDirty(false);
    setAuthDirty(false);
  }, [project]);

  async function handleSaveGeneral(e) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Project name is required"); return; }
    setSavingGeneral(true);
    try {
      await updateProject(projectId, {
        name: name.trim(),
        description: description.trim(),
        base_url: baseUrl.trim(),
      });
      setGeneralDirty(false);
      onProjectUpdated?.();
      toast.success("General settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save");
    } finally {
      setSavingGeneral(false);
    }
  }

  async function handleSaveAuth(e) {
    e.preventDefault();
    setSavingAuth(true);
    try {
      const newConfig = { ...(project.config || {}), auth: authConfig };
      await updateProject(projectId, { config: newConfig });
      setAuthDirty(false);
      onProjectUpdated?.();
      toast.success("Account settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save");
    } finally {
      setSavingAuth(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProject(projectId);
      toast.success("Project deleted");
      navigate("/projects");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete project");
      setDeleting(false);
      setShowDelete(false);
    }
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Settings"
        description="Manage your project details and authentication"
      />

      {/* General */}
      <Section icon={Settings} title="General" description="Project name, description, and base URL">
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ps-name">Project Name</Label>
            <Input
              id="ps-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setGeneralDirty(true); }}
              placeholder="e.g., E-commerce Test Suite"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ps-description">Description</Label>
            <textarea
              id="ps-description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setGeneralDirty(true); }}
              placeholder="Brief description of what this project tests…"
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ps-base-url">
              <Globe className="size-3.5 inline mr-1 text-muted-foreground" />
              Base URL
            </Label>
            <Input
              id="ps-base-url"
              value={baseUrl}
              onChange={(e) => { setBaseUrl(e.target.value); setGeneralDirty(true); }}
              placeholder="https://example.com"
            />
            <p className="text-[11px] text-muted-foreground">The root URL the agent navigates relative to</p>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={!generalDirty || savingGeneral}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Save className="size-4" />
              {savingGeneral ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Section>

      {/* Account / Auth config */}
      <Section
        icon={KeyRound}
        title="Account"
        description="Login credentials the agent uses to access protected pages"
      >
        <form onSubmit={handleSaveAuth} className="space-y-4">
          <AuthConfigEditor
            value={authConfig}
            onChange={(v) => { setAuthConfig(v); setAuthDirty(true); }}
          />
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={!authDirty || savingAuth}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Save className="size-4" />
              {savingAuth ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Section>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-red-500/15 bg-red-500/5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10">
            <AlertTriangle className="size-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-500">Danger Zone</p>
            <p className="text-xs text-red-500/70 mt-0.5">Irreversible and destructive actions</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Delete this project</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently removes all test cases, runs, objects, and data.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDelete(true)}
              className="shrink-0 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="size-4 mr-1.5" />
              Delete Project
            </Button>
          </div>
        </div>
      </div>

      {showDelete && (
        <DeleteProjectDialog
          projectTitle={name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
    </div>
  );
}
