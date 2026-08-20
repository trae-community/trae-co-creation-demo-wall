import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, type = "button", children, ...props }, ref) => {
    const variants = {
      primary: 
        "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(50,240,140,0.5)] hover:shadow-[0_0_30px_rgba(50,240,140,0.7)] border border-transparent font-bold btn-glow",
      secondary: 
        "bg-muted text-foreground border border-border hover:bg-muted/80 backdrop-blur-sm",
      outline: 
        "border border-border text-foreground bg-transparent hover:bg-muted",
      ghost: 
        "hover:bg-muted text-muted-foreground hover:text-foreground",
      link: 
        "text-primary underline-offset-4 hover:underline",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
