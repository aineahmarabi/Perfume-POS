import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-[#6B6B6B] mb-1">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            className={cn(
              "h-10 px-3 pr-8 border border-[#E0E0E0] rounded-md text-sm bg-white focus:border-[#6B1A2A] focus:ring-1 focus:ring-[#6B1A2A] outline-none transition-all duration-150 w-full text-[#6B1A2A] appearance-none",
              error && "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]",
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] pointer-events-none"
          />
        </div>
        {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
