import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/auth.service';

/**
 * Guard route: chặn truy cập nếu chưa đăng nhập.
 * Đồng thời gọi /auth/me để refresh user profile (roles, permissions, staffId, ...)
 * mỗi khi app được mount — đảm bảo localStorage luôn đồng bộ với server.
 */
export const ProtectedRoute = () => {
  const isAuth = authService.isAuthenticated();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!isAuth) {
      setSynced(true);
      return;
    }
    // Refresh user profile từ server (không await để không block render)
    authService.getCurrentUser().finally(() => setSynced(true));
  }, []);

  if (!isAuth) return <Navigate to="/login" replace />;

  // Chờ sync xong mới render children để hooks đọc được staffId mới nhất
  if (!synced) return null;

  return <Outlet />;
};
