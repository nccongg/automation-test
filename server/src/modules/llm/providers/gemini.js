"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const DEFAULT_MODEL = process.env.GENERATION_GEMINI_MODEL ||
  process.env.GENERATION_LLM_MODEL ||
  "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  console.warn("[llm/providers/gemini] Missing GEMINI_API_KEY or GOOGLE_API_KEY");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * @param {Array<{ role: "system"|"user"|"assistant", content: string }>} messages
 * @param {{ model?: string, maxOutputTokens?: number, temperature?: number }} [opts]
 */
async function generateFromGemini(messages, opts = {}) {
  const modelName = opts.model || DEFAULT_MODEL;

  // Separate the system prompt from the conversation
  const systemMsg = messages.find((m) => m.role === "system");
  const turns = messages.filter((m) => m.role !== "system");

  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(systemMsg && { systemInstruction: systemMsg.content }),
    generationConfig: {
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
      temperature: opts.temperature ?? 0.2,
    },
  });

  // Build chat history from all turns except the last user message
  const history = turns.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastTurn = turns[turns.length - 1];
  if (!lastTurn) {
    throw new Error("[llm/providers/gemini] No user message provided");
  }

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastTurn.content);
  return result.response.text();
}

module.exports = { generateFromGemini };
