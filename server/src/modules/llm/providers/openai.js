"use strict";
const { Configuration, OpenAIApi } = require("openai");

async function generateFromOpenAI(messages) {
  const openai = new OpenAIApi(
    new Configuration({ apiKey: process.env.OPENAI_API_KEY }),
  );

  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages,
    max_tokens: 1000,
  });

  return response.data.choices[0].message.content.trim();
}

module.exports = { generateFromOpenAI };
