import api from './api.service';

const normalizePermissions = (permissions: string[]) => {
  if (!permissions) return [];
  const mapped = [...permissions];
  
  if (permissions.includes('jobs:view')) {
    mapped.push('job:search', 'job:view');
  }
  if (permissions.includes('jobs:create')) {
    mapped.push('job:post');
  }
  if (permissions.includes('jobs:update') || permissions.includes('jobs:delete')) {
    mapped.push('job:manage');
  }
  if (permissions.includes('cvs:view')) {
    mapped.push('cv:search');
  }
  if (permissions.includes('cvs:create') || permissions.includes('cvs:update') || permissions.includes('cvs:delete')) {
    mapped.push('cv:manage');
  }
  if (permissions.includes('applications:create')) {
    mapped.push('job:apply');
  }
  if (permissions.includes('interviews:view')) {
    mapped.push('interview:view');
  }
  if (permissions.includes('companies:view')) {
    mapped.push('company:view');
  }
  if (permissions.includes('companies:update')) {
    mapped.push('company:update');
  }
  if (permissions.includes('saved-jobs:view')) {
    mapped.push('job:save');
  }
  if (permissions.includes('notifications:view')) {
    mapped.push('notification:view');
  }
  if (permissions.includes('reports:view')) {
    mapped.push('report:view', 'report:view_all');
  }
  if (permissions.includes('user-role:view') || permissions.includes('user-role:manage')) {
    mapped.push('user-role:view');
  }
  
  return Array.from(new Set(mapped));
};

const normalizeUser = (user: any) => {
  if (!user) return user;
  
  if (!user.roles) {
    user.roles = user.role ? [user.role] : [];
  }
  
  // Normalize permissions array
  if (user.permissions) {
    user.permissions = normalizePermissions(user.permissions);
  }
  
  if (user.role === 'Ứng viên') {
    user.role = 'CANDIDATE';
  } else if (user.role === 'Nhà tuyển dụng') {
    user.role = 'EMPLOYER';
  } else if (user.role === 'Super Admin') {
    user.role = 'ADMIN';
  }
  
  if (user.role === 'CANDIDATE' && !user.roles.includes('Ứng viên')) {
    user.roles.push('Ứng viên');
  }
  if (user.role === 'EMPLOYER' && !user.roles.includes('Nhà tuyển dụng')) {
    user.roles.push('Nhà tuyển dụng');
  }
  if (user.role === 'ADMIN' && !user.roles.includes('Super Admin')) {
    user.roles.push('Super Admin');
  }
  
  return user;
};

export const authService = {
  registerCandidate: async (dto: any) => {
    const response = await api.post('/auth/register/candidate', dto);
    return response.data;
  },

  registerEmployer: async (dto: any) => {
    const response = await api.post('/auth/register/employer', dto);
    return response.data;
  },

  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.data.accessToken) {
      const { accessToken, refreshToken, user } = response.data.data;
      const normalizedUser = normalizeUser(user);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      // Backwards compatibility for old site ID
      if (normalizedUser.siteId) {
        localStorage.setItem('workingSiteId', normalizedUser.siteId.toString());
      }
      window.dispatchEvent(new CustomEvent('app-auth-changed'));
    }
    return response.data;
  },

  refreshToken: async () => {
    const token = localStorage.getItem('refreshToken');
    if (!token) return { success: false, error: 'No refresh token stored' };
    const response = await api.post('/auth/refresh', { refreshToken: token });
    if (response.data.success && response.data.data.accessToken) {
      const { accessToken, refreshToken, user } = response.data.data;
      const normalizedUser = normalizeUser(user);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      window.dispatchEvent(new CustomEvent('app-auth-changed'));
    }
    return response.data;
  },

  logout: async () => {
    const token = localStorage.getItem('refreshToken') || '';
    
    // Clear auth credentials immediately to prevent race condition in route guards
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('workingSiteId');
    localStorage.removeItem('systemConfigs');
    localStorage.removeItem('subordinate_user_ids');
    window.dispatchEvent(new CustomEvent('app-auth-changed'));

    if (token) {
      try {
        await api.post('/auth/logout', { refreshToken: token }, { headers: { 'X-Skip-Success-Toast': 'true' } as any });
      } catch {
        // Ignore network errors on logout
      }
    }
  },

  getPublicConfig: async () => {
    try {
      const response = await api.get('/auth/public-config');
      return response.data;
    } catch {
      return { success: false, data: { companyEmailDomain: '', isCompanyEmailDomainLoginEnabled: false } };
    }
  },

  googleLogin: async (data: { email?: string; password?: string; googleToken?: string }) => {
    const response = await api.post('/auth/google-login', data);
    if (response.data.success && response.data.data.token) {
      const { token, user, systemConfigs } = response.data.data;
      const normalizedUser = normalizeUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      if (normalizedUser.subordinateUserIds) {
        localStorage.setItem('subordinate_user_ids', JSON.stringify(normalizedUser.subordinateUserIds));
      }
      if (systemConfigs) {
        localStorage.setItem('systemConfigs', JSON.stringify(systemConfigs));
      }
      localStorage.setItem('workingSiteId', normalizedUser.siteId.toString());
      window.dispatchEvent(new CustomEvent('app-auth-changed'));
    }
    return response.data;
  },

  getWorkingSiteId: () => {
    return localStorage.getItem('workingSiteId');
  },

  setWorkingSiteId: (siteId: string | number) => {
    localStorage.setItem('workingSiteId', siteId.toString());
  },

  getToken: () => localStorage.getItem('token'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getSubordinateUserIds: (): number[] => {
    const ids = localStorage.getItem('subordinate_user_ids');
    return ids ? JSON.parse(ids) : [];
  },

  getSystemConfigs: () => {
    const configs = localStorage.getItem('systemConfigs');
    return configs ? JSON.parse(configs) : null;
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        const normalizedUser = normalizeUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        if (normalizedUser.subordinateUserIds) {
          localStorage.setItem('subordinate_user_ids', JSON.stringify(normalizedUser.subordinateUserIds));
        }
        return normalizedUser;
      }
      return null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => !!localStorage.getItem('token'),

  getAuthorizedMenus: async () => {
    const response = await api.get('/auth/menus');
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      const filterMenusRecursive = (menus: any[]): any[] => {
        return menus
          .filter((menu) => {
            if (!menu.code) return false;
            const hasMenu = menu.code.includes('menu:');
            const hasModule = menu.code.includes('module:');
            
            if (!hasMenu && !hasModule) return false;
            if (hasModule && (menu.route === null || menu.route === undefined)) return false;
            
            return true;
          })
          .map((menu) => {
            if (menu.children && menu.children.length > 0) {
              return {
                ...menu,
                children: filterMenusRecursive(menu.children)
              };
            }
            return menu;
          });
      };

      return {
        ...response.data,
        data: filterMenusRecursive(response.data.data)
      };
    }
    return response.data;
  },
};
