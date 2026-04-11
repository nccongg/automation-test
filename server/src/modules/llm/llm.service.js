"use strict";

const { cleanJSON, withRetry } = require("./utils");

const DEFAULT_PROVIDER = process.env.GENERATION_LLM_PROVIDER || process.env.LLM_PROVIDER || "ollama";
const DEFAULT_MODEL = process.env.GENERATION_LLM_MODEL || process.env.LLM_MODEL || "gemma3:4b";

/**
 * Call the configured (or overridden) LLM provider.
 *
 * @param {Array<{ role: "system"|"user"|"assistant", content: string }>} messages
 * @param {{ provider?: string, model?: string, maxOutputTokens?: number, temperature?: number }} [opts]
 * @returns {Promise<string>}
 */
async function generateFromLLM(messages, opts = {}) {
  const provider = opts.provider || DEFAULT_PROVIDER;
  const callOpts = {
    model: opts.model || DEFAULT_MODEL,
    maxOutputTokens: opts.maxOutputTokens,
    maxTokens: opts.maxOutputTokens,
    temperature: opts.temperature,
  };

  switch (provider) {
    case "gemini":
      return withRetry(() =>
        require("./providers/gemini").generateFromGemini(messages, callOpts)
      );

    case "ollama":
      return withRetry(() =>
        require("./providers/ollama").generateFromOllama(messages, callOpts)
      );

    case "openai":
      return withRetry(() =>
        require("./providers/openai").generateFromOpenAI(messages, callOpts)
      );

    default:
      throw new Error(`[llm] Unknown provider: "${provider}". Use "gemini", "ollama", or "openai".`);
  }
}

/**
 * Build a concise website context block from a completed scan.
 */
function _buildScanContext(scan) {
  if (!scan) return "";

  const pages = (scan.sitemap || []).slice(0, 30).map((p) => ({
    url: p.url,
    title: p.title,
  }));

  const interactions = {};
  for (const [url, data] of Object.entries(scan.interaction_map || {}).slice(0, 10)) {
    interactions[url] = {
      forms: (data.forms || []).slice(0, 5),
      buttons: (data.buttons || []).slice(0, 10),
      navigation: (data.navigation || []).slice(0, 10),
    };
  }

  return `

## Website Structure (auto-crawled)

Pages discovered (${pages.length}):
${pages.map((p) => `- ${p.url}  "${p.title}"`).join("\n")}

Key interactions per page:
${JSON.stringify(interactions, null, 2).slice(0, 4000)}

Use the above to generate test cases that are grounded in real URLs, forms, and navigation flows found on the site.
`;
}

async function generateTestCases(userId, prompt, scanContext = null) {
  const contextBlock = _buildScanContext(scanContext);

  const messages = [
    {
      role: "system",
      content: `
You are a senior QA engineer.

Your job is to generate software test cases based on a user prompt.

## Rules:

1. Analyze the scope of the prompt:

- If the prompt is about a SINGLE feature or functionality:
  → Generate ONLY the necessary test cases to fully cover it
  → This can be as few as 1 test case if it already covers all scenarios well
  → Focus on depth (edge cases, validation, negative cases)

- If the prompt is BROAD (e.g., "test the app", "test the website"):
  → Generate a COMPREHENSIVE list of test cases
  → Cover multiple areas:
      - Functional
      - UI/UX
      - Validation
      - Edge cases
      - Performance (basic)
      - Security (basic)

2. If website structure context is provided, use real URLs, form fields, and
   navigation flows from the crawl data to make test steps concrete and specific.

3. Output format (STRICT JSON):

Return ONLY valid JSON. No explanation.

{
  "testCases": [
    {
      "title": "string",
      "type": "functional | edge | negative | ui | performance | security",
      "steps": ["step 1", "step 2"],
      "expectedResult": "string"
    }
  ]
}

4. Do NOT add explanations outside JSON.
5. Do NOT return empty results.
      `,
    },
    {
      role: "user",
      content: `
Prompt: ${prompt}
${contextBlock}
Step 1: Determine if this is:
- "SINGLE_FEATURE"
- "FULL_SYSTEM"

Step 2: Generate test cases accordingly.

Return ONLY JSON.
      `,
    },
  ];

  const provider = DEFAULT_PROVIDER;
  const raw = await generateFromLLM(messages);
  const parsed = cleanJSON(raw);

  if (!parsed) {
    throw {
      status: 502,
      message: "LLM returned invalid JSON. Check server logs for the raw output.",
    };
  }

  return {
    ...parsed,
    llmProvider: provider,
    llmModel: DEFAULT_MODEL,
  };
}

