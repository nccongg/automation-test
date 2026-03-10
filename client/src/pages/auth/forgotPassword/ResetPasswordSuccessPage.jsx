import { Link } from "react-router-dom";

import AuthLayout from "@/components/shared/AuthLayout";
import { Button } from "@/components/ui/button";

import authBanner from "@/assets/auth-banner.svg";

export default function ResetPasswordSuccessPage() {
  return (
    <AuthLayout
      pageLabel="Forgot Password #7"
      title="Password Reset"
      imageSrc={authBanner}
      imageAlt="Authentication banner"
    >
      <div className="space-y-6 text-center">
        <p className="-mt-2 text-sm leading-6 text-slate-400">
          Your password has been reset successfully, Login now!
        </p>

        <Button
          asChild
          className="h-11 w-full rounded-md bg-[#1692ff] text-sm font-semibold text-white shadow-[0_6px_14px_rgba(22,146,255,0.28)] hover:bg-[#0f83e8]"
        >
          <Link to="/login">Login Now</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}