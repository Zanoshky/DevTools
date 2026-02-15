"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ToolHeaderProps {
  title: string;
  description?: string;
}

export function ToolHeader({ title, description }: ToolHeaderProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              href="/"
              className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Tools
            </Link>
          </li>
        </ol>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
