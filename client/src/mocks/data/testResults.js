/**
 * Mock Test Results Data
 * 
 * Realistic test execution results with metrics
 * Used when backend API is not available
 */

export const TEST_RESULTS_DATA = {
  summary: {
    totalRuns: 156,
    passed: 132,
    failed: 18,
    skipped: 6,
    passRate: '84.6%',
    avgDuration: '1m 24s',
    lastRunDate: '2 hours ago',
  },
  recentRuns: [
    {
      id: 'run-001',
      projectName: 'Mobile Banking App',
      status: 'Completed',
      result: 'Passed',
      totalTests: 24,
      passed: 22,
      failed: 2,
      duration: '5m 32s',
      executedAt: '2 hours ago',
      executedBy: 'QA Team',
    },
    {
      id: 'run-002',
      projectName: 'E-commerce Website',
      status: 'Completed',
      result: 'Failed',
      totalTests: 32,
      passed: 28,
      failed: 4,
      duration: '8m 15s',
      executedAt: '5 hours ago',
      executedBy: 'Platform QA',
    },
    {
      id: 'run-003',
      projectName: 'Admin Dashboard',
      status: 'Completed',
      result: 'Passed',
      totalTests: 18,
      passed: 18,
      failed: 0,
      duration: '3m 42s',
      executedAt: '1 day ago',
      executedBy: 'Backend QA',
    },
    {
      id: 'run-004',
      projectName: 'Payment Gateway',
      status: 'In Progress',
      result: 'Running',
      totalTests: 28,
      passed: 15,
      failed: 0,
      duration: '2m 18s',
      executedAt: 'Now',
      executedBy: 'Payments Team',
    },
    {
      id: 'run-005',
      projectName: 'Social Media Platform',
      status: 'Completed',
      result: 'Passed',
      totalTests: 45,
      passed: 43,
      failed: 2,
      duration: '12m 5s',
      executedAt: '2 days ago',
      executedBy: 'Growth QA',
    },
  ],
  failureTrends: [
    { date: 'Mar 14', failures: 3 },
    { date: 'Mar 15', failures: 5 },
    { date: 'Mar 16', failures: 2 },
    { date: 'Mar 17', failures: 4 },
    { date: 'Mar 18', failures: 6 },
    { date: 'Mar 19', failures: 3 },
    { date: 'Mar 20', failures: 2 },
  ],
};
