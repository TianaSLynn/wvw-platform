import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-primary/10 text-primary border-primary/20",
        secondary:   "bg-secondary text-secondary-foreground border-border",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        success:     "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
        warning:     "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
        gold:        "bg-gold/10 text-gold border-gold/20",
        outline:     "text-foreground border-border",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-0.5",
        lg: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
