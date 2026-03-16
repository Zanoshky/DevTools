import { Badge } from "@/components/ui/badge";

interface StatsBarProps {
  inputLength: number;
  outputLength?: number;
  ratio?: string | null;
  visible: boolean;
}

export function StatsBar({ inputLength, outputLength, ratio, visible }: StatsBarProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-primary/5 to-primary/5 border rounded-lg">
      <Badge variant="secondary" className="text-xs">
        Input: {inputLength} chars
      </Badge>
      {outputLength != null && outputLength > 0 && (
        <>
          <span className="text-muted-foreground">{"->"}</span>
          <Badge variant="secondary" className="text-xs">
            Output: {outputLength} chars
          </Badge>
          {ratio && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {ratio}
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
