"use strict";

/**
 * Extract and parse a JSON object from raw LLM output.
 * Handles markdown code fences and bare JSON.
 * Returns null on failure so callers can handle the error explicitly.
 */
function cleanJSON(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    console.error("[llm/utils] cleanJSON: received empty or non-string input");
    return null;
  }

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : raw;

  // Extract the outermost JSON object or array
  const objMatch = candidate.match(/\{[\s\S]*\}/);
  const arrMatch = candidate.match(/\[[\s\S]*\]/);
  const jsonString = objMatch ? objMatch[0] : arrMatch ? arrMatch[0] : null;

  if (!jsonString) {
    console.error("[llm/utils] cleanJSON: no JSON found in output:", raw.slice(0, 300));
    return null;
  }

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("[llm/utils] cleanJSON: JSON.parse failed:", e.message);
    console.error("[llm/utils] cleanJSON: raw output was:", raw.slice(0, 500));
    return null;
  }
}

/**
 * Retry an async function with exponential backoff.
 * @param {() => Promise<T>} fn
 * @param {number} maxRetries
 * @returns {Promise<T>}
 */
async function withRetry(fn, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1s
        console.warn(`[llm] attempt ${attempt + 1} failed, retrying in ${delay}ms:`, err.message);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

module.exports = { cleanJSON, withRetry };
