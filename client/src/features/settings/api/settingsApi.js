/**
 * Settings API Module
 */

import { 
  getUserSettings as getUserSettingsMock,
  updateUserSettings as updateUserSettingsMock,
} from '@/mocks/handlers/apiHandlers';

export async function getUserSettings() {
  const response = await getUserSettingsMock();
  return response.data;
}

export async function updateUserSettings(settings) {
  const response = await updateUserSettingsMock(settings);
  return response.data;
}
