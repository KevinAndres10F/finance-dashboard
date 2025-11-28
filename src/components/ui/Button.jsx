import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", ...props }) {
    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-800",
        secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
        danger: "bg-red-500 text-white hover:bg-red-600",
        ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}
