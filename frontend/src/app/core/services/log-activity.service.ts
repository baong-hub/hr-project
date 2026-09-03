import api from './api.service';

export const logActivityService = {
  getLogs: (moduleName: string, entityId: number) => 
    api.get('/log-activities', { params: { moduleName, entityId } }),
};
