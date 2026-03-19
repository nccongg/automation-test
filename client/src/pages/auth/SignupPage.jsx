import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useSignup } from '@/features/auth/hooks/useAuth';
import AuthLayout from '@/shared/components/layout/AuthLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Page ──────────────────────────────────────────────────────────────────────

/**
 * SignupPage — pure UI.
 * Toàn bộ form logic (validation, API call, error) được xử lý trong useSignup hook.
 */
export default function SignupPage() {
  // UI-only state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Business logic từ hook
  const { formData, error, isLoading, handleChange, handleSubmit } = useSignup();

  return (
    <AuthLayout title="Create your account" subtitle="Start automating your tests in minutes.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="signupEmail" className="text-sm font-medium text-slate-700">
            Email address
          </Label>
          <Input
            id="signupEmail"
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="h-11 rounded-lg border-slate-200 bg-slate-50 text-sm shadow-none placeholder:text-slate-400 focus:bg-white"
            required
          />
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
            Full name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className="h-11 rounded-lg border-slate-200 bg-slate-50 text-sm shadow-none placeholder:text-slate-400 focus:bg-white"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="signupPassword" className="text-sm font-medium text-slate-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="signupPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="h-11 rounded-lg border-slate-200 bg-slate-50 pr-10 text-sm shadow-none placeholder:text-slate-400 focus:bg-white"
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              className="h-11 rounded-lg border-slate-200 bg-slate-50 pr-10 text-sm shadow-none placeholder:text-slate-400 focus:bg-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          style={{
            background: "var(--brand-primary)",
            boxShadow: "var(--brand-primary-shadow-sm)",
          }}
          className="h-11 w-full rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Creating account…" : "Create account"}
        </Button>

        {/* Footer */}
        <p className="pt-1 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[var(--brand-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}