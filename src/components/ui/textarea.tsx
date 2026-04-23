import * as React from 'react'
import { cn } from '@/lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn('w-full min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm', className)}
    {...props}
  />
))
Textarea.displayName = 'Textarea'
