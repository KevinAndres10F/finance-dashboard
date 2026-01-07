import { cn } from "../../lib/utils";

export function Card({ className, children, ...props }) {
    return (
        <div className={cn("bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6", className)} {...props}>
            {children}
        </div>
    );
}
