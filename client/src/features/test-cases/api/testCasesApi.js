/**
 * Test Cases API Module
 * 
 * Test case management API calls
 * Currently uses mock data - replace with real API when ready
 */

import { 
  getTestCases as getTestCasesMock,
  getTestCaseById as getTestCaseByIdMock,
} from '@/mocks/handlers/apiHandlers';

export async function getTestCases() {
  const response = await getTestCasesMock();
  return response.data;
}

export async function getTestCaseById(testCaseId) {
  const response = await getTestCaseByIdMock(testCaseId);
  return response.data;
}
