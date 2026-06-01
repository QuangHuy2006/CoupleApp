import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coupleApi } from '../../api/coupleApi';

export const Pairing: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [pairCode, setPairCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCode = async () => {
    setLoading(true);
    try {
      const response = await coupleApi.createPairCode();
      setGeneratedCode(response.data.code);
    } catch (error) {
        console.log(error);
      alert('Tạo mã thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCode = async () => {
    if (!pairCode.trim()) {
      alert('Vui lòng nhập mã kết đôi');
      return;
    }

    setLoading(true);
    try {
      const response = await coupleApi.pairWithCode(pairCode);
      updateUser(response.data.user);
      navigate('/');
    } catch (error) {
        console.log(error);
      alert('Mã kết đôi không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  if (user?.is_paired) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💑</div>
            <h2 className="text-2xl font-bold text-gray-800">Kết đôi yêu thương</h2>
            <p className="text-gray-500 text-sm mt-2">
              Kết nối với nửa kia của bạn để bắt đầu hành trình
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                mode === 'create'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tạo mã
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                mode === 'join'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Nhập mã
            </button>
          </div>

          {mode === 'create' && (
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Tạo mã kết đôi để nửa kia của bạn nhập
              </p>
              {!generatedCode ? (
                <button
                  onClick={handleCreateCode}
                  disabled={loading}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition"
                >
                  {loading ? 'Đang tạo...' : 'Tạo mã kết đôi'}
                </button>
              ) : (
                <div className="text-center">
                  <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-6 mb-4">
                    <p className="text-sm text-gray-600 mb-2">Mã kết đôi của bạn:</p>
                    <p className="text-4xl font-bold text-pink-500 tracking-wider">
                      {generatedCode}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Chia sẻ mã này với người yêu của bạn
                  </p>
                </div>
              )}
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nhập mã kết đôi"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 outline-none text-center text-2xl tracking-wider"
                maxLength={8}
              />
              <button
                onClick={handleJoinCode}
                disabled={loading}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? 'Đang xử lý...' : 'Kết đôi ngay'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};