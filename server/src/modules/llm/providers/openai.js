"use strict";

const DEFAULT_MODEL = process.env.GENERATION_OPENAI_MODEL ||
  process.env.GENERATION_LLM_MODEL ||
  "gpt-4o";

/**
 * @param {Array<{ role: "system"|"user"|"assistant", content: string }>} messages
 * @param {{ model?: string, maxTokens?: number, temperature?: number }} [opts]
 */
async function generateFromOpenAI(messages, opts = {}) {
  // Lazy-load so the server starts even if the openai package is absent
  let OpenAI;
  try {
    OpenAI = require("openai");
  } catch {
    throw new Error(
      "[llm/providers/openai] 'openai' package not installed. Run: npm install openai"
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: opts.model || DEFAULT_MODEL,
    messages,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.2,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generateFromOpenAI };
