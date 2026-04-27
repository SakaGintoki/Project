import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-12 w-full appearance-none rounded-md border border-slate-300 bg-white px-4 py-3 pr-10 text-base shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand-light disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
    </div>
  )
})
Select.displayName = "Select"

export { Select }
