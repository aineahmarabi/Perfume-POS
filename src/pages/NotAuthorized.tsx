import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ShieldOff } from "lucide-react";

export function NotAuthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
      <div className="text-center">
        <ShieldOff size={40} className="text-[#9B9B9B] mx-auto mb-4" strokeWidth={1.5} />
        <h1 className="text-xl font-semibold text-[#1E1B3A] mb-2">Not Authorized</h1>
        <p className="text-sm text-[#6B6B6B] mb-6">You don't have permission to access this page.</p>
        <Button onClick={() => navigate("/pos")}>Return to POS</Button>
      </div>
    </div>
  );
}
