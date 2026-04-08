/**
 * Parses raw agent error strings into a friendly category and brief message.
 * Handles Python exception strings that may contain JSON-like dicts or HTTP error codes.
 */

const ERROR_PATTERNS = [
  { pattern: /api.?key.*not.*valid|invalid.*api.?key/i, category: "Invalid API Key" },
  { pattern: /resource_exhausted|quota.*exceeded|429/i, category: "Rate Limit Exceeded" },
  { pattern: /unauthorized|authentication.*fail|401/i, category: "Authentication Failed" },
  { pattern: /permission.*denied|403|forbidden/i, category: "Permission Denied" },
  { pattern: /not.*found|404/i, category: "Not Found" },
  { pattern: /bad.?request|invalid.*argument|invalid_argument|400/i, category: "Invalid Request" },
  { pattern: /internal.*server.*error|500/i, category: "Server Error" },
  { pattern: /timed?.?out|timeout/i, category: "Timeout" },
  { pattern: /connection.*refused|econnrefused|network.*error/i, category: "Connection Error" },
  { pattern: /element.*not.*found|locator.*failed|no.*element/i, category: "Element Not Found" },
  { pattern: /navigation.*failed|page.*crash/i, category: "Navigation Failed" },
];

function classifyText(text) {
  for (const { pattern, category } of ERROR_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return null;
}

function truncate(text, max = 120) {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max - 3) + "...";
}

/**
 * @param {string} raw - Raw error message string from the agent
 * @returns {{ category: string, brief: string } | null}
 */
export function parseAgentError(raw) {
  if (!raw || typeof raw !== "string") return null;

  // 1. Try to extract the human-readable message from Python-style dict repr
  //    Pattern: 'message': 'Some readable text here'
  const pyMsgMatch = raw.match(/'message':\s*'([^']{5,})'/);
  if (pyMsgMatch) {
    const inner = pyMsgMatch[1];
    return {
      category: classifyText(raw) || classifyText(inner) || "Error",
      brief: truncate(inner),
    };
  }

  // 2. Try JSON-style message field: "message": "Some text"
  const jsonMsgMatch = raw.match(/"message":\s*"([^"]{5,})"/);
  if (jsonMsgMatch) {
    const inner = jsonMsgMatch[1];
    return {
      category: classifyText(raw) || classifyText(inner) || "Error",
      brief: truncate(inner),
    };
  }

  // 3. Classify the raw string itself and take first sentence as brief
  const category = classifyText(raw);
  if (!category) return null; // Not recognized — let raw display handle it

  const firstLine = raw.split(/[\n.{]/)[0].trim();
  return {
    category,
    brief: truncate(firstLine || raw),
  };
}
