
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ToolCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ToolCard({ title, description, children, className = "" }: ToolCardProps) {
  return (
    <Card className={`rounded-lg border shadow-sm ${className}`}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={title || description ? "" : "p-6"}>
        {children}
      </CardContent>
    </Card>
  );
}
