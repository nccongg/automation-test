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
export default function PageHeader({ 
  title, 
  description, 
  action,
  children,
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      
      {action && <div>{action}</div>}
      
      {children && (
        <div className="w-full pt-2">
          {children}
        </div>
      )}
    </div>
  );
}
