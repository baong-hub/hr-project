import api from './api.service';

export const masterDataService = {
  getCustomerTypes: () => api.get('/master-data/customer-types'),
  getCustomerSources: () => api.get('/master-data/customer-sources'),
  getReferralSources: () => api.get('/master-data/referral-sources'),
  getOccupations: () => api.get('/master-data/occupations'),
  getCustomerGroups: () => api.get('/master-data/customer-groups'),
  getEthnicities: () => api.get('/master-data/ethnicities'),
  getLoyaltyLevels: () => api.get('/master-data/loyalty-levels'),
  getServices: () => api.get('/master-data/services'),
  getRooms: (params?: { siteId?: number; isActive?: boolean }) => api.get('/master-data/rooms', { params }),
  getSites: () => api.get('/sites'),
  // Locations
  getProvinces: () => api.get('/locations/provinces'),
  getWards: (provinceId: number) => api.get(`/locations/wards/${provinceId}`),
  getUnits: () => api.get('/inventory/units'),
};
