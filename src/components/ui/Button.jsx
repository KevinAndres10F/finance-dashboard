import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", size = "md", ...props }) {
    const variants = {
        primary: [
            "bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900",
            "hover:bg-slate-800 dark:hover:bg-white",
            "shadow-sm hover:shadow-md",
        ].join(" "),
        secondary: [
            "glass text-slate-900 dark:text-white",
            "hover:shadow-md",
        ].join(" "),
        danger: "bg-rose-500/90 text-white hover:bg-rose-600 shadow-sm",
        ghost: "bg-transparent hover:bg-white/50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300",
        outline: [
            "glass text-slate-700 dark:text-slate-200",
            "hover:shadow-md",
        ].join(" "),
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-xl font-medium",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/60 focus:ring-offset-2 dark:focus:ring-offset-slate-900",
                "disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
}
