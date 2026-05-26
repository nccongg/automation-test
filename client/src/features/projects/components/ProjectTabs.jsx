/**
 * Project Tabs Component
 * 
 * Tabbed interface for different project sections
 * Scalable design - easy to add new tabs
 */

import { useState } from 'react';
import { FileText, PlayCircle, BarChart3, Settings, TestTube2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @param {Object} props
 * @param {string|number} props.projectId - Project ID for navigation
 */
export default function ProjectTabs({ projectId }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: FileText,
      content: <OverviewContent projectId={projectId} />,
    },
    {
      id: 'test-cases',
      label: 'Test Cases',
      icon: TestTube2,
      content: <ComingSoonSection title="Test Cases" projectId={projectId} />,
    },
    {
      id: 'runs',
      label: 'Test Runs',
      icon: PlayCircle,
      content: <ComingSoonSection title="Test Runs" projectId={projectId} />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      content: <ComingSoonSection title="Reports" projectId={projectId} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      content: <ComingSoonSection title="Settings" projectId={projectId} />,
    },
  ];

  return (
    <div className="rounded-xl border bg-card">
      {/* Tab Navigation */}
      <div className="flex border-b px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[4px] after:rounded-t-full after:transition-colors',
                isActive
                  ? 'text-[var(--ds-tab-active)] after:bg-[var(--ds-tab-active)]'
                  : 'text-muted-foreground hover:text-foreground after:bg-transparent'
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

/**
 * Overview Content - Placeholder for future implementation
 */
function OverviewContent({ projectId }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Project Overview</h3>
      <p className="text-sm text-muted-foreground">
        Detailed project overview and recent activity will be displayed here.
      </p>
      <div className="rounded-lg border bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Enhanced overview features coming soon...
        </p>
      </div>
    </div>
  );
}

/**
 * Coming Soon Section - Reusable placeholder for future features
 */
function ComingSoonSection({ title, projectId }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-muted">
        <FileText className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This section is under development and will be available soon.
      </p>
    </div>
  );
}
