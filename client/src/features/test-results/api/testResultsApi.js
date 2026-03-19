/**
 * Test Results API Module
 */

import { getTestResults as getTestResultsMock } from '@/mocks/handlers/apiHandlers';

export async function getTestResults() {
  const response = await getTestResultsMock();
  return response.data;
}
