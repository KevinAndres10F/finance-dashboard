import { cn } from '../lib/utils';

export function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
              activeTab === tab.id
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
