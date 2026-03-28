"use strict";
const axios = require("axios");

async function generateFromOllama(messages) {
  const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "gemma3:4b",
    prompt,
    stream: false,
  });

  return res.data.response.trim();
}

module.exports = { generateFromOllama };
