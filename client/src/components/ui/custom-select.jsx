import { useState, useRef, useEffect } from "react";

/**
 * CustomSelect — branded dropdown theo design system.
 * Dùng CSS vars từ theme thay vì hardcode màu.
 *
 * Props:
 *  value         — giá trị đang chọn
 *  onValueChange — callback(newValue)
 *  options       — [{ value, label, sublabel? }]
 *  placeholder   — text khi chưa chọn
 *  className     — class ngoài wrapper (vd: "w-full", "w-44")
 *  disabled      — boolean
 */
export function CustomSelect({
  value,
  onValueChange,
  options = [],
  placeholder = "Select...",
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div
      ref={ref}
      className={`relative inline-block ${className}`}
      style={{ minWidth: 120 }}
    >
      {/* ── Trigger ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "var(--surface)",
          border: `1px solid ${open ? "var(--brand-primary)" : "var(--hairline-strong)"}`,
          borderRadius: 6,
          boxShadow: open ? "0px 4px 14px rgba(0,0,0,0.15)" : "none",
          padding: "5px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        <span
          style={{
            fontFamily: "inherit",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "20px",
            letterSpacing: "0.01em",
            color: selected ? "var(--fg)" : "var(--fg-3)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {selected ? selected.label : placeholder}
        </span>

        {/* Chevron */}
        <svg
          width={11}
          height={6}
          viewBox="0 0 11 6"
          fill="none"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          <path
            d="M1 1L5.5 5L10 1"
            stroke="var(--fg-3)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: "100%",
            boxSizing: "border-box",
            background: "var(--surface)",
            border: "1px solid var(--brand-primary)",
            boxShadow: "0px 4px 14px rgba(0,0,0,0.15)",
            borderRadius: 6,
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* Separator */}
          <div style={{ height: 1, background: "var(--hairline-strong)" }} />

          {options.length === 0 ? (
            <div
              style={{
                padding: "6px 10px",
                fontSize: 13,
                color: "var(--fg-3)",
              }}
            >
              No options
            </div>
          ) : (
            options.map((opt) => {
              const isActive = String(opt.value) === String(value);
              return (
                <OptionRow
                  key={opt.value}
                  opt={opt}
                  isActive={isActive}
                  onSelect={() => {
                    onValueChange?.(String(opt.value));
                    setOpen(false);
                  }}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function OptionRow({ opt, isActive, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minHeight: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        gap: 6,
        fontSize: 14,
        lineHeight: "30px",
        letterSpacing: "0.01em",
        color: isActive ? "var(--brand-primary)" : "var(--fg)",
        background: isActive
          ? "var(--brand-50)"
          : hovered
          ? "var(--surface-2)"
          : "var(--surface)",
        cursor: "pointer",
        transition: "background 0.1s",
      }}
    >
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {opt.label}
      </span>

      {opt.sublabel && (
        <span
          style={{
            flexShrink: 0,
            fontSize: 11,
            color: "var(--fg-4)",
          }}
        >
          {opt.sublabel}
        </span>
      )}

      {/* Active checkmark */}
      {isActive && (
        <svg
          width={12}
          height={12}
          viewBox="0 0 12 12"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M2 6L5 9L10 3"
            stroke="var(--brand-primary)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
