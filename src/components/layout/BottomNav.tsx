import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  TrendingUp,
  Receipt,
  Users,
  Package,
  Boxes,
  BarChart3,
  Settings,
  LogOut,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

const primaryItems: { label: string; icon: typeof ShoppingCart; path: string; center?: boolean }[] = [
  { label: "Dashboard", icon: TrendingUp, path: "/" },
  { label: "Sales", icon: Receipt, path: "/sales" },
  { label: "POS", icon: ShoppingCart, path: "/pos", center: true },
  { label: "Products", icon: Package, path: "/products" },
];

const moreItems = [
  { label: "Customers", icon: Users, path: "/customers", adminOnly: false },
  { label: "Inventory", icon: Boxes, path: "/inventory", adminOnly: false },
  { label: "Reports", icon: BarChart3, path: "/reports", adminOnly: true },
  { label: "Settings", icon: Settings, path: "/settings", adminOnly: true },
];

export function BottomNav() {
  const { isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const visibleMore = moreItems.filter((i) => !i.adminOnly || isAdmin);

  const handleLogout = () => {
    setShowMore(false);
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E0E0E0] flex items-end">
        {primaryItems.map((item) => {
          if (item.center) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center pb-2"
              >
                {({ isActive }) => (
                  <div className={cn(
                    "flex flex-col items-center gap-0.5",
                    "-mt-5"
                  )}>
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-colors",
                      isActive ? "bg-[#2D2A5E]" : "bg-[#1E1B3A]"
                    )}>
                      <item.icon size={24} strokeWidth={2} className="text-white" />
                    </div>
                    <span className={cn(
                      "text-[11px] font-semibold mt-1",
                      isActive ? "text-[#1E1B3A]" : "text-[#9B9B9B]"
                    )}>
                      {item.label}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  isActive ? "text-[#1E1B3A]" : "text-[#9B9B9B]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
            showMore ? "text-[#1E1B3A]" : "text-[#9B9B9B]"
          )}
        >
          <MoreHorizontal size={20} strokeWidth={1.5} />
          <span>More</span>
        </button>
      </nav>

      {/* More sheet */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMore(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl shadow-lg pt-2 pb-6 px-4">
            {/* Handle + header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1E1B3A] flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E1B3A]">{user?.name}</p>
                  <p className="text-sm text-[#9B9B9B] capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMore(false)}
                className="p-2 rounded-full hover:bg-[#F0F0F0] text-[#6B6B6B]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid of more items */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {visibleMore.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-colors",
                      isActive
                        ? "bg-[#1E1B3A]/10 text-[#1E1B3A]"
                        : "bg-[#F7F7F7] text-[#6B6B6B] hover:bg-[#F0F0F0]"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FFF0F0] text-[#DC2626] text-sm font-medium"
            >
              <LogOut size={16} strokeWidth={1.5} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
