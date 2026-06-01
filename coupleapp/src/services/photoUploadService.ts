import axios, { type AxiosProgressEvent } from 'axios';

interface UploadResponse {
    success: boolean;
    message: string;
    photos?: Array<{
        id: string;
        photo_path: string;
        is_primary: boolean;
    }>;
}

class PhotoUploadService {
    private apiBaseUrl: string;

    constructor() {
        this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    }

    /**
     * Validate image files
     */
    validateFiles(files: File[]): { valid: boolean; message: string } {
        if (files.length === 0) {
            return { valid: false, message: 'Vui lòng chọn ít nhất một ảnh' };
        }

        if (files.length < 3) {
            return { valid: false, message: `Vui lòng chọn ít nhất 3 ảnh (hiện có ${files.length})` };
        }

        if (files.length > 10) {
            return { valid: false, message: 'Tối đa 10 ảnh cho mỗi lần upload' };
        }

        const maxFileSize = 5 * 1024 * 1024; // 5MB
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (!file.type.startsWith('image/')) {
                return { valid: false, message: `File ${file.name} không phải là ảnh` };
            }

            if (file.size > maxFileSize) {
                return { 
                    valid: false, 
                    message: `File ${file.name} quá lớn (tối đa 5MB)` 
                };
            }
        }

        return { valid: true, message: '' };
    }

    /**
     * Upload photos
     */
    async uploadPhotos(
        files: File[],
        token: string,
        onProgress?: (progress: number) => void
    ): Promise<UploadResponse> {
        try {
            const validation = this.validateFiles(files);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }

            const formData = new FormData();
            files.forEach((file) => {
                formData.append('photos', file);
            });

            const response = await axios.post<UploadResponse>(
                `${this.apiBaseUrl}/photos/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    },
                    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                        if (progressEvent.total) {
                            const progress = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            onProgress?.(progress);
                        }
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Photo upload error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi upload ảnh'
            };
        }
    }

    /**
     * Get user photos
     */
    async getPhotos(userId: string): Promise<any[]> {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/photos/${userId}`);
            return response.data.photos || [];
        } catch (error) {
            console.error('Get photos error:', error);
            return [];
        }
    }

    /**
     * Delete a photo
     */
    async deletePhoto(photoId: string, token: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.delete(`${this.apiBaseUrl}/photos/${photoId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Delete photo error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xóa ảnh'
            };
        }
    }

    /**
     * Set primary photo
     */
    async setPrimaryPhoto(photoId: string, token: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.put(
                `${this.apiBaseUrl}/photos/${photoId}/primary`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Set primary photo error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi cập nhật ảnh'
            };
        }
    }

    /**
     * Create image preview URL
     */
    createPreview(file: File): string {
        return URL.createObjectURL(file);
    }

    /**
     * Revoke preview URL
     */
    revokePreview(url: string): void {
        URL.revokeObjectURL(url);
    }
}

export default new PhotoUploadService();
