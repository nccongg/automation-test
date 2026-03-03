import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";

import AuthLayout from "../../components/shared/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Forgot password email:", email);
    setSubmitted(true);
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we’ll send you a reset link."
    >
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Send reset link
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <MailCheck className="h-7 w-7 text-slate-700" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">
                  Check your email
                </h3>
                <p className="text-sm leading-6 text-slate-500">
                  We’ve sent a password reset link to <strong>{email}</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => console.log("Resend email:", email)}
                >
                  Resend email
                </Button>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}