import { cn } from "../../lib/utils";

export function Card({ className, children, glass = true, ...props }) {
    return (
        <div
            className={cn(
                "rounded-2xl p-6 transition-all duration-300",
                glass
                    ? "glass glass-hover"
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
