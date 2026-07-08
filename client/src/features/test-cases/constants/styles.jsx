import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from "lucide-react";

export const STATUS_STYLE = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300",
  ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  archived: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

export const VERDICT_STRIPE = {
  pass: "border-l-emerald-400",
  pass_with_warning: "border-l-amber-400",
  fail: "border-l-red-400",
  error: "border-l-orange-400",
};

export const VERDICT_BG = {
  pass: "bg-emerald-50/40 dark:bg-emerald-950/15",
  pass_with_warning: "bg-amber-50/30 dark:bg-amber-950/15",
  fail: "bg-red-50/40 dark:bg-red-950/15",
  error: "bg-orange-50/20 dark:bg-orange-950/15",
};

export const VERDICT_BADGE = {
  pass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40",
  pass_with_warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40",
  fail: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/40",
  error: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800/40",
};

export const VERDICT_ICON = {
  pass: <CheckCircle2 className="size-4 text-emerald-500" />,
  pass_with_warning: <ShieldAlert className="size-4 text-amber-500" />,
  fail: <XCircle className="size-4 text-red-500" />,
  error: <AlertTriangle className="size-4 text-orange-500" />,
};

export const VERDICT_LABEL = {
  pass: "Pass",
  pass_with_warning: "Pass (no assertion)",
  fail: "Fail",
  error: "Error",
};

export const ERROR_STYLE = {
  "Invalid API Key": "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-300",
  "Rate Limit Exceeded": "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-800/40 dark:text-orange-300",
  "Authentication Failed": "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-300",
  "Permission Denied": "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-800/40 dark:text-yellow-300",
  "Not Found": "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-slate-300",
  "Invalid Request": "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-800/40 dark:text-orange-300",
  "Server Error": "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-300",
  Timeout: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-800/40 dark:text-yellow-300",
  "Connection Error": "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-800/40 dark:text-yellow-300",
  "Element Not Found": "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-800/40 dark:text-orange-300",
  "Navigation Failed": "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-800/40 dark:text-orange-300",
};
