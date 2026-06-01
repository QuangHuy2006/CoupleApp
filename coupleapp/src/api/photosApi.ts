import axiosClient from './axiosClient';

export const photosApi = {
    uploadPhotos: (formData: FormData) =>
        axiosClient.post('/api/photos/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }),

    getPhotos: (userId: string) =>
        axiosClient.get(`/api/photos/${userId}`),

    deletePhoto: (photoId: string) =>
        axiosClient.delete(`/api/photos/${photoId}`),

    setPrimaryPhoto: (photoId: string) =>
        axiosClient.put(`/api/photos/${photoId}/primary`),
};
