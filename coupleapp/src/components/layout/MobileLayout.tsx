import React from "react";
import { BottomNav } from "./BottomNav";
import { useAuth } from "../../context/AuthContext";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-pink-500">❤️ CoupleApp</h1>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {user?.full_name}
              </span>
              {user?.partner_name && (
                <span className="text-xs text-pink-500">
                  💑 {user?.partner_name}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-4">{children}</main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
