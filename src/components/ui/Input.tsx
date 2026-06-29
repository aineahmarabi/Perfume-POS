import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#6B6B6B] mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "h-10 px-3 border border-[#E0E0E0] rounded-md text-sm bg-white focus:border-[#685b8a] focus:ring-1 focus:ring-[#685b8a] outline-none transition-all duration-150 w-full text-[#685b8a] placeholder:text-[#9B9B9B]",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
