import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B]"
        />
        <input
          ref={ref}
          type="text"
          className={cn(
            "h-10 pl-9 pr-3 border border-[#E0E0E0] rounded-md text-sm bg-white focus:border-[#6B1A2A] focus:ring-1 focus:ring-[#6B1A2A] outline-none transition-all duration-150 text-[#6B1A2A] placeholder:text-[#9B9B9B]",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
