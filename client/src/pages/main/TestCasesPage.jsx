/**
 * Test Cases Page
 * 
 * Displays test cases list with filtering and search
 * Uses feature components from /features/test-cases
 */

import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { useTestCases } from '@/features/test-cases/hooks/useTestCases';
import LoadingSpinner from '@/shared/components/common/LoadingSpinner';
import ErrorBanner from '@/shared/components/common/ErrorBanner';
import EmptyState from '@/shared/components/common/EmptyState';
import PageHeader from '@/shared/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Status Badge Component
 */
function StatusBadge({ status }) {
  const styles = {
    Passed: 'bg-emerald-100 text-emerald-700 border-emerald-500/20',
    Failed: 'bg-red-100 text-red-700 border-red-500/20',
    Pending: 'bg-slate-100 text-slate-700 border-slate-500/20',
    Skipped: 'bg-blue-100 text-blue-700 border-blue-500/20',
  };

  return (
    <Badge className={`border ${styles[status] || styles.Pending}`}>
      {status}
    </Badge>
  );
}

/**
 * Priority Badge Component
 */
function PriorityBadge({ priority }) {
  const styles = {
    Critical: 'bg-red-100 text-red-700 font-semibold',
    High: 'bg-orange-100 text-orange-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${styles[priority] || styles.Medium}`}>
      {priority}
    </span>
  );
}

export default function TestCasesPage() {
  const { testCases, loading, error } = useTestCases();
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading test cases..." />
      </div>
    );
  }

  if (error) {
    return <ErrorBanner message={error} fullWidth onRetry={() => window.location.reload()} />;
  }

  const filteredCases = testCases.filter((tc) =>
    tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Test Cases"
        description="Manage and organize your automated test cases"
        action={
          <Button className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]">
            <Plus className="mr-2 size-4" />
            New Test Case
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search test cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 size-4" />
          Filter
        </Button>
      </div>

      {/* Results */}
      {filteredCases.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'No test cases found' : 'No Test Cases'}
          description={
            searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first test case to get started'
          }
        />
      ) : (
        <div className="rounded-xl border bg-white">
          <div className="grid gap-px divide-y">
            {filteredCases.map((tc) => (
              <div
                key={tc.id}
                className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{tc.name}</h3>
                    <StatusBadge status={tc.status} />
                    <PriorityBadge priority={tc.priority} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {tc.description}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Suite: {tc.suite}</span>
                    <span>Type: {tc.type}</span>
                    <span>Last run: {tc.lastRun}</span>
                    <span>Duration: {tc.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
