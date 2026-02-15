"use client";

import { ReactNode } from "react";
import { ToolHeader } from "@/components/tool-header";

interface ToolLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  sidebar?: ReactNode;
  maxWidth?: "5xl" | "7xl" | "full";
}

export function ToolLayout({ title, description, children, sidebar, maxWidth = "7xl" }: ToolLayoutProps) {
  const maxWidthClass = maxWidth === "full" ? "max-w-full" : maxWidth === "7xl" ? "max-w-7xl" : "max-w-5xl";
  
  return (
    <div>
      <ToolHeader title={title} description={description} />
      <div className={`mx-auto ${maxWidthClass} px-4 pb-8 lg:px-8`}>
        <div className={`grid gap-6 ${sidebar ? 'lg:grid-cols-3' : ''}`}>
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
