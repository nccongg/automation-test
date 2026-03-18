/**
 * api/auth.js — Auth API module
 *
 * Tập trung toàn bộ HTTP calls liên quan đến authentication.
 * Mỗi page/hook chỉ cần import hàm cụ thể, không cần biết URL hay headers.
 */

import { apiClient } from "./client";

export const authApi = {
  /**
   * Đăng nhập.
   * @returns {{ data: { token: string, user: object } }}
   */
  login(email, password) {
    return apiClient.post("/auth/login", { email, password });
  },

  /**
   * Đăng ký tài khoản mới.
   * @returns {{ data: { user: object } }}
   */
  register(email, name, password) {
    return apiClient.post("/auth/register", { email, name, password });
  },

  /**
   * Gửi email reset mật khẩu.
   * @returns {{ message: string }}
   */
  forgotPassword(email) {
    return apiClient.post("/auth/forgot-password", { email });
  },

  /**
   * Xác nhận OTP / verification code.
   * @returns {{ data: { resetToken: string } }}
   */
  verifyCode(code) {
    return apiClient.post("/auth/verify-code", { code });
  },

  /**
   * Đặt lại mật khẩu với resetToken.
   * @returns {{ message: string }}
   */
  resetPassword(resetToken, newPassword) {
    return apiClient.post("/auth/reset-password", { resetToken, newPassword });
  },
};
