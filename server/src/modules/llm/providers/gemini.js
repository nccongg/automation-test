"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL =
  process.env.GENERATION_GEMINI_MODEL ||
  process.env.GENERATION_LLM_MODEL ||
  "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  console.warn(
    "[llm/providers/gemini] Missing GEMINI_API_KEY or GOOGLE_API_KEY"
  );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function generateFromGemini(messages) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text();
}

module.exports = { generateFromGemini };