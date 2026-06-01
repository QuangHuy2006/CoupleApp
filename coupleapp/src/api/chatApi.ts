import axiosClient from './axiosClient';

export const chatApi = {
  getMessages: () => axiosClient.get('/api/chat/messages'),
  sendMessage: (data: { message?: string; type?: 'text' | 'image' | 'voice'; media_url?: string }) => axiosClient.post('/api/chat/send', data),
  uploadMedia: (formData: FormData) => axiosClient.post('/api/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getUnreadCount: () => axiosClient.get('/api/chat/unread'),
  markAsRead: () => axiosClient.put('/api/chat/read'),
};
