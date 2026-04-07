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

module.exports = {
  generateTestCases,
  generateFromLLM,
  _buildScanContext,
};
