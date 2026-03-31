import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTestCases } from "@/features/test-cases/hooks/useTestCases";
import { createTestRun } from "@/features/test-results/api/testResultsApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorBanner from "@/shared/components/common/ErrorBanner";
import EmptyState from "@/shared/components/common/EmptyState";
import PageHeader from "@/shared/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function StatusBadge({ status }) {
  const styles = {
    ready: "bg-emerald-100 text-emerald-700 border-emerald-500/20",
    draft: "bg-yellow-100 text-yellow-700 border-yellow-500/20",
    archived: "bg-slate-100 text-slate-700 border-slate-500/20",
  };

  return (
    <Badge className={`border ${styles[status] || styles.draft}`}>
      {status || "draft"}
    </Badge>
  );
}

export default function TestCasesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { testCases = [], loading, error } = useTestCases(projectId);
  const [searchTerm, setSearchTerm] = useState("");
  const [runningId, setRunningId] = useState(null);
  const [runError, setRunError] = useState("");

  const filteredCases = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return testCases;

    return testCases.filter(
      (tc) =>
        tc.title.toLowerCase().includes(keyword) ||
        tc.goal.toLowerCase().includes(keyword)
    );
  }, [testCases, searchTerm]);

  const handleRun = async (tc) => {
    try {
      setRunError("");
      setRunningId(tc.testCaseId);

      await createTestRun({
        testCaseId: tc.testCaseId,
        promptText: tc.promptText || "",
      });

      navigate("/test-results");
    } catch (e) {
      setRunError(e?.message || "Failed to start test run.");
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading test cases..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorBanner
        message={error}
        fullWidth
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Test Cases"
        description="Test cases loaded from database"
      />

      {runError && <ErrorBanner message={runError} fullWidth />}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search test cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <EmptyState
          title={searchTerm ? "No test cases found" : "No Test Cases"}
          description={
            searchTerm
              ? "Try adjusting your search terms"
              : "No test cases available in this project"
          }
        />
      ) : (
        <div className="rounded-xl border bg-white">
          <div className="grid gap-px divide-y">
            {filteredCases.map((tc) => (
              <div
                key={tc.id}
                className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{tc.title}</h3>
                    <StatusBadge status={tc.status} />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Goal:</span>{" "}
                    {tc.goal}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Prompt:</span>{" "}
                    {tc.promptText || "No prompt text"}
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Version: {tc.versionNo}</span>
                    <span>Mode: {tc.executionMode}</span>
                    <span>Runtime Config: {tc.runtimeConfigId || "N/A"}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleRun(tc)}
                    disabled={
                      runningId === tc.testCaseId || tc.status === "archived"
                    }
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {runningId === tc.testCaseId ? "Running..." : "Run"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}