/**
 * Mock Project Data
 * 
 * Realistic project data for development and testing
 * Replace with real API calls when backend is ready
 */

export const PROJECTS_DATA = [
  {
    id: 1,
    title: 'Mobile Banking App',
    description: 'Comprehensive testing for login, transactions, and account management features',
    baseUrl: 'https://mobile-banking.example.com',
    status: 'Passing',
    statusTone: 'passing',
    testCases: 8,
    passRate: '87.5%',
    lastRun: '2 hours ago',
    createdAt: '2026-03-05T08:30:00Z',
    updatedAt: '2026-03-20T06:30:00Z',
  },
  {
    id: 2,
    title: 'E-commerce Website',
    description: 'End-to-end testing for product search, cart, and checkout flow',
    baseUrl: 'https://shop.example.com',
    status: 'Failing',
    statusTone: 'failing',
    testCases: 7,
    passRate: '71.4%',
    lastRun: '5 hours ago',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-20T03:00:00Z',
  },
  {
    id: 3,
    title: 'Admin Dashboard',
    description: 'User management, analytics, and reporting system validation',
    baseUrl: 'https://admin.example.com',
    status: 'Failing',
    statusTone: 'failing',
    testCases: 6,
    passRate: '50%',
    lastRun: '1 day ago',
    createdAt: '2026-02-23T14:20:00Z',
    updatedAt: '2026-03-19T08:00:00Z',
  },
  {
    id: 4,
    title: 'Social Media Platform',
    description: 'Post creation, feed interactions, and messaging features',
    baseUrl: 'https://social.example.com',
    status: 'Passing',
    statusTone: 'passing',
    testCases: 6,
    passRate: '83.3%',
    lastRun: '3 hours ago',
    createdAt: '2026-03-03T09:15:00Z',
    updatedAt: '2026-03-20T05:00:00Z',
  },
  {
    id: 5,
    title: 'Healthcare Portal',
    description: 'Patient records, appointment scheduling, and telemedicine features',
    baseUrl: 'https://healthcare.example.com',
    status: 'Passing',
    statusTone: 'passing',
    testCases: 5,
    passRate: '100%',
    lastRun: '6 hours ago',
    createdAt: '2026-02-26T11:30:00Z',
    updatedAt: '2026-03-20T02:00:00Z',
  },
  {
    id: 6,
    title: 'CRM Management System',
    description: 'Customer relationship management and sales pipeline tracking',
    baseUrl: 'https://crm.example.com',
    status: 'Passing',
    statusTone: 'passing',
    testCases: 5,
    passRate: '80%',
    lastRun: '8 hours ago',
    createdAt: '2026-02-20T16:45:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 7,
    title: 'Learning Platform',
    description: 'Online courses, quizzes, and progress tracking system',
    baseUrl: 'https://learning.example.com',
    status: 'Passing',
    statusTone: 'passing',
    testCases: 5,
    passRate: '100%',
    lastRun: '12 hours ago',
    createdAt: '2026-02-18T13:00:00Z',
    updatedAt: '2026-03-19T20:00:00Z',
  },
  {
    id: 8,
    title: 'Booking System',
    description: 'Hotel and flight booking with payment integration',
    baseUrl: 'https://booking.example.com',
    status: 'Partial',
    statusTone: 'pending',
    testCases: 5,
    passRate: '60%',
    lastRun: '1 day ago',
    createdAt: '2026-02-24T10:30:00Z',
    updatedAt: '2026-03-19T06:00:00Z',
  },
  {
    id: 9,
    title: 'Food Delivery App',
    description: 'Restaurant browsing, ordering, and delivery tracking',
    baseUrl: 'https://food-delivery.example.com',
    status: 'Passing',
    statusTone: 'passing',
    testCases: 5,
    passRate: '80%',
    lastRun: '10 hours ago',
    createdAt: '2026-02-22T15:20:00Z',
    updatedAt: '2026-03-19T22:00:00Z',
  },
  {
    id: 10,
    title: 'Real Estate Platform',
    description: 'Property listings, virtual tours, and agent contact system',
    baseUrl: 'https://realestate.example.com',
    status: 'Passing',
    statusTone: 'passing',
    testCases: 5,
    passRate: '100%',
    lastRun: '2 days ago',
    createdAt: '2026-02-16T12:00:00Z',
    updatedAt: '2026-03-18T08:00:00Z',
  },
];

/**
 * Get project by ID from mock data
 * @param {string|number} projectId - Project ID
 * @returns {Object|null} Project data or null
 */
export function getProjectByIdMock(projectId) {
  const id = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
  return PROJECTS_DATA.find((p) => p.id === id) || null;
}
