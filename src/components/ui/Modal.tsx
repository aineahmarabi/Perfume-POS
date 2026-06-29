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
    <>
      {/* Mobile: full-screen */}
      <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
        <div className="flex items-center h-14 px-4 border-b border-[#E0E0E0] flex-shrink-0">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-md hover:bg-[#F0F0F0] transition-colors"
          >
            <X size={20} />
          </button>
          {title && (
            <h2 className="flex-1 text-center text-sm font-semibold text-[#3432a8] pr-8">
              {title}
            </h2>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>

      {/* Desktop: centered overlay */}
      <div
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className={cn(
            "relative bg-white rounded-md shadow-sm border border-[#E0E0E0] w-full my-4 flex flex-col",
            "max-h-[calc(100vh-2rem)]",
            maxWidths[maxWidth],
            className
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0] flex-shrink-0">
              <h2 className="text-sm font-semibold text-[#3432a8]">{title}</h2>
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
              className="absolute right-4 top-4 h-8 w-8 rounded-md flex items-center justify-center hover:bg-[#F0F0F0] transition-colors z-10"
            >
              <X size={16} />
            </button>
          )}
          <div className="overflow-y-auto flex-1 p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
