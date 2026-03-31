"use strict";

const { cleanJSON } = require("./utils");

const PROVIDER = process.env.LLM_PROVIDER || "gemini";

async function generateFromLLM(messages) {
  switch (PROVIDER) {
    case "gemini":
      return require("./providers/gemini").generateFromGemini(messages);
    case "ollama":
      return require("./providers/ollama").generateFromOllama(messages);
    default:
      return require("./providers/openai").generateFromOpenAI(messages);
  }
}

/**
 * Build a concise website context block from a completed scan.
 * Truncated to avoid bloating the prompt.
 */
function _buildScanContext(scan) {
  if (!scan) return "";

  const pages = (scan.sitemap || []).slice(0, 30).map((p) => ({
    url: p.url,
    title: p.title,
  }));

  // Include interactions only for the first 10 pages to keep prompt size sane
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

  try {
    const raw = await generateFromLLM(messages);
    return cleanJSON(raw);
  } catch (err) {
    console.error("Error generating test cases:", err);
    throw { status: 500, message: "Failed to generate test cases" };
  }
}

module.exports = {
  generateTestCases,
  generateFromLLM,
  _buildScanContext,
};
