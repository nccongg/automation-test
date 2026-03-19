/**
 * Mock Projects Data
 * 
 * Realistic project list with various statuses
 * Used when backend API is not available
 */

export const PROJECTS_DATA = [
  {
    id: 'proj-1',
    name: 'Mobile Banking App',
    owner: 'QA Team',
    status: 'Active',
    testCases: 24,
    lastRun: '2 hours ago',
    passRate: '87.5%',
    description: 'Automated testing for mobile banking features',
  },
  {
    id: 'proj-2',
    name: 'E-commerce Website',
    owner: 'Platform QA',
    status: 'Paused',
    testCases: 32,
    lastRun: '1 day ago',
    passRate: '92.3%',
    description: 'Checkout and product search automation',
  },
  {
    id: 'proj-3',
    name: 'Admin Dashboard',
    owner: 'Backend QA',
    status: 'Active',
    testCases: 18,
    lastRun: '3 days ago',
    passRate: '95.1%',
    description: 'User management and analytics testing',
  },
  {
    id: 'proj-4',
    name: 'Social Media Platform',
    owner: 'Growth QA',
    status: 'Archived',
    testCases: 45,
    lastRun: '1 week ago',
    passRate: '88.7%',
    description: 'Post creation and feed interactions',
  },
  {
    id: 'proj-5',
    name: 'Payment Gateway',
    owner: 'Payments Team',
    status: 'Active',
    testCases: 28,
    lastRun: '30 minutes ago',
    passRate: '96.4%',
    description: 'Payment processing and validation',
  },
];
