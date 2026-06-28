import { NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Receipt,
  Truck,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
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
  { label: "Purchases", icon: Truck, path: "/purchases", adminOnly: true },
  { label: "Suppliers", icon: Building2, path: "/suppliers", adminOnly: true },
  { label: "Expenses", icon: DollarSign, path: "/expenses", adminOnly: true },
  { label: "Reports", icon: BarChart3, path: "/reports", adminOnly: true },
  { label: "Settings", icon: Settings, path: "/settings", adminOnly: true },
];

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const settings = useQuery(api.settings.getAll);
  // undefined = still loading; show nothing until resolved to avoid flash
  const shopName = settings === undefined ? "" : (settings["shop_name"] ?? "Perfume POS");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex w-60 bg-[#F7F7F7] border-r border-[#E0E0E0] fixed left-0 top-0 h-screen flex-col z-30">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#E0E0E0]">
        <p className="text-sm font-semibold text-[#6B1A2A] tracking-tight">{shopName}</p>
        <p className="text-sm text-[#9B9B9B] mt-0.5">{user?.name}</p>
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
                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100",
                isActive
                  ? "bg-white border-r-2 border-[#6B1A2A] text-[#6B1A2A] font-medium"
                  : "text-[#6B6B6B] hover:bg-[#F0F0F0] hover:text-[#6B1A2A]"
              )
            }
          >
            <item.icon size={16} strokeWidth={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E0E0E0] p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#6B6B6B] hover:bg-[#F0F0F0] hover:text-[#6B1A2A] rounded-md w-full transition-colors duration-100"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
