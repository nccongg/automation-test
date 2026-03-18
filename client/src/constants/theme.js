/**
 * Design Tokens — single source of truth cho brand colours & shadows.
 *
 * Dùng qua CSS vars trong Tailwind (ví dụ: `text-[var(--brand-primary)]`)
 * hoặc import trực tiếp JS constant khi cần dùng trong inline styles.
 */

export const BRAND_COLORS = {
  /** CTA button blue */
  primary: "#1692ff",
  primaryHover: "#0f83e8",

  /** Dark button (Google sign-in, etc.) */
  dark: "#2f3338",
  darkHover: "#262a2f",

  /** Auth page background */
  pageBg: "#5a4949",
};

export const BRAND_SHADOWS = {
  /** Blue glow — used on primary CTA buttons */
  primary: "0 6px 14px rgba(22, 146, 255, 0.28)",
  /** Smaller blue glow — used on secondary/small buttons */
  sm: "0 4px 12px rgba(22, 146, 255, 0.3)",
};
