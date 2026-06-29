import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      {/* Sidebar â€” desktop only */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 min-h-screen md:ml-60 pb-28 md:pb-0 min-w-0 overflow-x-hidden">
        <div className="p-4 md:p-6 max-w-[1400px]">
          {title && (
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h1 className="text-lg md:text-xl font-semibold text-[#3432a8] tracking-tight">
                {title}
              </h1>
              <div className="w-10 h-10 rounded-full bg-white border border-[#E0E0E0] shadow-sm overflow-hidden flex-shrink-0">
                <img
                  src="/Ethereal Dayo official Logo.png"
                  alt="Ethereal Dayo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Bottom nav â€” mobile only */}
      <BottomNav />
    </div>
  );
}
