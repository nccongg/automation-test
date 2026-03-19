/**
 * Error Banner Component
 * 
 * Standardized error display component
 * Shows error messages with optional retry action
 */

import { AlertCircle, X } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} [props.onDismiss] - Callback when user dismisses error
 * @param {Function} [props.onRetry] - Optional retry callback
 * @param {boolean} [props.fullWidth=false] - Whether to take full width
 */
export default function ErrorBanner({ 
  message, 
  onDismiss, 
  onRetry,
  fullWidth = false,
}) {
  return (
    <div 
      className={`
        flex items-start justify-between gap-4 rounded-lg border border-red-100 
        bg-red-50 p-4 text-sm text-red-700
        ${fullWidth ? 'w-full' : ''}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Error</p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium 
                       text-red-800 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md p-1 text-red-600 hover:bg-red-100 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
