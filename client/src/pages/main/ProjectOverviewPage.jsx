import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import ProjectHeader from '@/features/projects/components/ProjectHeader';
import ProjectStats from '@/features/projects/components/ProjectStats';
import { createTestRun } from '@/features/test-results/api/testResultsApi';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/shared/components/common/LoadingSpinner';
import EmptyState from '@/shared/components/common/EmptyState';
import { formatRelativeTime } from '@/shared/utils';

const TEMP_TEST_CASE_ID = 1; // <-- đổi thành testCaseId thật trong DB

export default function ProjectOverviewPage() {
  const { project, onProjectUpdated } = useOutletContext();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState('');
  const [runError, setRunError] = useState('');

  const handleRunTest = async () => {
    if (!prompt.trim()) return;

    try {
      setRunning(true);
      setRunMessage('');
      setRunError('');

      const result = await createTestRun({
        testCaseId: TEMP_TEST_CASE_ID,
        promptText: prompt.trim(),
      });

      setRunMessage(
        `Run #${result?.testRun?.id ?? 'N/A'} created successfully. Redirecting to Test Runs...`
      );

      navigate(`/projects/${project.id}/test-runs`);
    } catch (error) {
      setRunError(error?.message || 'Failed to start test run.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} onProjectUpdated={onProjectUpdated} />

      <section className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Run Test with Prompt
            </h2>
            <p className="text-sm text-muted-foreground">
              Temporary flow: use a real testCaseId in DB and override its prompt to start a test run
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <Sparkles className="size-5" />
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="ai-prompt" className="text-sm">
              Test Prompt
            </Label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Open login page, enter valid credentials, click login, verify dashboard is visible"
              disabled={running}
              className="min-h-[100px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button
            type="button"
            onClick={handleRunTest}
            disabled={running || !prompt.trim()}
            className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] md:w-auto"
          >
            {running ? (
              <LoadingSpinner size="sm" label="Starting..." />
            ) : (
              'Run Test'
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Using temporary testCaseId: <strong>{TEMP_TEST_CASE_ID}</strong>
        </div>

        {runMessage && (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 whitespace-pre-wrap">
            {runMessage}
          </div>
        )}

        {runError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap">
            {runError}
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