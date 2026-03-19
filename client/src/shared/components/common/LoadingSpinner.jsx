/**
 * Loading Spinner Component
 * 
 * Standardized loading indicator for the application
 * Can be used inline or as a full-page loader
 */

import { Loader2 } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string} [props.size='md'] - Size variant: sm, md, lg
 * @param {string} [props.color='currentColor'] - Spinner color
 * @param {boolean} [props.fullScreen=false] - Whether to center in viewport
 * @param {string} [props.label] - Optional loading text
 */
export default function LoadingSpinner({ 
  size = 'md', 
  color = 'currentColor', 
  fullScreen = false,
  label,
}) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-8',
    lg: 'size-12',
  };

  const spinner = (
    <div className="flex items-center justify-center gap-3">
      <Loader2 
        className={`${sizeClasses[size]} animate-spin`} 
        style={{ color }} 
      />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
