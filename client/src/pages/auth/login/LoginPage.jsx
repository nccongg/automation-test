import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useLogin } from "@/hooks/useAuth";
import AuthLayout from "@/components/shared/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Sub-components ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.64Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.86-3c-1.07.72-2.43 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.97H1.27v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.25 14.27A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.38-2.27V6.64H1.27A12 12 0 0 0 0 12c0 1.93.46 3.75 1.27 5.36l3.98-3.09Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.33.61 4.57 1.8l3.43-3.43C17.95 1.14 15.24 0 12 0A12 12 0 0 0 1.27 6.64l3.98 3.09C6.2 6.88 8.86 4.77 12 4.77Z" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

/**
 * LoginPage — pure UI.
 * Toàn bộ form logic (state, API call, error) được xử lý trong useLogin hook.
 */
export default function LoginPage() {
  // UI-only state — không liên quan đến business logic
  const [showPassword, setShowPassword] = useState(false);

  // Business logic từ hook
  const { formData, error, isLoading, handleChange, handleSubmit } = useLogin();

  return (
    <AuthLayout title="Nice to see you again!">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-600">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Email or phone number"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="h-11 rounded-[4px] border-slate-300 text-sm shadow-none placeholder:text-slate-400"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-slate-600">
              Password
            </Label>
            <Link
              to="/forgot-password"
              className="text-sm text-slate-500 transition hover:text-slate-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="h-11 rounded-[4px] border-slate-300 pr-10 text-sm shadow-none placeholder:text-slate-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            checked={formData.rememberMe}
            onCheckedChange={(checked) => handleChange("rememberMe", Boolean(checked))}
            className="border-slate-300 data-[state=checked]:border-slate-700 data-[state=checked]:bg-slate-700"
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal text-slate-500">
            Remember me
          </Label>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded border border-red-100 bg-red-50 p-3 text-xs text-red-500">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          style={{
            background: "var(--brand-primary)",
            boxShadow: "var(--brand-primary-shadow)",
          }}
          className="h-11 w-full rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Logging in…" : "Log in"}
        </Button>

        {/* Divider */}
        <div className="h-px w-full bg-slate-200" />

        {/* Google sign-in */}
        <Button
          type="button"
          style={{ background: "var(--brand-dark)" }}
          className="h-11 w-full rounded-md text-sm font-semibold text-white transition hover:opacity-90"
        >
          <span className="mr-3 inline-flex items-center">
            <GoogleIcon />
          </span>
          Sign in with Google
        </Button>

        {/* Footer */}
        <p className="pt-2 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}