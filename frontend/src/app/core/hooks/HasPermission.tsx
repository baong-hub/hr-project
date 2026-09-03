import React from 'react';
import { useHasPermission } from './useHasPermission';

interface HasPermissionProps {
  /** Mã quyền cần kiểm tra, ví dụ: 'lab_order:access' */
  code: string;
  /** Nội dung hiển thị khi có quyền */
  children: React.ReactNode;
  /** Nội dung fallback khi không có quyền (mặc định: null - ẩn hoàn toàn) */
  fallback?: React.ReactNode;
}

/**
 * Component dùng chung để ẩn/hiện UI theo quyền.
 *
 * Chỉ bảo vệ UI (ẩn/hiện), KHÔNG bảo vệ dữ liệu.
 * Bảo vệ dữ liệu thực sự phải được thực hiện ở Backend với [RequirePermission].
 *
 * @example
 * // Ẩn hoàn toàn nếu không có quyền
 * <HasPermission code="lab_order:access">
 *   <LabOrderTab />
 * </HasPermission>
 *
 * @example
 * // Hiển thị nội dung thay thế khi không có quyền
 * <HasPermission code="lab_order:access" fallback={<p>Bạn không có quyền truy cập</p>}>
 *   <LabOrderTab />
 * </HasPermission>
 */
export const HasPermission: React.FC<HasPermissionProps> = ({ code, children, fallback = null }) => {
  const hasPermission = useHasPermission(code);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
