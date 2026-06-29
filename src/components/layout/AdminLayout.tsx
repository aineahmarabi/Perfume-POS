import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Menu, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  return (
    <div className="flex min-h-screen bg-[#F7F7F7]">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 min-h-screen md:ml-60 pb-28 md:pb-0 min-w-0 overflow-x-hidden flex flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#E0E0E0] h-14 px-4 md:px-6 flex items-center gap-3 flex-shrink-0">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-[#F0F0F0] text-[#6B6B6B] flex-shrink-0"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="flex-1 relative max-w-md hidden sm:block">
            <input
              placeholder="Search products, invoices, customers..."
              className="w-full h-9 pl-4 pr-10 border border-[#E0E0E0] rounded-md text-sm bg-white outline-none focus:border-[#1E1B3A] placeholder:text-[#9B9B9B]"
            />
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] pointer-events-none" />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button className="p-1.5 rounded-md hover:bg-[#F0F0F0] text-[#6B6B6B]">
              <Bell size={19} />
            </button>
            <button
              className="p-1.5 rounded-md hover:bg-[#F0F0F0] text-[#6B6B6B]"
              onClick={() => navigate("/settings")}
            >
              <Settings size={19} />
            </button>
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-[#E0E0E0]">
              <div className="w-8 h-8 rounded-full bg-[#1E1B3A] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-[#0A0A0A] leading-none">{user?.name ?? "Admin"}</p>
                <p className="text-xs text-[#9B9B9B] capitalize mt-0.5">{user?.role ?? "administrator"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 max-w-[1400px] w-full">
          {title && (
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h1 className="text-lg md:text-xl font-semibold text-[#1E1B3A] tracking-tight">
                {title}
              </h1>
            </div>
          )}
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
