/**
 * Empty State Component
 * 
 * Standardized empty state for lists, tables, and data views
 * Shows when there's no data to display
 */

import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * @param {Object} props
 * @param {string} [props.title='No Data'] - Main heading
 * @param {string} [props.description] - Subtitle explaining the empty state
 * @param {React.ReactNode} [props.icon] - Custom icon (defaults to Inbox)
 * @param {Object} [props.action] - Optional action button { label, onClick }
 * @param {boolean} [props.compact=false] - Smaller variant
 */
export default function EmptyState({ 
  title = 'No Data',
  description,
  icon,
  action,
  compact = false,
}) {
  const Icon = icon || Inbox;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16'}`}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold">{title}</h3>
      
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-6 bg-[var(--brand-primary)] text-white 
                     hover:bg-[var(--brand-primary-hover)]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
