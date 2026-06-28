import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "md", className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={cn(
          "relative bg-white rounded-md shadow-sm border border-[#E0E0E0] w-full p-6",
          maxWidths[maxWidth],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#6B1A2A]">{title}</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-[#F0F0F0] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 rounded-md flex items-center justify-center hover:bg-[#F0F0F0] transition-colors"
          >
            <X size={16} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
