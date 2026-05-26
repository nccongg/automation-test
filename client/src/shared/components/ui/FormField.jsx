// Shared form field primitives aligned to the design system.
// Colors driven by --ds-* CSS vars defined in index.css.

export function FormLabel({ children, className = "" }) {
  return (
    <label
      className={`block text-sm leading-5 tracking-[0.01em] text-muted-foreground ${className}`}
    >
      {children}
    </label>
  );
}

export function FormInput({ className = "", ...props }) {
  return (
    <input
      className={`h-9 w-full rounded border border-input bg-muted/50 px-3 text-sm leading-5 tracking-[0.01em] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-success focus:bg-background transition-colors ${className}`}
      {...props}
    />
  );
}

export function FormTextarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded border border-input bg-muted/50 px-3 py-2 text-sm leading-5 tracking-[0.01em] text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-success focus:bg-background resize-none transition-colors ${className}`}
      {...props}
    />
  );
}

export function FormHint({ children, className = "" }) {
  return (
    <p className={`text-xs text-muted-foreground/70 ${className}`}>{children}</p>
  );
}

export function FormError({ children, className = "" }) {
  return (
    <p
      className={`rounded border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive ${className}`}
    >
      {children}
    </p>
  );
}

export function FormValue({ children, className = "" }) {
  return (
    <div
      className={`flex h-9 items-center rounded border border-input bg-muted/50 px-3 text-sm leading-5 tracking-[0.01em] text-foreground ${className}`}
    >
      {children}
    </div>
  );
}

export function FormField({ label, required, hint, error, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <FormLabel>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </FormLabel>
      )}
      {children}
      {hint && !error && <FormHint>{hint}</FormHint>}
      {error && <FormError>{error}</FormError>}
    </div>
  );
}
