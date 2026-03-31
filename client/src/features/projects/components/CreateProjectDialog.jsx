import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorBanner from "@/shared/components/common/ErrorBanner";
import { createProject } from "@/features/projects/api/projectsApi";

const AUTH_TYPES = [
  { value: "none", label: "None (public site)" },
  { value: "form", label: "Username / Password (form login)" },
  { value: "cookie", label: "Session cookie" },
];

export default function CreateProjectDialog({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth config state
  const [authType, setAuthType] = useState("none");
  const [loginUrl, setLoginUrl] = useState("");
  const [usernameSelector, setUsernameSelector] = useState("");
  const [passwordSelector, setPasswordSelector] = useState("");
  const [submitSelector, setSubmitSelector] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cookieName, setCookieName] = useState("");
  const [cookieValue, setCookieValue] = useState("");

  const canSubmit = useMemo(() => {
    if (!name.trim() || !description.trim() || !baseUrl.trim()) return false;
    if (authType === "form") {
      return (
        loginUrl.trim() &&
        usernameSelector.trim() &&
        passwordSelector.trim() &&
        submitSelector.trim() &&
        username.trim() &&
        password.trim()
      );
    }
    if (authType === "cookie") {
      return cookieName.trim() && cookieValue.trim();
    }
    return true;
  }, [
    name, description, baseUrl, authType,
    loginUrl, usernameSelector, passwordSelector, submitSelector, username, password,
    cookieName, cookieValue,
  ]);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setBaseUrl("");
    setError("");
    setIsSubmitting(false);
    setAuthType("none");
    setLoginUrl("");
    setUsernameSelector("");
    setPasswordSelector("");
    setSubmitSelector("");
    setUsername("");
    setPassword("");
    setCookieName("");
    setCookieValue("");
  }, [open]);

  function buildAuthConfig() {
    if (authType === "form") {
      return {
        type: "form",
        loginUrl: loginUrl.trim(),
        usernameSelector: usernameSelector.trim(),
        passwordSelector: passwordSelector.trim(),
        submitSelector: submitSelector.trim(),
        username: username.trim(),
        password,
      };
    }
    if (authType === "cookie") {
      return {
        type: "cookie",
        cookies: [{ name: cookieName.trim(), value: cookieValue.trim() }],
      };
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Please fill in all required fields.");
      return;
    }

    const authConfig = buildAuthConfig();
    const payload = {
      name: name.trim(),
      description: description.trim(),
      base_url: baseUrl.trim(),
      // stored in projects.config JSONB
      config: authConfig ? { auth: authConfig } : {},
    };

    try {
      setIsSubmitting(true);
      const created = await createProject(payload);
      onCreated?.(created);
      onOpenChange?.(false);
    } catch (err) {
      setError(err?.message || "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="max-w-xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new test automation project for your website
          </DialogDescription>
        </DialogHeader>

        {error && (
          <ErrorBanner
            message={error}
            fullWidth
            onDismiss={() => setError("")}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Core fields ─────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g., Ecommerce Test"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Project Description</Label>
            <textarea
              id="project-description"
              placeholder="Enter project description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-base-url">Base URL</Label>
            <Input
              id="project-base-url"
              placeholder="https://yoursite.com"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* ── Auth config ─────────────────────────────────────────────── */}
          <div className="space-y-3 rounded-md border border-dashed border-input p-4">
            <div className="space-y-1">
              <Label htmlFor="auth-type">Site Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Required so the crawler can access protected pages before generating test cases.
              </p>
            </div>

            <select
              id="auth-type"
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {AUTH_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {authType === "form" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="login-url">Login Page URL</Label>
                  <Input
                    id="login-url"
                    placeholder="/login  or  https://yoursite.com/login"
                    value={loginUrl}
                    onChange={(e) => setLoginUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="username-selector">Username selector</Label>
                    <Input
                      id="username-selector"
                      placeholder="#email"
                      value={usernameSelector}
                      onChange={(e) => setUsernameSelector(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-selector">Password selector</Label>
                    <Input
                      id="password-selector"
                      placeholder="#password"
                      value={passwordSelector}
                      onChange={(e) => setPasswordSelector(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="submit-selector">Submit button selector</Label>
                  <Input
                    id="submit-selector"
                    placeholder="button[type=submit]"
                    value={submitSelector}
                    onChange={(e) => setSubmitSelector(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="auth-username">Username</Label>
                    <Input
                      id="auth-username"
                      autoComplete="off"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth-password">Password</Label>
                    <Input
                      id="auth-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}

            {authType === "cookie" && (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  Paste a session cookie from your browser DevTools (Application → Cookies).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cookie-name">Cookie name</Label>
                    <Input
                      id="cookie-name"
                      placeholder="session"
                      value={cookieName}
                      onChange={(e) => setCookieName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cookie-value">Cookie value</Label>
                    <Input
                      id="cookie-value"
                      placeholder="abc123..."
                      value={cookieValue}
                      onChange={(e) => setCookieValue(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full sm:w-auto bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" label="Creating..." />
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
