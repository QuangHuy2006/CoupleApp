import axiosClient from './axiosClient';

export const wishlistApi = {
  getAll: () => axiosClient.get('/api/wishlist'),
  create: (data: { title: string; description?: string }) => axiosClient.post('/api/wishlist', data),
  update: (id: string, data: { title?: string; description?: string; is_done?: boolean }) => axiosClient.put(`/api/wishlist/${id}`, data),
  remove: (id: string) => axiosClient.delete(`/api/wishlist/${id}`),
};