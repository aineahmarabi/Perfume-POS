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
  LayoutDashboard,
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
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "POS", icon: ShoppingCart, path: "/pos" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Inventory", icon: Boxes, path: "/inventory" },
  { label: "Sales", icon: Receipt, path: "/sales" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Reports", icon: BarChart3, path: "/reports", adminOnly: true },
  { label: "Settings", icon: Settings, path: "/settings", adminOnly: true },
];

export function Sidebar() {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const settings = useQuery(api.settings.getAll);
  const shopName = settings === undefined ? "" : (settings["shop_name"] ?? "Perfume POS");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex w-60 bg-[#1E1B3A] fixed left-0 top-0 h-screen flex-col z-30">
      {/* Logo / shop header */}
      <div className="px-4 py-4 border-b border-white/20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
          <img
            src="/Ethereal Dayo official Logo.png"
            alt="Logo"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight tracking-tight">{shopName}</p>
          <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">Perfume Store</p>
        </div>
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
                  ? "bg-[#3D3777] text-white font-semibold"
                  : "text-white/60 hover:bg-[#2D2A5E] hover:text-white"
              )
            }
          >
            <item.icon size={16} strokeWidth={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-white/20 p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:bg-[#2D2A5E] hover:text-white rounded-md w-full transition-colors duration-100"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
