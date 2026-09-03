import api from './api.service';

export const locationService = {
  getCountries: () => api.get('/locations/countries'),
  getProvinces: (countryId?: number) => api.get('/locations/provinces', { params: { countryId } }),
  getWards: (provinceId: number) => api.get(`/locations/wards/${provinceId}`),
};
