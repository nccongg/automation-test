function cleanJSON(raw) {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match[0]);
  } catch (e) {
    return { testCases: [] };
  }
}

module.exports = { cleanJSON };
