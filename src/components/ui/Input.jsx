import { cn } from "../../lib/utils";

export function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-xl px-3 py-2 text-sm",
                "bg-white/85 dark:bg-slate-800/75",
                "backdrop-blur-sm",
                "border border-slate-200/80 dark:border-white/15",
                "text-slate-900 dark:text-white",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "shadow-sm",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-300/80 dark:focus:border-white/20",
                "focus:bg-white/80 dark:focus:bg-slate-800/80",
                "disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}
