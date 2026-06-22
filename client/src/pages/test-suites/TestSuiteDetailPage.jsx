import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTestSheet,
  addSheetItems,
  removeSheetItem,
  runTestSheet,
  getSheetRuns,
  getSuiteRunOptions,
} from "@/features/test-collection/api/testSheetApi";
import { getTestCaseScripts } from "@/features/test-cases/api/testCasesApi";
import LoadingSpinner from "@/shared/components/common/LoadingSpinner";
import ErrorState from "@/shared/components/common/ErrorState";
import SuiteHeader from "@/features/test-collection/components/suite-detail/SuiteHeader";
import RunConfigTable from "@/features/test-collection/components/suite-detail/RunConfigTable";
import RecentRunsList from "@/features/test-collection/components/suite-detail/RecentRunsList";
import AddCasesDialog from "@/features/test-collection/components/suite-detail/AddCasesDialog";
import DatasetPreviewDialog from "@/features/test-collection/components/suite-detail/DatasetPreviewDialog";
import RunConfirmDialog from "@/features/test-collection/components/suite-detail/RunConfirmDialog";
import { getVerifyStatus } from "@/features/test-collection/components/suite-detail/utils";

const AGENT_RUN_VALUE = "agent";

export default function TestSuiteDetailPage() {
  const { projectId, sheetId } = useParams();
  const navigate = useNavigate();

  const [sheet, setSheet] = useState(null);
  const [items, setItems] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [running, setRunning] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [runOptions, setRunOptions] = useState([]);
  const [selectedByCase, setSelectedByCase] = useState({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");
  const [runConfigWarning, setRunConfigWarning] = useState("");

  const [scriptsByCase, setScriptsByCase] = useState({});
  const [selectedScriptByCase, setSelectedScriptByCase] = useState({});
  const [scriptsLoadingByCase, setScriptsLoadingByCase] = useState({});
  const [scriptsErrorByCase, setScriptsErrorByCase] = useState({});

  const [previewDataset, setPreviewDataset] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [showRunConfirm, setShowRunConfirm] = useState(false);
  const [missingCount, setMissingCount] = useState(0);

  const loadScriptsForCases = useCallback(async (optionItems) => {
    const loadingMap = {};
    const errorMap = {};
    const scriptsMap = {};

    optionItems.forEach((item) => {
      loadingMap[item.testCaseId] = true;
      errorMap[item.testCaseId] = "";
      scriptsMap[item.testCaseId] = [];
    });

    setScriptsLoadingByCase(loadingMap);
    setScriptsErrorByCase(errorMap);

    await Promise.all(
      optionItems.map(async (item) => {
        try {
          const scriptsData = await getTestCaseScripts(item.testCaseId);
          scriptsMap[item.testCaseId] = Array.isArray(scriptsData)
            ? scriptsData
            : [];
          errorMap[item.testCaseId] = "";
        } catch (e) {
          scriptsMap[item.testCaseId] = [];
          errorMap[item.testCaseId] =
            e?.message || "Failed to load replay scripts.";
        } finally {
          loadingMap[item.testCaseId] = false;
        }
      }),
    );

    setScriptsByCase({ ...scriptsMap });
    setScriptsLoadingByCase({ ...loadingMap });
    setScriptsErrorByCase({ ...errorMap });

    setSelectedScriptByCase((prev) => {
      const next = {};

      optionItems.forEach((item) => {
        const scripts = scriptsMap[item.testCaseId] ?? [];
        const prevSelected = prev[item.testCaseId];

        const prevStillExists =
          prevSelected === AGENT_RUN_VALUE ||
          scripts.some((script) => String(script.id) === String(prevSelected));

        next[item.testCaseId] = prevStillExists
          ? String(prevSelected)
          : AGENT_RUN_VALUE;
      });

      return next;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setConfigLoading(true);
      setError(null);
      setConfigError("");
      setRunConfigWarning("");

      const [sheetData, runsData, runOptionsData] = await Promise.all([
        getTestSheet(sheetId),
        getSheetRuns(projectId),
        getSuiteRunOptions(sheetId),
      ]);

      setSheet(sheetData);
      setItems(sheetData?.items ?? []);

      const optionItems = runOptionsData?.items ?? [];
      setRunOptions(optionItems);

      const initialDatasetSelection = {};

      optionItems.forEach((item) => {
        const defaultDataset = item.availableDatasets?.find((d) => d.isDefault);
        initialDatasetSelection[item.testCaseId] = defaultDataset?.id
          ? String(defaultDataset.id)
          : "";
      });

      setSelectedByCase(initialDatasetSelection);

      setRecentRuns(
        (runsData ?? [])
          .filter((r) => String(r.testSheetId) === String(sheetId))
          .slice(0, 5),
      );

      await loadScriptsForCases(optionItems);
    } catch (e) {
      setError(e || new Error("Failed to load sheet."));
      setConfigError(e?.message || "Failed to load run configuration.");
    } finally {
      setLoading(false);
      setConfigLoading(false);
    }
  }, [sheetId, projectId, loadScriptsForCases]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddItems(testCaseIds) {
    await addSheetItems(sheetId, testCaseIds);
    load();
  }

  async function handleRemoveItem(itemId) {
    setRemovingId(itemId);

    try {
      await removeSheetItem(sheetId, itemId);
      load();
    } finally {
      setRemovingId(null);
    }
  }

  function handleRun() {
    setRunConfigWarning("");

    if (items.length === 0) {
      setRunConfigWarning(
        "This suite has no test cases. Please add test cases before running.",
      );
      return;
    }

    if (configLoading) {
      setRunConfigWarning(
        "Run configuration is still loading. Please wait a moment.",
      );
      return;
    }

    if (configError) {
      setRunConfigWarning(
        "Run configuration could not be loaded. Please refresh and try again.",
      );
      return;
    }

    const incompatibleConfigs = runOptions.filter((row) => {
      const selectedScript = selectedScriptByCase[row.testCaseId];
      const isAgentRun = selectedScript === AGENT_RUN_VALUE;

      if (isAgentRun) return false;

      const selectedDatasetId = selectedByCase[row.testCaseId] ?? "";
      if (!selectedDatasetId) return false;

      return !getVerifyStatus(row, selectedDatasetId).isCompatible;
    });

    if (incompatibleConfigs.length > 0) {
      setRunConfigWarning(
        `Please choose compatible data for ${incompatibleConfigs.length} test case(s) before running the suite.`,
      );
      return;
    }

    const missingConfigs = runOptions.filter((row) => {
      const selectedScript = selectedScriptByCase[row.testCaseId];
      const isAgentRun = selectedScript === AGENT_RUN_VALUE;

      if (isAgentRun) return false;

      const selectedDatasetId = selectedByCase[row.testCaseId] ?? "";
      const hasDatasetOptions =
        Array.isArray(row.availableDatasets) &&
        row.availableDatasets.length > 0;

      if (!hasDatasetOptions) return false;

      return !selectedDatasetId;
    });

    if (missingConfigs.length > 0) {
      setMissingCount(missingConfigs.length);
      setShowRunConfirm(true);
      return;
    }

    executeRun();
  }

  async function executeRun() {
    try {
      setShowRunConfirm(false);
      setRunConfigWarning("");

      const runConfig = {
        items: runOptions.map((row) => {
          const selectedScript = selectedScriptByCase[row.testCaseId];
          const isAgentRun = selectedScript === AGENT_RUN_VALUE;

          return {
            testCaseId: row.testCaseId,
            runMode: isAgentRun ? "agent" : "replay",
            datasetId: isAgentRun
              ? null
              : selectedByCase[row.testCaseId]
                ? Number(selectedByCase[row.testCaseId])
                : null,
            executionScriptId: isAgentRun
              ? null
              : selectedScript
                ? Number(selectedScript)
                : null,
            rowIndex: null,
          };
        }),
      };

      setRunning(true);

      const result = await runTestSheet(sheetId, runConfig);
      const runId = result?.sheetRun?.id;

      if (runId) {
        navigate(`/projects/${projectId}/test-runs/sheet/${runId}`);
      } else {
        setRunConfigWarning("Suite run was started but no run id was returned.");
      }
    } catch (e) {
      setError(e?.message || "Failed to start sheet run.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading sheet..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={load} />;
  }

  const existingIds = new Set(items.map((i) => i.testCaseId));

  return (
    <div className="space-y-8">
      <SuiteHeader
        projectId={projectId}
        sheetId={sheetId}
        sheet={sheet}
        items={items}
        running={running}
        onRun={handleRun}
        onAddCases={() => setShowAddDialog(true)}
        onSheetUpdated={(patch) => setSheet((prev) => ({ ...prev, ...patch }))}
      />

      <RunConfigTable
        projectId={projectId}
        runOptions={runOptions}
        items={items}
        configLoading={configLoading}
        configError={configError}
        runConfigWarning={runConfigWarning}
        selectedByCase={selectedByCase}
        scriptsByCase={scriptsByCase}
        selectedScriptByCase={selectedScriptByCase}
        scriptsLoadingByCase={scriptsLoadingByCase}
        scriptsErrorByCase={scriptsErrorByCase}
        removingId={removingId}
        onDatasetChange={(testCaseId, val) => {
          setSelectedByCase((prev) => ({
            ...prev,
            [testCaseId]: val,
          }));
          setRunConfigWarning("");
        }}
        onScriptChange={(testCaseId, val) => {
          setSelectedScriptByCase((prev) => ({
            ...prev,
            [testCaseId]: val,
          }));

          if (val === AGENT_RUN_VALUE) {
            setSelectedByCase((prev) => ({
              ...prev,
              [testCaseId]: "",
            }));
          }

          setRunConfigWarning("");
        }}
        onRemoveItem={handleRemoveItem}
        onPreviewDataset={(dataset) => {
          setPreviewDataset(dataset);
          setPreviewOpen(true);
        }}
      />

      <RecentRunsList runs={recentRuns} projectId={projectId} />

      <AddCasesDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdded={handleAddItems}
        projectId={projectId}
        existingIds={existingIds}
      />

      <DatasetPreviewDialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewDataset(null);
        }}
        dataset={previewDataset}
      />

      <RunConfirmDialog
        open={showRunConfirm}
        onClose={() => setShowRunConfirm(false)}
        onConfirm={executeRun}
        missingCount={missingCount}
        running={running}
      />
    </div>
  );
}