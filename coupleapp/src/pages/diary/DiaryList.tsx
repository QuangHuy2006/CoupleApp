import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { diaryApi } from '../../api/diaryApi';

interface Diary {
  id: string;
  title: string;
  content: string;
  location?: string;
  images: string[];
  created_at: string;
  author_name: string;
}

export const DiaryList: React.FC = () => {
  const navigate = useNavigate();

  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchDiaries();
  }, []);

  async function fetchDiaries() {
    try {
      const response = await diaryApi.getAll();
      setDiaries(response.data.diaries || []);
    } catch (error) {
      console.error('Lỗi lấy danh sách nhật ký:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (diaryId: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa nhật ký này?')) return;
    
    try {
      await diaryApi.delete(diaryId);
      setDiaries(diaries.filter(d => d.id !== diaryId));

    } catch (error) {
      alert('Lỗi xóa nhật ký');
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen">
          <div>Đang tải...</div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-4 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📖 Nhật Ký Kỷ Niệm</h2>
              <p className="text-pink-100 text-sm mt-1">Lưu giữ những khoảnh khắc đáng nhớ</p>
            </div>
            <button
              onClick={() => navigate('/diary/add')}
              className="bg-white text-pink-500 font-bold px-4 py-2 rounded-lg hover:bg-pink-100 transition"
            >
              ➕ Thêm
            </button>
          </div>
        </div>

        {/* Diaries List */}
        {diaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-600 font-medium">Chưa có nhật ký nào</p>
            <p className="text-gray-500 text-sm mt-2">Hãy tạo nhật ký đầu tiên để lưu giữ kỷ niệm</p>
          </div>
        ) : (
          <div className="space-y-4">
            {diaries.map((diary) => (
              <div
                key={diary.id}
                className="bg-white rounded-xl p-4 shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/diary/${diary.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">{diary.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mt-1">{diary.content}</p>
                    {diary.location && (
                      <p className="text-pink-500 text-xs mt-2">📍 {diary.location}</p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-gray-500 text-xs">
                        {diary.author_name} • {new Date(diary.created_at).toLocaleDateString('vi-VN')}
                      </p>
                      {diary.images && diary.images.length > 0 && (
                        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded">
                          🖼️ {diary.images.length} ảnh
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(diary.id);
                    }}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};