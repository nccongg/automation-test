import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api/authApi";
import {
  FolderKanban,
  FlaskConical,
  Play,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500/10",
    title: "Welcome to AutoTesting!",
    description:
      "Your AI-powered browser automation platform. Let's walk you through the basics so you can start running tests in minutes.",
    hint: null,
  },
  {
    icon: FolderKanban,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    title: "Create a Project",
    description:
      "Projects are the top-level container for your work. Group test cases by application, feature, or team — whatever makes sense for you.",
    hint: 'Head to Projects → click "New Project" to get started.',
  },
  {
    icon: FlaskConical,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    title: "Add Test Cases",
    description:
      "Describe what you want to test in plain English. Our AI generates a step-by-step browser script from your goal automatically.",
    hint: 'Inside a project open the Test Cases tab → click "Generate with AI".',
  },
  {
    icon: Play,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    title: "Run Your Tests",
    description:
      "Trigger a run with one click. The agent will open a browser, execute each step, capture screenshots, and report pass/fail back to you.",
    hint: "Open any test case and hit Run — results appear in seconds.",
  },
];

export default function OnboardingModal({ open, onClose }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  async function dismiss() {
    try {
      await authApi.completeOnboarding();
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        user.onboarding_completed = true;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch {
      // best-effort — don't block the user if the call fails
    }
    onClose();
  }

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-0 overflow-hidden gap-0"
      >
        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-1 bg-[var(--brand-primary)] transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Icon + step indicator */}
          <div className="flex items-center justify-between">
            <div
              className={`grid size-12 place-items-center rounded-xl ${current.iconBg}`}
            >
              <Icon className={`size-6 ${current.iconColor}`} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <DialogTitle className="text-xl">{current.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {current.description}
            </DialogDescription>
            {current.hint && (
              <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                {current.hint}
              </p>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-5 h-1.5 bg-[var(--brand-primary)]"
                    : "size-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={step === 0 ? dismiss : () => setStep((s) => s - 1)}
              className="text-muted-foreground"
            >
              {step === 0 ? (
                "Skip"
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  Back
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={isLast ? dismiss : () => setStep((s) => s + 1)}
            >
              {isLast ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
