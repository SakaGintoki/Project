import * as React from "react"
import { cn } from "../../lib/utils"

function Badge({ className, variant = "default", ...props }) {
  const baseStyles = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em] transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 shadow-sm"
  
  const variants = {
    default: "border-transparent bg-white/90 text-brand backdrop-blur-sm",
    ended: "border-transparent bg-slate-50 text-slate-600",
    category: "border-transparent bg-white/20 text-white backdrop-blur-sm",
    hero: "border-transparent bg-brand-light text-brand",
    outline: "text-slate-900 border-slate-200",
    destructive: "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
  }

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  )
}

export { Badge }
