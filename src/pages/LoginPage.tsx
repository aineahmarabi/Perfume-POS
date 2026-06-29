import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { Delete } from "lucide-react";
import { cn } from "../lib/utils";

export function LoginPage() {
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginWithPin = useMutation(api.auth.loginWithPin);
  const settings = useQuery(api.settings.getAll);
  const shopName = settings === undefined ? "" : (settings["shop_name"] ?? "Perfume POS");

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = [...pin, digit];
    setPin(newPin);
    setError("");

    if (newPin.length === 4) {
      handleLogin(newPin.join(""));
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleLogin = async (pinStr: string) => {
    setLoading(true);
    try {
      const result = await loginWithPin({ pin: pinStr });
      if (result.success && result.user) {
        login(result.user as Parameters<typeof login>[0]);
        navigate(result.user.role === "admin" ? "/" : "/pos");
      } else {
        setError("Invalid PIN. Please try again.");
        setPin([]);
      }
    } catch {
      setError("Login failed. Please try again.");
      setPin([]);
    } finally {
      setLoading(false);
    }
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E0E0E0] rounded-md p-8 w-full max-w-sm shadow-sm">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white border-2 border-[#E0E0E0] shadow-md overflow-hidden flex items-center justify-center">
            <img
              src="/Ethereal Dayo official Logo.png"
              alt="Ethereal Dayo Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl font-semibold text-[#685b8a] tracking-tight">{shopName}</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Enter your PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-3 w-3 rounded-full border-2 transition-all duration-150",
                pin.length > i
                  ? "bg-[#685b8a] border-[#685b8a]"
                  : "bg-transparent border-[#E0E0E0]"
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-[#DC2626] text-center mb-4">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((d, i) => {
            if (d === "") return <div key={i} />;
            if (d === "del") {
              return (
                <button
                  key={i}
                  onClick={handleDelete}
                  disabled={loading || pin.length === 0}
                  className="h-14 rounded-md flex items-center justify-center text-[#6B6B6B] hover:bg-[#F7F7F7] active:bg-[#F0F0F0] transition-colors duration-100 disabled:opacity-30"
                >
                  <Delete size={20} strokeWidth={1.5} />
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleDigit(d)}
                disabled={loading || pin.length >= 4}
                className="h-14 rounded-md text-xl font-medium text-[#685b8a] hover:bg-[#F7F7F7] active:bg-[#F0F0F0] border border-[#E0E0E0] transition-colors duration-100 disabled:opacity-30"
              >
                {d}
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="text-sm text-[#9B9B9B] text-center mt-4">Verifying...</p>
        )}

        <p className="text-sm text-[#9B9B9B] text-center mt-6">
          Demo: Admin PIN 1234 | Cashier PIN 0000
        </p>
      </div>
    </div>
  );
}
