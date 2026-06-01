import axiosClient from './axiosClient';

export const locationApi = {
    updateLocation: (latitude: number, longitude: number) =>
        axiosClient.post('/api/location/update', { latitude, longitude }),

    getPartnerLocation: () =>
        axiosClient.get('/api/location/partner'),

    getLocationHistory: (days: number = 7) =>
        axiosClient.get(`/api/location/history?days=${days}`),

    deleteLocationHistory: () =>
        axiosClient.delete('/api/location/history'),
};
