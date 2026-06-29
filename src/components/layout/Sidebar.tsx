import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

interface NavItem {
  label: string;
  icon: typeof ShoppingCart;
  path: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: TrendingUp, path: "/" },
  { label: "POS", icon: ShoppingCart, path: "/pos" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Inventory", icon: Boxes, path: "/inventory" },
  { label: "Sales", icon: Receipt, path: "/sales" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Reports", icon: BarChart3, path: "/reports", adminOnly: true },
  { label: "Settings", icon: Settings, path: "/settings", adminOnly: true },
];

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const settings = useQuery(api.settings.getAll);
  const shopName = settings === undefined ? "" : (settings["shop_name"] ?? "Perfume POS");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex w-60 bg-[#8B5A2B] fixed left-0 top-0 h-screen flex-col z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/20">
        <p className="text-sm font-bold text-white tracking-tight">{shopName}</p>
        <p className="text-xs text-white/60 mt-0.5">{user?.name}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100 mx-2 rounded-md",
                isActive
                  ? "bg-white text-[#8B5A2B] font-semibold shadow-sm"
                  : "text-white/80 hover:bg-white/15 hover:text-white"
              )
            }
          >
            <item.icon size={16} strokeWidth={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/20 p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/15 hover:text-white rounded-md w-full transition-colors duration-100"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
