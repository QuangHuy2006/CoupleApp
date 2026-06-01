import axiosClient from './axiosClient';

export const profileApi = {
  getProfile: () => axiosClient.get('/api/profile/me'),
  updateProfile: (data: { full_name?: string; phone_number?: string; cccd?: string; avatar?: string }) => 
    axiosClient.put('/api/profile/update', data),
  getProfileCompletion: () => axiosClient.get('/api/profile/completion/status'),
  uploadAvatar: (formData: FormData) => axiosClient.post('/api/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};