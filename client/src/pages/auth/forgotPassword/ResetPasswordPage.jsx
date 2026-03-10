import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import AuthLayout from "@/components/shared/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import authBanner from "@/assets/auth-banner.svg";

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
      pageLabel="Forgot Password #6"
      title="Forgot Password"
      imageSrc={authBanner}
      imageAlt="Authentication banner"
    >
      <div className="space-y-6">
        <p className="-mt-2 text-center text-sm text-slate-400">
          Enter your new password
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-sm font-medium text-slate-600"
            >
              New password
            </Label>

            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new your password"
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmNewPassword"
              className="text-sm font-medium text-slate-600"
            >
              Confirm password
            </Label>

            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                className="h-11 rounded-[4px] border-slate-300 pr-10 text-sm shadow-none placeholder:text-slate-400"
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
            className="h-11 w-full rounded-md bg-[#1692ff] text-sm font-semibold text-white shadow-[0_6px_14px_rgba(22,146,255,0.28)] hover:bg-[#0f83e8]"
          >
            Reset Password
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}