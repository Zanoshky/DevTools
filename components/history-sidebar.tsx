"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ToolCard } from "@/components/tool-card";

interface HistorySidebarProps<T = string> {
  items: T[];
  onSelect: (item: T) => void;
  onClear: () => void;
  renderItem?: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}

export function HistorySidebar<T = string>({
  items,
  onSelect,
  onClear,
  renderItem,
  emptyMessage = "No history yet",
}: HistorySidebarProps<T>) {
  return (
    <ToolCard>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm" id="history-heading">History</h2>
        {items.length > 0 && (
          <Button
            onClick={onClear}
            variant="ghost"
            size="sm"
            aria-label="Clear history"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2" aria-labelledby="history-heading" role="list">
          {items.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => onSelect(item)}
                className="w-full text-left p-2 rounded-lg hover:bg-secondary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Select history item ${index + 1}`}
              >
                {renderItem ? (
                  renderItem(item, index)
                ) : (
                  <div className="font-mono text-xs truncate">{String(item)}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
      )}
    </ToolCard>
  );
}
