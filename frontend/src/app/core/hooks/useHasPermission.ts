import { useMemo } from 'react';
import { authService } from '../services/auth.service';

/**
 * Hook để kiểm tra quyền của người dùng hiện tại
 * @param permissionCode Mã quyền cần kiểm tra (ví dụ: 'customer:view' hoặc 'module:customer')
 * @returns boolean true nếu có quyền, ngược lại false
 */
export const useHasPermission = (permissionCode?: string): boolean => {
  const user = authService.getUser();
  
  return useMemo(() => {
    // Nếu không truyền code thì mặc định là true (không yêu cầu quyền)
    if (!permissionCode) return true;
    
    // Nếu không có user (chưa đăng nhập) thì false
    if (!user) return false;
    
    // Kiểm tra nếu là Super Admin (có role Super Admin hoặc username là admin) thì có tất cả các quyền
    const roles = (user.roles as string[]) || [];
    const isSuperAdmin = roles.includes('Super Admin') || roles.includes('super_admin') || user.username === 'admin';
    if (isSuperAdmin) return true;
    
    if (!user.permissions) return false;
    const permissions = user.permissions as string[];
    
    if (permissions.includes(permissionCode)) return true;
    if (permissionCode.startsWith('module:') || permissionCode.startsWith('menu:')) return true;
    const cleanCode = permissionCode.replace(/^module:|^menu:/, '');
    return permissions.some(p => p === cleanCode || p.startsWith(cleanCode + ':') || p.startsWith(cleanCode + '_'));
  }, [user, permissionCode]);
};
