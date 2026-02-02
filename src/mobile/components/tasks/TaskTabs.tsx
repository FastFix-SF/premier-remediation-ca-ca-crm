import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TaskTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TaskTabs: React.FC<TaskTabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="px-4 pt-2 pb-3">
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-2xl backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200",
              "flex items-center justify-center gap-1.5",
              activeTab === tab.id
                ? "bg-background shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="truncate">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary"
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TaskTabs;
