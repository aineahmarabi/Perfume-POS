import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn("w-full overflow-auto", className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-[#E0E0E0] hover:bg-[#F7F7F7] transition-colors duration-100",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHeader({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const alignClass = { left: "text-left", right: "text-right", center: "text-center" }[align];
  return (
    <th
      className={cn(
        "px-4 py-3 text-sm font-medium uppercase tracking-wider text-[#6B6B6B] bg-[#F0F0F0] h-10",
        alignClass,
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const alignClass = { left: "text-left", right: "text-right", center: "text-center" }[align];
  return (
    <td className={cn("px-4 py-3 text-sm align-middle", alignClass, className)}>
      {children}
    </td>
  );
}
