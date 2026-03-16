interface ToolHeaderProps {
  title: string;
  description?: string;
}

export function ToolHeader({ title, description }: ToolHeaderProps) {
  return (
    <div className="px-4 pt-4 pb-2 lg:px-8 lg:pt-6 lg:pb-3">
      <h1 className="text-xl font-semibold tracking-tight lg:text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed lg:text-sm">
          {description}
        </p>
      )}
    </div>
  );
}
