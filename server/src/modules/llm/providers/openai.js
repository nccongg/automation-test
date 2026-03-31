"use strict";

const { Configuration, OpenAIApi } = require("openai");

const OPENAI_MODEL =
  process.env.GENERATION_OPENAI_MODEL ||
  process.env.GENERATION_LLM_MODEL ||
  "gpt-4";

async function generateFromOpenAI(messages) {
  const openai = new OpenAIApi(
    new Configuration({ apiKey: process.env.OPENAI_API_KEY })
  );

  const response = await openai.createChatCompletion({
    model: OPENAI_MODEL,
    messages,
    max_tokens: 1000,
  });

  return response.data.choices[0].message.content.trim();
}

module.exports = { generateFromOpenAI };