/**
 * Generate an LLM conclusion + suggestions for a completed test run.
 *
 * @param {{ goal: string, verdict: string, steps: Array }} runData
 * @returns {Promise<{ conclusion: string, suggestions: string[] }>}
 */
async function generateRunAnalysis({ goal, verdict, steps = [] }) {
  const stepSummary = steps
    .slice(0, 40)
    .map((s, i) => {
      const status = s.status || "unknown";
      const title = s.step_title || s.title || `Step ${i + 1}`;
      const parts = [`${i + 1}. [${status.toUpperCase()}] ${title}`];
      if (s.message) parts.push(`  Error: ${String(s.message).slice(0, 300)}`);
      if (s.thought_text) parts.push(`  Thought: ${String(s.thought_text).slice(0, 200)}`);
      if (s.extracted_content) parts.push(`  Extracted: ${String(s.extracted_content).slice(0, 200)}`);
      return parts.join("\n");
    })
    .join("\n");

  const messages = [
    {
      role: "system",
      content: `You are a senior QA engineer reviewing automated browser test results.
Given the test goal, final verdict, and detailed step log (including error messages, agent thoughts, and extracted content), produce a concise analysis.

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "conclusion": "1-3 sentence summary of what happened and the overall result",
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"]
}

Rules:
- conclusion must mention the verdict (pass/fail/error) and reference specific failure reasons from the step log.
- suggestions must be specific and actionable based on the actual errors seen (max 5 items).
- Do NOT wrap the JSON in code fences.`,
    },
    {
      role: "user",
      content: `Test Goal: ${goal || "Not specified"}
Verdict: ${verdict || "unknown"}

Step Log:
${stepSummary || "No steps recorded."}

Analyze the run and return JSON.`,
    },
  ];

  const raw = await generateFromLLM(messages, { maxOutputTokens: 512 });
  const parsed = cleanJSON(raw);

  if (!parsed || typeof parsed.conclusion !== "string") {
    return {
      conclusion: "Analysis could not be generated — the LLM returned an unexpected response.",
      suggestions: [],
    };
  }

  return {
    conclusion: parsed.conclusion,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
  };
}

/**
 * Generate an LLM conclusion + suggestions for a completed test sheet run.
 *
 * @param {{ sheetName: string, totalCases: number, passed: number, failed: number, errored: number, items: Array }} sheetRunData
 * @returns {Promise<{ conclusion: string, suggestions: string[] }>}
 */
