"use strict";

const axios = require("axios");

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.GENERATION_OLLAMA_MODEL ||
  process.env.GENERATION_LLM_MODEL ||
  "gemma3:4b";

const TIMEOUT_MS = 120_000; // 2 minutes — local models can be slow

/**
 * @param {Array<{ role: "system"|"user"|"assistant", content: string }>} messages
 * @param {{ model?: string }} [opts]
 */
async function generateFromOllama(messages, opts = {}) {
  const model = opts.model || DEFAULT_MODEL;

  // Ollama /api/chat accepts the same role names as OpenAI (system/user/assistant)
  const res = await axios.post(
    `${OLLAMA_BASE_URL}/api/chat`,
    {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    },
    { timeout: TIMEOUT_MS }
  );

  return String(res.data?.message?.content || "").trim();
}

module.exports = { generateFromOllama };
