import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { MobileLayout } from "../../components/layout/MobileLayout";
import { useAuth } from "../../context/AuthContext";
import { coupleApi } from "../../api/coupleApi";

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [anniversaryDate, setAnniversaryDate] = useState<string>("");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const updateTimer = (dateStr: string) => {
      const startDate = new Date(dateStr).getTime();
      const now = new Date().getTime();
      const diff = now - startDate;

      if (diff >= 0) {
        // Cộng 1 ngày nếu tính ngày bắt đầu là ngày 1 (giữ logic cũ)
        // Tuy nhiên với đồng hồ đếm ngược, thường dùng thời gian trôi qua thực tế
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeTogether({ days, hours, minutes, seconds });
      }
    };

    const fetchCoupleInfo = async () => {
      try {
        const response = await coupleApi.getCoupleInfo();
        if (response.data.anniversaryDate) {
          setAnniversaryDate(response.data.anniversaryDate);
          
          updateTimer(response.data.anniversaryDate);
          interval = setInterval(() => {
            updateTimer(response.data.anniversaryDate);
          }, 1000);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin cặp đôi", error);
      }
    };
    
    fetchCoupleInfo();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-center">
            <div className="text-6xl mb-3">💕</div>
            <h2 className="text-2xl font-bold">
              {user?.full_name} & {user?.partner_name}{" "}
            </h2>
            <p className="text-pink-100 mt-2">Cặp đôi hạnh phúc</p>
          </div>
        </div>

        {/* Counter Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <p className="text-gray-500 text-sm mb-2">Chúng mình bên nhau</p>
          <div className="flex justify-center items-center gap-2 text-pink-500 my-4">
            <div className="flex flex-col items-center w-16">
              <span className="text-4xl font-bold">{timeTogether.days}</span>
              <span className="text-xs text-gray-400 mt-1">Ngày</span>
            </div>
            <span className="text-2xl font-bold mb-4">:</span>
            <div className="flex flex-col items-center w-12">
              <span className="text-3xl font-bold">{timeTogether.hours.toString().padStart(2, '0')}</span>
              <span className="text-xs text-gray-400 mt-1">Giờ</span>
            </div>
            <span className="text-2xl font-bold mb-4">:</span>
            <div className="flex flex-col items-center w-12">
              <span className="text-3xl font-bold">{timeTogether.minutes.toString().padStart(2, '0')}</span>
              <span className="text-xs text-gray-400 mt-1">Phút</span>
            </div>
            <span className="text-2xl font-bold mb-4">:</span>
            <div className="flex flex-col items-center w-12">
              <span className="text-3xl font-bold">{timeTogether.seconds.toString().padStart(2, '0')}</span>
              <span className="text-xs text-gray-400 mt-1">Giây</span>
            </div>
          </div>
          {anniversaryDate && (
            <p className="text-xs text-gray-400 mt-2">
              Từ ngày {format(new Date(anniversaryDate), "dd/MM/yyyy")}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition">
            <div className="text-4xl mb-2">📖</div>
            <h3 className="font-semibold text-gray-800">Nhật ký</h3>
            <p className="text-xs text-gray-500 mt-1">Lưu giữ kỷ niệm</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg text-center hover:shadow-xl transition">
            <div className="text-4xl mb-2">💬</div>
            <h3 className="font-semibold text-gray-800">Nhắn tin</h3>
            <p className="text-xs text-gray-500 mt-1">Trò chuyện mỗi ngày</p>
          </div>
        </div>

        {/* Upcoming Anniversary */}
        <div className="bg-pink-50 rounded-2xl p-4 border border-pink-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎂</span>
            <div>
              <p className="text-sm font-semibold text-pink-600">Sắp đến</p>
              <p className="text-gray-800 font-medium">
                Kỷ niệm yêu thương sắp tới
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
