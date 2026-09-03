import axios from 'axios';
import { loadingService } from './loading.service';
import { authService } from './auth.service';
import { toast } from './toast.service';
import i18n from '../i18n/i18n';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null
  }
});

api.interceptors.request.use((config) => {
  loadingService.start();
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const siteId = authService.getWorkingSiteId();
  if (siteId) {
    config.headers['X-Site-Id'] = siteId;
  }
  
  const dbChoice = localStorage.getItem('dbChoice');
  if (dbChoice) {
    config.headers['X-Database-Choice'] = dbChoice;
  }

  const lang = localStorage.getItem('language') || 'vi';
  config.headers['Accept-Language'] = lang;
  
  return config;
}, (error) => {
  loadingService.stop();
  return Promise.reject(error);
});

const getErrorMessage = (errorData: any) => {
  const errorObj = errorData?.error || errorData;
  if (errorObj?.code) {
    const key = `error.${errorObj.code}`;
    if (i18n.exists(key)) {
      return i18n.t(key);
    }
  }
  if (errorObj?.message) {
    const key = `error.${errorObj.message}`;
    if (i18n.exists(key)) {
      return i18n.t(key);
    }
    return errorObj.message;
  }
  return errorData?.message || i18n.t('error.SERVER_ERROR');
};

const getSuccessMessage = (response: any) => {
  if (response.data?.message) {
    const key = `common.api.${response.data.message}`;
    if (i18n.exists(key)) return i18n.t(key);
    return response.data.message;
  }
  const method = response.config.method?.toLowerCase();
  if (method === 'post') return i18n.t('common.create_success');
  if (method === 'put' || method === 'patch') return i18n.t('common.update_success');
  if (method === 'delete') return i18n.t('common.delete_success');
  return i18n.t('common.success');
};

api.interceptors.response.use(
  (response) => {
    loadingService.stop();
    const method = response.config.method?.toLowerCase();
    const isMutation = method === 'post' || method === 'put' || method === 'delete' || method === 'patch';

    if (isMutation) {
      const skipSuccessToast = response.config.headers?.['X-Skip-Success-Toast'] === 'true' || (response.config as any).skipSuccessToast;
      if (response.data?.success === false) {
        toast.error(getErrorMessage(response.data));
      } else if (!skipSuccessToast) {
        toast.success(getSuccessMessage(response));
      }
    }

    return response;
  },
  (error) => {
    loadingService.stop();
    const skipErrorToast = error.config?.headers?.['X-Skip-Error-Toast'] === 'true' || (error.config as any)?.skipErrorToast;
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (!skipErrorToast) {
        const errorMsg = getErrorMessage(error.response.data);
        toast.error(errorMsg);
      }
    } else if (!skipErrorToast) {
      toast.error(i18n.t('error.SERVER_ERROR'));
    }
    return Promise.reject(error);
  }
);

export default api;
