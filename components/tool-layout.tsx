import { ReactNode } from "react";
import { ToolHeader } from "@/components/tool-header";

interface ToolLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  sidebar?: ReactNode;
}

export function ToolLayout({ title, description, children, sidebar }: ToolLayoutProps) {
  return (
    <div>
      <ToolHeader title={title} description={description} />
      <div className="px-4 pb-6 lg:px-8">
        <div className={`grid gap-4 ${sidebar ? 'lg:grid-cols-3' : ''}`}>
          <div className={sidebar ? 'lg:col-span-2' : ''}>
            {children}
          </div>
          {sidebar && (
            <div className="lg:col-span-1">
              {sidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
