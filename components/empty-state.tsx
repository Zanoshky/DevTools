import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  className?: string;
}

export function EmptyState({ icon: Icon, message, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-muted-foreground p-6",
        className
      )}
    >
      <Icon className="h-8 w-8 mb-3 opacity-50" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
