"use strict";

const axios = require("axios");

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL =
  process.env.GENERATION_OLLAMA_MODEL ||
  process.env.GENERATION_LLM_MODEL ||
  "gemma3:4b";

async function generateFromOllama(messages) {
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  const res = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
  });

  return String(res.data?.response || "").trim();
}

module.exports = { generateFromOllama };