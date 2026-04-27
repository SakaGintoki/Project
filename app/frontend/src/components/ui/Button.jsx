import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "primary", size = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
  
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-hover hover:-translate-y-0.5",
    secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-md",
    ghost: "bg-transparent text-slate-500 hover:text-slate-900",
    outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md",
  }

  const sizes = {
    default: "h-12 px-6 py-3",
    sm: "h-9 px-4 text-sm",
    lg: "h-14 px-8 text-lg",
    icon: "h-10 w-10",
  }

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
