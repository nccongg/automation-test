import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useVerifyOtp } from "@/features/auth/hooks/useAuth";
import AuthLayout from "@/shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";

const CODE_LENGTH = 5;

export default function ForgotPasswordVerifyPage() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef([]);
  const { error, isLoading, verify, resend } = useVerifyOtp();

  const handleChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, "").slice(-1);

    const nextCode = [...code];
    nextCode[index] = cleanValue;
    setCode(nextCode);

    if (cleanValue && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH)
      .split("");

    if (!pasted.length) return;

    const nextCode = Array(CODE_LENGTH).fill("");
    pasted.forEach((char, index) => {
      nextCode[index] = char;
    });

    setCode(nextCode);

    const nextFocusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputsRef.current[nextFocusIndex]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verify(code.join(""));
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle="We sent a 5-digit code to your inbox. Enter it below to continue."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="flex items-center justify-center gap-3"
          onPaste={handlePaste}
        >
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-800 outline-none transition focus:border-[#1692ff] focus:bg-white focus:ring-2 focus:ring-[#1692ff]/20"
            />
          ))}
        </div>

        {error && (
          <div className="rounded border border-red-100 bg-red-50 p-3 text-center text-xs text-red-500">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-lg bg-[#1692ff] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(22,146,255,0.3)] hover:bg-[#0f83e8] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading ? "Verifying…" : "Verify code"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={resend}
            className="font-semibold text-[#1692ff] hover:underline"
          >
            Resend code
          </button>
        </p>

        <p className="text-center text-sm text-slate-500">
          <Link
            to="/forgot-password"
            className="font-semibold text-slate-600 hover:underline"
          >
            ← Back
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}