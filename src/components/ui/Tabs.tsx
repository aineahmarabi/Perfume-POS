import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType>({ activeTab: "", setActiveTab: () => {} });

interface TabsProps {
  defaultTab: string;
  children: ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
}

export function Tabs({ defaultTab, children, className, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleChange = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto no-scrollbar border-b border-[#E0E0E0]", className)}>
      <div className="flex min-w-max">
        {children}
      </div>
    </div>
  );
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150 whitespace-nowrap shrink-0",
        isActive
          ? "border-[#1E1B3A] text-[#1E1B3A]"
          : "border-transparent text-[#6B6B6B] hover:text-[#1E1B3A]"
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div>{children}</div>;
}