async function generateSheetRunAnalysis({ sheetName, totalCases, passed, failed, errored = 0, items = [] }) {
  const caseSummary = items
    .slice(0, 20)
    .map((item, i) => {
      const verdict = item.verdict || item.status || "unknown";
      const title = item.title || `Case ${i + 1}`;
      const goal = item.goal ? ` — Goal: ${String(item.goal).slice(0, 100)}` : "";
      const lines = [`${i + 1}. [${verdict.toUpperCase()}] ${title}${goal}`];

      const steps = Array.isArray(item.steps) ? item.steps : [];
      steps.slice(0, 10).forEach((s, si) => {
        const stepStatus = s.status || "unknown";
        const stepTitle = s.step_title || `Step ${si + 1}`;
        const stepLine = [`  ${si + 1}. [${stepStatus.toUpperCase()}] ${stepTitle}`];
        if (s.message) stepLine.push(`Error: ${String(s.message).slice(0, 250)}`);
        if (s.thought_text) stepLine.push(`Thought: ${String(s.thought_text).slice(0, 150)}`);
        lines.push(stepLine.join(" | "));
      });

      return lines.join("\n");
    })
    .join("\n\n");

  const passRate = totalCases > 0 ? Math.round((passed / totalCases) * 100) : 0;

  const messages = [
    {
      role: "system",
      content: `You are a senior QA engineer reviewing batch test sheet results.
Given the sheet summary, per-case verdicts, and the step-level details (including error messages and agent thoughts) for each test case, produce a concise analysis.

Return ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "conclusion": "1-3 sentence summary covering overall quality and key findings",
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"]
}

Rules:
- conclusion must mention pass rate and highlight specific failure reasons seen in the step logs.
- suggestions must be specific and actionable based on the actual errors (max 5 items).
- Do NOT wrap the JSON in code fences.`,
    },
    {
      role: "user",
      content: `Sheet: ${sheetName || "Test Sheet"}
Total: ${totalCases} | Passed: ${passed} | Failed: ${failed} | Errored: ${errored} | Pass Rate: ${passRate}%

Test Case Results with Steps:
${caseSummary || "No cases recorded."}

Analyze the sheet run and return JSON.`,
    },
  ];

  const raw = await generateFromLLM(messages, { maxOutputTokens: 512 });
  const parsed = cleanJSON(raw);

  if (!parsed || typeof parsed.conclusion !== "string") {
    return {
      conclusion: "Analysis could not be generated — the LLM returned an unexpected response.",
      suggestions: [],
    };
  }

  return {
    conclusion: parsed.conclusion,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
  };
}

/**
 * Refine an existing test case based on a user prompt.
 *
 * @param {{ title: string, goal: string, steps: Array }} currentCase
 * @param {string} userPrompt
 * @returns {Promise<{ title: string, goal: string, steps: Array, expectedResult: string }>}
 */
async function refineTestCase(currentCase, userPrompt) {
  const stepsText = (currentCase.steps || [])
    .map((s, i) => `${s.order ?? i + 1}. ${s.description || s.text || ""}`)
    .join("\n");

  const messages = [
    {
      role: "system",
      content: `You are a senior QA engineer.
The user will give you an existing test case and instructions on how to modify it.
Your task is to revise the test case according to the instructions.

Return ONLY valid JSON in this exact shape — no markdown, no code fences, no explanation:
{
  "title": "string",
  "goal": "string",
  "steps": ["step 1", "step 2", "..."],
  "expectedResult": "string"
}

Rules:
- Keep steps concrete, numbered, and atomic.
- Preserve intent unless the user explicitly asks to change it.
- Do NOT add commentary outside the JSON.`,
    },
    {
      role: "user",
      content: `## Current Test Case

Title: ${currentCase.title}
Goal: ${currentCase.goal}

Steps:
${stepsText || "(no steps)"}

## User Instructions

${userPrompt}

Revise the test case accordingly and return JSON.`,
    },
  ];

  const raw = await generateFromLLM(messages, { maxOutputTokens: 1024 });
  const parsed = cleanJSON(raw);

  if (!parsed || !parsed.title || !Array.isArray(parsed.steps)) {
    throw {
      status: 502,
      message: "LLM returned an invalid response. Please try again.",
    };
  }

  return {
    title: String(parsed.title).trim(),
    goal: String(parsed.goal || currentCase.goal).trim(),
    steps: parsed.steps
      .map((s, i) => ({
        order: i + 1,
        text: typeof s === "string" ? s.trim() : String(s?.text || s?.description || "").trim(),
        action: "custom",
        expectedResult: null,
      }))
      .filter((s) => s.text),
    expectedResult: String(parsed.expectedResult || "").trim(),
  };
}

module.exports = {
  generateTestCases,
  generateFromLLM,
  _buildScanContext,
  generateRunAnalysis,
  generateSheetRunAnalysis,
  refineTestCase,
};
