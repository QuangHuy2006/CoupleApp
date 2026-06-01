import axiosClient from './axiosClient';

export const coupleApi = {
  createPairCode: () => axiosClient.post('/api/couple/create-code'),
pairWithCode: (code: string) => axiosClient.post('/api/couple/pair', { code }),
getCoupleInfo: () => axiosClient.get('/api/couple/info'),
updateAnniversary: (date: string) => axiosClient.put('/api/couple/anniversary', { date }),
};