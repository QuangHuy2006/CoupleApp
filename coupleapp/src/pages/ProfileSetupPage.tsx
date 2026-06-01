import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/profileApi';
import { photosApi } from '../api/photosApi';
import PhotoUpload from '../components/common/PhotoUpload';
import './ProfileSetup.css';

export default function ProfileSetupPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // Step 1: Info, Step 2: Photos
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        cccd: '',
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const validateStep1 = (): boolean => {
        if (!formData.full_name.trim()) {
            setError('Vui lòng nhập họ tên');
            return false;
        }

        if (!/^0\d{9}$/.test(formData.phone_number.replace(/\s/g, ''))) {
            setError('Số điện thoại không hợp lệ');
            return false;
        }

        if (!/^\d{12}$/.test(formData.cccd)) {
            setError('CCCD phải là 12 chữ số');
            return false;
        }

        return true;
    };

    const handleNextStep = async () => {
        if (!validateStep1()) return;

        setLoading(true);
        setError('');

        try {
            const response = await profileApi.updateProfile(formData);
            if (response.data.success) {
                setSuccess('Thông tin đã được cập nhật');
                setTimeout(() => setStep(2), 500);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotosSelected = (files: File[]) => {
        setSelectedFiles(files);
    };

    const handlePhotoUploadComplete = async (files: File[]) => {
        setLoading(true);
        setError('');

        try {
            const formDataObj = new FormData();
            files.forEach((file) => {
                formDataObj.append('photos', file);
            });

            const response = await photosApi.uploadPhotos(formDataObj);

            if (response.data.success) {
                setSuccess('Profile đã hoàn tất! Chuyển hướng...');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                setError(response.data.message || 'Lỗi upload ảnh');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Lỗi upload ảnh');
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = () => {
        let progress = 0;
        if (formData.full_name) progress += 25;
        if (formData.phone_number) progress += 25;
        if (formData.cccd) progress += 25;
        if (selectedFiles.length >= 3) progress += 25;
        return progress;
    };

    return (
        <div className="profile-setup-page">
            <div className="profile-setup-container">
                <div className="profile-setup-header">
                    <h1>Hoàn tất hồ sơ</h1>
                    <p>Vui lòng cung cấp thông tin để bắt đầu sử dụng ứng dụng</p>
                </div>

                <div className="progress-bar">
                    <div className="progress" style={{ width: `${calculateProgress()}%` }}></div>
                </div>
                <p className="progress-text">{calculateProgress()}%</p>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {step === 1 ? (
                    <div className="step-content">
                        <h2>Bước 1: Thông tin cá nhân</h2>

                        <div className="form-group">
                            <label htmlFor="full_name">Họ tên</label>
                            <input
                                type="text"
                                id="full_name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder="Nhập họ tên"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_number">Số điện thoại</label>
                            <input
                                type="tel"
                                id="phone_number"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                placeholder="0xxxxxxxxx"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="cccd">CCCD</label>
                            <input
                                type="text"
                                id="cccd"
                                name="cccd"
                                value={formData.cccd}
                                onChange={handleInputChange}
                                placeholder="12 chữ số"
                                disabled={loading}
                                maxLength={12}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleNextStep}
                            disabled={loading}
                        >
                            {loading ? 'Đang lưu...' : 'Tiếp theo'}
                        </button>
                    </div>
                ) : (
                    <div className="step-content">
                        <h2>Bước 2: Tải ảnh của bạn</h2>
                        <p>Vui lòng tải lên ít nhất 3 ảnh</p>

                        <PhotoUpload
                            onPhotosSelected={handlePhotosSelected}
                            onUploadComplete={handlePhotoUploadComplete}
                            loading={loading}
                        />

                        <button
                            className="btn-secondary"
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            Quay lại
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
