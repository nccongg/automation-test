import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-10 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">AI Testing Platform</h1>
              <p className="text-sm text-slate-300">
                Authentication Demo
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-3xl font-bold leading-tight">
              User Authentication
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Login, signup, and forgot password interface for system demonstration.
            </p>
          </div>

          <div />
        </div>

        <div className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {title}
              </h2>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}