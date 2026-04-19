export function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export function duration(s, f) {
  if (!s || !f) return null;
  const ms = new Date(f) - new Date(s);
  if (ms < 0) return null;
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  return m > 0 ? `${m}m ${sec % 60}s` : `${sec}s`;
}

export function toNullablePositiveInt(value) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error("Only positive integers are allowed for dataset/runtime/script ids.");
  }
  return num;
}

export function toNullableNonNegativeInt(value) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw new Error("rowIndex must be a non-negative integer.");
  }
  return num;
}

export function trimOrNull(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

export function parseJsonObject(text, label) {
  const raw = String(text ?? "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object.`);
    }
    return parsed;
  } catch (err) {
    throw new Error(`${label} is invalid JSON.`);
  }
}

export function getCurrentVersionId(tc) {
  return (
    tc?.currentVersionId ??
    tc?.current_version_id ??
    tc?.testCaseVersionId ??
    tc?.test_case_version_id ??
    tc?.currentVersion?.id ??
    null
  );
}

export function getRuntimeConfigId(tc) {
  return tc?.runtimeConfigId ?? tc?.runtime_config_id ?? null;
}
