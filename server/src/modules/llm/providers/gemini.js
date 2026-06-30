"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const DEFAULT_MODEL = process.env.GENERATION_GEMINI_MODEL ||
  process.env.GENERATION_LLM_MODEL ||
  "gemini-2.5-flash";

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
      // Disable gemini-2.5-flash "thinking". Thinking tokens are billed against
      // maxOutputTokens, so leaving it on truncates the actual JSON output mid-object
      // (e.g. dataset generation). Pass thinkingBudget via opts to re-enable.
      thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? 0 },
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
  let result;
  try {
    result = await chat.sendMessage(lastTurn.content);
  } catch (err) {
    console.error("[llm/gemini] sendMessage failed:", err?.message ?? err);
    console.error("[llm/gemini] status:", err?.status, "| code:", err?.code);
    throw err;
  }

  // Filter out thinking parts (part.thought === true) — getText() concatenates them all,
  // which corrupts the JSON output when gemini-2.5-flash thinking is enabled.
  const parts = result.response.candidates?.[0]?.content?.parts ?? [];
  const outputParts = parts.filter((p) => !p.thought && p.text);
  const text = outputParts.length > 0
    ? outputParts.map((p) => p.text).join("")
    : result.response.text();
  console.log("[llm/gemini] raw response:", text);

  const usage = result.response.usageMetadata;
  console.log("[gemini] usageMetadata:", JSON.stringify(usage));
  return {
    text,
    inputTokens: usage?.promptTokenCount ?? null,
    outputTokens: usage?.candidatesTokenCount ?? null,
  };
}

module.exports = { generateFromGemini };
