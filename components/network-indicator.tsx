
import { useEffect, useRef } from "react";
import { useNetworkMonitor } from "@/hooks/use-network-monitor";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";

function playPingAlarm() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.setValueAtTime(900, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);

  osc.onended = () => ctx.close();
}

export function NetworkIndicator() {
  const { networkCalls, isMonitoring, isClean } = useNetworkMonitor();
  const wasCleanRef = useRef(true);

  useEffect(() => {
    if (wasCleanRef.current && !isClean) {
      playPingAlarm();
      toast({
        title: "External Network Request Detected",
        description: `${networkCalls.length} external request${networkCalls.length === 1 ? "" : "s"} detected. Your data may be leaving this device.`,
        variant: "destructive",
      });
    }
    wasCleanRef.current = isClean;
  }, [isClean, networkCalls.length]);

  if (!isMonitoring) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative flex h-8 w-8 items-center justify-center"
            role="status"
            aria-label={
              isClean
                ? "Network monitor: no external requests"
                : `Network monitor: ${networkCalls.length} external request${networkCalls.length === 1 ? "" : "s"} detected`
            }
          >
            {/* Pulsing ring */}
            <span
              className={`absolute h-3 w-3 rounded-full opacity-40 ${
                isClean
                  ? "bg-green-500 animate-[pulse_3s_ease-in-out_infinite]"
                  : "bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite]"
              }`}
              aria-hidden="true"
            />
            {/* Solid dot */}
            <span
              className={`relative h-2 w-2 rounded-full ${
                isClean ? "bg-green-500" : "bg-red-500"
              }`}
              aria-hidden="true"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isClean ? (
            <span>No external requests — your data is safe</span>
          ) : (
            <span>
              {networkCalls.length} external request
              {networkCalls.length === 1 ? "" : "s"} detected
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
