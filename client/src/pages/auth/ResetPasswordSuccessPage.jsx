import { Link } from "react-router-dom";

import AuthLayout from "@/shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";

export default function ResetPasswordSuccessPage() {
  return (
    <AuthLayout
      title="Password reset! 🔐"
      subtitle="Your password has been reset successfully."
    >
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <svg
            className="h-8 w-8 text-[#1692ff]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <p className="text-sm leading-6 text-slate-500">
          You can now sign in with your new password.
        </p>

        <Button
          asChild
          className="h-11 w-full rounded-lg bg-[#1692ff] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(22,146,255,0.3)] hover:bg-[#0f83e8] active:scale-[0.98] transition-all"
        >
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}