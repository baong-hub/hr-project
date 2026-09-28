import { metaService } from './meta.service';

/**
 * @deprecated Use metaService from './meta.service' instead.
 */
export const locationService = {
  getCountries: async () => ({ data: [{ id: 1, name: 'Việt Nam' }] }),
  getProvinces: async () => {
    const provinces = await metaService.getProvinces();
    return { data: provinces };
  },
  getWards: async () => ({ data: [] }),
};

export default locationService;
