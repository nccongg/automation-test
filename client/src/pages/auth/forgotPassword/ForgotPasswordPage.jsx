import { useState } from "react";

import AuthLayout from "@/components/shared/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import authBanner from "@/assets/auth-banner.svg";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Forgot password email:", email);
  };

  return (
    <AuthLayout
      pageLabel="Forgot Password"
      title="Forgot Password"
      imageSrc={authBanner}
      imageAlt="Authentication banner"
    >
      <div className="space-y-6">
        <p className="-mt-2 text-center text-sm text-slate-400">
          Enter your email to reset the password
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="resetEmail"
              className="text-sm font-medium text-slate-600"
            >
              Email Address
            </Label>
            <Input
              id="resetEmail"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-[4px] border-slate-300 text-sm shadow-none placeholder:text-slate-400"
              required
            />
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