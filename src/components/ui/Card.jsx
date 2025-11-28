import { cn } from "../../lib/utils";

export function Card({ className, children, ...props }) {
    return (
        <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 p-6", className)} {...props}>
            {children}
        </div>
    );
}
