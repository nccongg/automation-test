import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import AuthLayout from "@/components/shared/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Reset password form:", formData);
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Your new password must be at least 8 characters."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password */}
        <div className="space-y-2">
          <Label
            htmlFor="newPassword"
            className="text-sm font-medium text-slate-700"
          >
            New password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
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
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label
            htmlFor="confirmNewPassword"
            className="text-sm font-medium text-slate-700"
          >
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirmNewPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat your new password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleChange("confirmPassword", e.target.value)
              }
              className="h-11 rounded-lg border-slate-200 bg-slate-50 pr-10 text-sm shadow-none placeholder:text-slate-400 focus:bg-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg bg-[#1692ff] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(22,146,255,0.3)] hover:bg-[#0f83e8] active:scale-[0.98] transition-all"
        >
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}