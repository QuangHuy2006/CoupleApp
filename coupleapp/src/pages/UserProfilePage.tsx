/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MobileLayout } from '../components/layout/MobileLayout';
import { profileApi } from '../api/profileApi';
import './UserProfile.css';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
  phone_number?: string;
  cccd?: string;
  user_code: string;
  profile_complete: boolean;
  is_paired: boolean;
  partner_name?: string;
  partner_id?: string;
  latitude?: number;
  longitude?: number;
}

const UserProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    cccd: '',
    avatar: '',
  });

  useEffect(() => {
    if (user) {
      setUserData({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_code: (user as any).user_code || 'N/A',
        profile_complete: (user as any).profile_complete || false,
        is_paired: user.is_paired || false,
        partner_name: user.partner_name,
        partner_id: user.partner_id,
        avatar: (user as any).avatar,
      });
      setFormData({
        full_name: user.full_name,
        phone_number: (user as any).phone_number || '',
        cccd: (user as any).cccd || '',
        avatar: (user as any).avatar || '',
      });
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const res = await profileApi.uploadAvatar(formData);
      if (res.data.success) {
        // Update local state with new avatar
        setUserData(prev => prev ? { ...prev, avatar: res.data.avatar } : null);
        if (user) {
          updateUser({ ...user, avatar: res.data.avatar } as any);
        }
        setSuccess('✅ Cập nhật ảnh đại diện thành công!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải ảnh lên');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setError('');
      setSuccess('');

      if (!formData.full_name.trim()) {
        setError('Tên không được để trống');
        return;
      }

      await profileApi.updateProfile(formData);
      setSuccess('✅ Cập nhật thành công!');
      setIsEditing(false);
      setUserData(prev => prev ? { ...prev, ...formData } : null);
      if (user) {
        updateUser({ ...user, full_name: formData.full_name } as any);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi cập nhật');
    }
  };

  if (loading) {
    return <div className="profile-loading">⏳ Đang tải...</div>;
  }

  if (!userData) {
    return <div className="profile-error">❌ Không thể tải profile</div>;
  }

  return (
    <MobileLayout>
      <div className="profile-container">
      <div className="profile-header">
        <h1>👤 Trang Cá Nhân</h1>
        {userData.user_code && (
          <div className="user-code-badge">
            Mã: <strong>{userData.user_code}</strong>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!userData.profile_complete && (
        <div className="profile-warning">
          ⚠️ Profile chưa hoàn thành. Hãy thêm thông tin!
        </div>
      )}

      <div className="profile-main">
        <div className="profile-avatar-section relative group cursor-pointer" onClick={handleAvatarClick}>
          {userData.avatar ? (
            <img 
              src={userData.avatar.startsWith('http') ? userData.avatar : `${import.meta.env.VITE_API_URL}${userData.avatar}`} 
              alt="Avatar" 
              className="profile-avatar" 
            />
          ) : (
            <div className="profile-avatar-placeholder flex items-center justify-center">📸</div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="text-white text-xs">Đổi ảnh</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          {userData.is_paired && (
            <div className="paired-badge">💑 Đã kết đôi</div>
          )}
        </div>

        <div className="profile-info-section">
          {!isEditing ? (
            <>
              <div className="info-group">
                <label>Tên:</label>
                <p>{userData.full_name}</p>
              </div>

              <div className="info-group">
                <label>Email:</label>
                <p>{userData.email}</p>
              </div>

              {userData.phone_number && (
                <div className="info-group">
                  <label>Số điện thoại:</label>
                  <p>{userData.phone_number}</p>
                </div>
              )}

              {userData.cccd && (
                <div className="info-group">
                  <label>CCCD:</label>
                  <p>{userData.cccd}</p>
                </div>
              )}

              {userData.is_paired && userData.partner_name && (
                <div className="info-group partner-info">
                  <label>Người yêu:</label>
                  <p>💕 {userData.partner_name}</p>
                </div>
              )}

              <button 
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Chỉnh sửa
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Tên: *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại:</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="0..."
                />
              </div>

              <div className="form-group">
                <label>CCCD:</label>
                <input
                  type="text"
                  name="cccd"
                  value={formData.cccd}
                  onChange={handleInputChange}
                  placeholder="12 chữ số"
                  maxLength={12}
                />
              </div>

              <div className="button-group">
                <button 
                  className="btn btn-success"
                  onClick={handleSaveProfile}
                >
                  ✅ Lưu
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  ❌ Hủy
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-label">Profile</span>
          <span className={`stat-value ${userData.profile_complete ? 'complete' : 'incomplete'}`}>
            {userData.profile_complete ? '✅ Hoàn thành' : '⏳ Chưa hoàn'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Trạng thái</span>
          <span className="stat-value">{userData.is_paired ? '💑 Đôi' : '👤 Độc thân'}</span>
        </div>
      </div>
      </div>
    </MobileLayout>
  );
};

export default UserProfilePage;
