import { useState } from 'react';
import { useOutletContext, NavLink } from 'react-router-dom';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import ProjectHeader from '@/features/projects/components/ProjectHeader';
import ProjectStats from '@/features/projects/components/ProjectStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/shared/components/common/LoadingSpinner';
import EmptyState from '@/shared/components/common/EmptyState';
import { formatRelativeTime } from '@/shared/utils';

export default function ProjectOverviewPage() {
  const { project } = useOutletContext();

  const [prompt, setPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setAnalyzing(true);
    setAnalysisResult('');

    // Mock behavior: simulate AI analysis based on prompt.
    await new Promise((r) => setTimeout(r, 1300));
    setAnalysisResult(
      `Mock AI analysis complete. Based on your requirements: "${prompt}"\n\nNext step: Generate test scenarios and automate them using AI.`
    );
    setAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} />

      <section className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              AI Website Analysis
            </h2>
            <p className="text-sm text-muted-foreground">
              Describe your testing requirements and let AI generate intelligent test cases
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <Sparkles className="size-5" />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="ai-prompt" className="text-sm">
              AI Test Generation Prompt
            </Label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to test...\n\nExample: 'Test the login functionality, product search, shopping cart, and checkout process'"
              disabled={analyzing}
              className="min-h-[100px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !prompt.trim()}
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] md:w-auto"
          >
            {analyzing ? (
              <LoadingSpinner size="sm" label="Analyzing..." />
            ) : (
              'Generate with AI'
            )}
          </Button>
        </div>

        {analysisResult && (
          <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
            {analysisResult}
          </div>
        )}
      </section>

      <ProjectStats project={project} />

      <section className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">Recent Activity</h3>

        {project.recentActivity?.length ? (
          <div className="rounded-xl border bg-white">
            <div className="divide-y">
              {project.recentActivity.map((a) => {
                const isPass = a.verdict === 'pass';
                const Icon = isPass ? CheckCircle2 : XCircle;
                const tone = isPass ? 'text-emerald-600' : 'text-red-600';

                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`size-4 ${tone}`} />
                        <div className="truncate text-sm font-medium">
                          {a.testTitle}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Verdict: {a.verdict}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(a.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            compact
            title="No activity yet"
            description="Run your first test case to populate the project history."
          />
        )}
      </section>
    </div>
  );
}

