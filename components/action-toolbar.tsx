import { cn } from "@/lib/utils";

interface ActionToolbarProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
}

export function ActionToolbar({ left, right, children }: ActionToolbarProps) {
  if (children && !left && !right) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card border rounded-lg">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-card border rounded-lg">
      {left && <div className="flex items-center gap-2">{left}</div>}
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
