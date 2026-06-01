import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { diaryApi } from '../../api/diaryApi';

export const DiaryDetail: React.FC = () => {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const [diary, setDiary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await diaryApi.getDetail(diaryId || '');
        setDiary(res.data.diary);
      } catch (error) {
        console.error(error);
        alert('Không tìm thấy nhật ký');
        navigate('/diary');
      } finally { setLoading(false); }
    };
    fetch();
  }, [diaryId]);

  if (loading) return <MobileLayout><div className="p-4">Đang tải...</div></MobileLayout>;

  return (
    <MobileLayout>
      <div className="p-4 pb-24">
        <div className="bg-white rounded p-4 shadow">
          <h2 className="font-bold text-xl">{diary.title}</h2>
          <p className="text-xs text-gray-500">{diary.author_name} • {new Date(diary.created_at).toLocaleString()}</p>
          {diary.location && <p className="text-pink-500 mt-2">📍 {diary.location}</p>}
          <div className="mt-4 whitespace-pre-line">{diary.content}</div>
          {diary.images && diary.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {diary.images.map((img: string, idx: number) => (
                <img key={idx} src={img} alt={`img-${idx}`} className="w-full h-40 object-cover rounded" />
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};