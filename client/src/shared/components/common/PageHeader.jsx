/**
 * Page Header Component
 *
 * Standardized page header with title, description, and actions
 * Ensures consistent layout across all pages
 */

/**
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} [props.description] - Optional subtitle/description
 * @param {React.ReactNode} [props.action] - Action button(s) on the right
 * @param {React.ReactNode} [props.children] - Additional content below header
 */
export default function PageHeader({ title, description, action, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight break-words">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}

      {children && <div className="w-full sm:w-auto sm:pt-2">{children}</div>}
    </div>
  );
}
