export const COLOR_OPTIONS = [
  { key: "indigo",  bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500",  ring: "ring-indigo-300",  border: "border-indigo-200"  },
  { key: "emerald", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-300", border: "border-emerald-200" },
  { key: "rose",    bg: "bg-rose-100",    text: "text-rose-700",    dot: "bg-rose-500",    ring: "ring-rose-300",    border: "border-rose-200"    },
  { key: "amber",   bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500",   ring: "ring-amber-300",   border: "border-amber-200"   },
  { key: "violet",  bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500",  ring: "ring-violet-300",  border: "border-violet-200"  },
  { key: "cyan",    bg: "bg-cyan-100",    text: "text-cyan-700",    dot: "bg-cyan-500",    ring: "ring-cyan-300",    border: "border-cyan-200"    },
  { key: "slate",   bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-500",   ring: "ring-slate-300",   border: "border-slate-200"   },
];

export function getColor(key) {
  return COLOR_OPTIONS.find((c) => c.key === key) ?? COLOR_OPTIONS[0];
}
