"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-primary text-white hover:bg-primary/90 active:bg-primary/80": variant === "default",
            "border border-primary text-primary hover:bg-primary/10": variant === "outline",
            "hover:bg-gray-100 text-gray-700": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
            "bg-gray-100 text-gray-700 hover:bg-gray-200": variant === "secondary",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-11 px-4 text-sm": size === "md",
            "h-13 px-6 text-base w-full": size === "lg",
            "h-11 w-11 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
