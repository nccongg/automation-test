import { Link } from "react-router-dom";

import { useForgotPassword } from "@/features/auth/hooks/useAuth";
import AuthLayout from "@/shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const { email, setEmail, error, isLoading, handleSubmit } = useForgotPassword();

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a 5-digit code."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="resetEmail"
            className="text-sm font-medium text-slate-700"
          >
            Email address
          </Label>
          <Input
            id="resetEmail"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-lg border-slate-200 bg-slate-50 text-sm shadow-none placeholder:text-slate-400 focus:bg-white"
            required
          />
        </div>

        {error && (
          <div className="rounded border border-red-100 bg-red-50 p-3 text-xs text-red-500">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-lg bg-[#1692ff] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(22,146,255,0.3)] hover:bg-[#0f83e8] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading ? "Sending…" : "Send reset code"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#1692ff] hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}