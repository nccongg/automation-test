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

async function generateTestCases(userId, prompt) {
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

2. Output format (STRICT JSON):

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

3. Do NOT add explanations outside JSON.
4. Do NOT return empty results.
      `,
    },
    {
      role: "user",
      content: `
Prompt: ${prompt}

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
};
