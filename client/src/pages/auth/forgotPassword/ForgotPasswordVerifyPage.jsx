import { useRef, useState } from "react";

import AuthLayout from "@/components/shared/AuthLayout";
import { Button } from "@/components/ui/button";

import authBanner from "@/assets/auth-banner.svg";

const CODE_LENGTH = 5;

export default function ForgotPasswordVerifyPage() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef([]);

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
    console.log("Verify code:", code.join(""));
  };

  return (
    <AuthLayout
      pageLabel="Forgot Password #3"
      title="Forgot Password"
      imageSrc={authBanner}
      imageAlt="Authentication banner"
    >
      <div className="space-y-6">
        <p className="-mt-2 text-center text-[12px] leading-5 text-slate-400">
          We sent a reset link to contact@dscode....com enter 5 digit code that
          mentioned in the email
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            className="flex items-center justify-center gap-4"
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
                className="h-12 w-12 rounded-[10px] border border-slate-300 bg-white text-center text-base font-semibold text-slate-700 outline-none transition focus:border-[#8dbdff] focus:ring-2 focus:ring-[#d9ebff]"
              />
            ))}
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-md bg-[#1692ff] text-sm font-semibold text-white shadow-[0_6px_14px_rgba(22,146,255,0.28)] hover:bg-[#0f83e8]"
          >
            Verify Code
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}