import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const STATUS_STYLE = {
  draft: "bg-slate-100 text-slate-600",
  ready: "bg-emerald-100 text-emerald-700",
  archived: "bg-amber-100 text-amber-700",
};

export const VERDICT_STRIPE = {
  pass: "border-l-emerald-400",
  fail: "border-l-red-400",
  error: "border-l-orange-400",
};

export const VERDICT_BG = {
  pass: "bg-emerald-50/40",
  fail: "bg-red-50/40",
  error: "bg-orange-50/20",
};

export const VERDICT_BADGE = {
  pass: "bg-emerald-100 text-emerald-700 border-emerald-200",
  fail: "bg-red-100 text-red-700 border-red-200",
  error: "bg-orange-100 text-orange-700 border-orange-200",
};

export const VERDICT_ICON = {
  pass: <CheckCircle2 className="size-4 text-emerald-500" />,
  fail: <XCircle className="size-4 text-red-500" />,
  error: <AlertTriangle className="size-4 text-orange-500" />,
};

export const ERROR_STYLE = {
  "Invalid API Key": "bg-red-50 border-red-200 text-red-700",
  "Rate Limit Exceeded": "bg-orange-50 border-orange-200 text-orange-700",
  "Authentication Failed": "bg-red-50 border-red-200 text-red-700",
  "Permission Denied": "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Not Found": "bg-slate-50 border-slate-200 text-slate-600",
  "Invalid Request": "bg-orange-50 border-orange-200 text-orange-700",
  "Server Error": "bg-red-50 border-red-200 text-red-700",
  Timeout: "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Connection Error": "bg-yellow-50 border-yellow-200 text-yellow-700",
  "Element Not Found": "bg-orange-50 border-orange-200 text-orange-700",
  "Navigation Failed": "bg-orange-50 border-orange-200 text-orange-700",
};
