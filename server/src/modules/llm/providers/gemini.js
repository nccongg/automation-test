"use strict";
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateFromGemini(messages) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Convert chat format → single prompt
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return response.text();
}

module.exports = { generateFromGemini };
