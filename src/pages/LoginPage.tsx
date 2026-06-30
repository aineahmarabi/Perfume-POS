import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../hooks/useAuth";
import { Delete, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";

function useCountdown(lockedUntil: number | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!lockedUntil) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, lockedUntil - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);
  return remaining;
}

export function LoginPage() {
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginWithPin = useMutation(api.auth.loginWithPin);
  const settings = useQuery(api.settings.getAll);
  const shopName = settings === undefined ? "" : (settings["shop_name"] ?? "Perfume POS");

  const countdown = useCountdown(lockedUntil);
  const isLocked = lockedUntil !== null && countdown > 0;

  const formatCountdown = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (lockedUntil && countdown === 0) {
      setLockedUntil(null);
      setError("");
      setAttemptsLeft(null);
    }
  }, [countdown, lockedUntil]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4 || isLocked) return;
    const newPin = [...pin, digit];
    setPin(newPin);
    setError("");
    if (newPin.length === 4) handleLogin(newPin.join(""));
  };

  const handleDelete = () => {
    if (isLocked) return;
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleLogin = async (pinStr: string) => {
    setLoading(true);
    try {
      const result = await loginWithPin({ pin: pinStr });

      if (result.error === "locked" && result.lockedUntil) {
        setLockedUntil(result.lockedUntil);
        setAttemptsLeft(0);
        setPin([]);
        return;
      }

      if (result.success && result.user) {
        setAttemptsLeft(null);
        setLockedUntil(null);
        login(result.user as Parameters<typeof login>[0]);
        navigate(result.user.role === "admin" ? "/" : "/pos");
        return;
      }

      // Failed login
      if (result.attemptsLeft !== null && result.attemptsLeft !== undefined) {
        setAttemptsLeft(result.attemptsLeft);
      }
      setError("Incorrect PIN.");
      setPin([]);
    } catch {
      setError("Connection error. Try again.");
      setPin([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isLocked || loading) return;
      if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
      else if (e.key === "Backspace") handleDelete();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLocked, loading, pin]);

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
          <h1 className="text-xl font-semibold text-[#1E1B3A] tracking-tight">{shopName}</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Enter your PIN to continue</p>
        </div>

        {/* Lockout banner */}
        {isLocked ? (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-center">
            <ShieldAlert size={28} className="mx-auto text-[#DC2626] mb-2" />
            <p className="text-sm font-semibold text-[#DC2626]">Terminal locked</p>
            <p className="text-xs text-[#9B9B9B] mt-1">Too many failed attempts</p>
            <p className="text-2xl font-mono font-bold text-[#DC2626] mt-2">{formatCountdown(countdown)}</p>
            <p className="text-xs text-[#9B9B9B] mt-1">Unlocks automatically</p>
          </div>
        ) : (
          <>
            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-3 w-3 rounded-full border-2 transition-all duration-150",
                    pin.length > i ? "bg-[#1E1B3A] border-[#1E1B3A]" : "bg-transparent border-[#E0E0E0]"
                  )}
                />
              ))}
            </div>

            {/* Error / warning */}
            {error && <p className="text-sm text-[#DC2626] text-center mb-1">{error}</p>}
            {attemptsLeft !== null && attemptsLeft > 0 && (
              <p className="text-xs text-amber-600 text-center mb-3 font-medium">
                {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left before lockout
              </p>
            )}
            {!error && !attemptsLeft && <div className="mb-4" />}

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
                    className="h-14 rounded-md text-xl font-medium text-[#1E1B3A] hover:bg-[#F7F7F7] active:bg-[#F0F0F0] border border-[#E0E0E0] transition-colors duration-100 disabled:opacity-30"
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {loading && <p className="text-sm text-[#9B9B9B] text-center mt-4">Verifying...</p>}
          </>
        )}

        <p className="text-center mt-6" style={{ fontFamily: "'Dancing Script', cursive", fontSize: "20px", color: "#1E1B3A", letterSpacing: "0.02em" }}>
          EtherealDayo
        </p>
      </div>
    </div>
  );
}
