"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolLayout } from "@/components/tool-layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, RotateCcw, Clock, Bell, BellOff, Volume2, VolumeX, Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Lap {
  id: number;
  time: number;
  lapTime: number;
}

export default function TimerPage() {
  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");
  
  // Timer state
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [lapCounter, setLapCounter] = useState(0);
  
  // Alarm state
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAlarming, setIsAlarming] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalTitleRef = useRef<string>("");
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const titleUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      originalTitleRef.current = document.title;
      
      // Create audio element for alarm sound only if supported
      try {
        audioRef.current = new Audio();
        audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGe77OeeSwwPUKXi8LdjHAU2kdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdmue3mnEoMDU+j4fC4ZBwFM4/T8tGAMQUecMLu45ZFCw9YrujusVsVB0CY3PLEcSYEKn/M8tyJNQcVZLjr6aJODA1NouHwuWUcBTGO0vLTgjMGHG/A7eSXRgsOVqzn77RdFgY9ltvyxnMoBCh+y/LciTQHE2K26+mjTwwMS6Df8LxnHgUujdDy1oU1Bxpr";
        audioRef.current.loop = true;
      } catch (error) {
        console.warn("Audio not supported:", error);
      }
    }
    
    return () => {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
      if (titleUpdateIntervalRef.current) {
        clearInterval(titleUpdateIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== "undefined") {
        document.title = originalTitleRef.current;
      }
    };
  }, []);

  // Update title with timer countdown
  useEffect(() => {
    if (mode === "timer" && isRunning && timeLeft > 0 && !isAlarming) {
      const updateTitle = () => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        document.title = `⏱️ ${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")} - Timer`;
      };
      
      updateTitle();
      titleUpdateIntervalRef.current = setInterval(updateTitle, 3000);
      
      return () => {
        if (titleUpdateIntervalRef.current) {
          clearInterval(titleUpdateIntervalRef.current);
        }
        document.title = originalTitleRef.current;
      };
    } else if (mode === "stopwatch" && stopwatchRunning) {
      const updateTitle = () => {
        const mins = Math.floor(stopwatchTime / 60000);
        const secs = Math.floor((stopwatchTime % 60000) / 1000);
        document.title = `⏱️ ${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")} - Stopwatch`;
      };
      
      updateTitle();
      titleUpdateIntervalRef.current = setInterval(updateTitle, 3000);
      
      return () => {
        if (titleUpdateIntervalRef.current) {
          clearInterval(titleUpdateIntervalRef.current);
        }
        document.title = originalTitleRef.current;
      };
    } else if (!isAlarming) {
      document.title = originalTitleRef.current;
    }
  }, [mode, isRunning, timeLeft, stopwatchRunning, stopwatchTime, isAlarming]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0 || mode !== "timer") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          triggerAlarm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeLeft, mode]);

  // Stopwatch
  useEffect(() => {
    if (!stopwatchRunning || mode !== "stopwatch") return;

    const interval = setInterval(() => {
      setStopwatchTime((prev) => prev + 10);
    }, 10);

    return () => clearInterval(interval);
  }, [stopwatchRunning, mode]);

  const triggerAlarm = () => {
    if (!alarmEnabled) return;
    
    setIsAlarming(true);
    
    // Safely check for Notification API
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "granted") {
          new Notification("⏰ Timer Complete!", {
            body: "Your timer has finished!",
            icon: "/favicon.ico",
            tag: "timer-alarm",
            requireInteraction: true
          });
        }
      } catch (error) {
        console.warn("Notification failed:", error);
      }
    }
    
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
    }
    
    let showAlert = true;
    titleIntervalRef.current = setInterval(() => {
      if (typeof window !== "undefined") {
        document.title = showAlert ? "⏰ TIME'S UP! ⏰" : originalTitleRef.current;
        showAlert = !showAlert;
      }
    }, 1000);
    
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.warn("Audio playback failed:", error);
      });
    }
  };

  const stopAlarm = () => {
    setIsAlarming(false);
    
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }
    
    if (titleUpdateIntervalRef.current) {
      clearInterval(titleUpdateIntervalRef.current);
      titleUpdateIntervalRef.current = null;
    }
    
    document.title = originalTitleRef.current;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const setPresetTimer = (mins: number) => {
    setMinutes(mins);
    setSeconds(0);
    setTimeLeft(0);
    setIsRunning(false);
    stopAlarm();
  };

  const startTimer = () => {
    if (timeLeft === 0) {
      const total = minutes * 60 + seconds;
      setTimeLeft(total);
      setTotalTime(total);
    }
    setIsRunning(true);
    
    // Request notification permission safely
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (Notification.permission === "default") {
          Notification.requestPermission().catch((error) => {
            console.warn("Notification permission request failed:", error);
          });
        }
      } catch (error) {
        console.warn("Notification API not supported:", error);
      }
    }
  };

  const pauseTimer = () => setIsRunning(false);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setTotalTime(0);
    stopAlarm();
    
    if (titleUpdateIntervalRef.current) {
      clearInterval(titleUpdateIntervalRef.current);
      titleUpdateIntervalRef.current = null;
    }
    document.title = originalTitleRef.current;
  };

  const startStopwatch = () => setStopwatchRunning(true);
  const pauseStopwatch = () => setStopwatchRunning(false);
  
  const resetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
    setLapCounter(0);
    
    if (titleUpdateIntervalRef.current) {
      clearInterval(titleUpdateIntervalRef.current);
      titleUpdateIntervalRef.current = null;
    }
    document.title = originalTitleRef.current;
  };

  const addLap = () => {
    const prevLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
    const lapTime = stopwatchTime - prevLapTime;
    
    setLaps([...laps, {
      id: lapCounter + 1,
      time: stopwatchTime,
      lapTime: lapTime
    }]);
    setLapCounter(lapCounter + 1);
  };

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis.toString().padStart(2, "0")}`;
  };

  const displayMinutes = Math.floor(timeLeft / 60);
  const displaySeconds = timeLeft % 60;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const stopwatchMinutes = Math.floor(stopwatchTime / 60000);
  const stopwatchSeconds = Math.floor((stopwatchTime % 60000) / 1000);
  const stopwatchMillis = Math.floor((stopwatchTime % 1000) / 10);

  return (
    <ToolLayout
      title="Timer & Stopwatch"
      description="Countdown timer with presets and stopwatch with lap times"
    >
      <div className="space-y-3">
        {/* Mode Selector */}
        <div className="p-3 bg-card border rounded-lg">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timer" className="text-xs">
                <Clock className="h-3 w-3 mr-2" />
                Timer
              </TabsTrigger>
              <TabsTrigger value="stopwatch" className="text-xs">
                <Clock className="h-3 w-3 mr-2" />
                Stopwatch
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Timer Mode */}
        {mode === "timer" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Left: Timer Display */}
            <div className="space-y-3">
              {isAlarming && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <div className="text-center space-y-3">
                    <div className="text-4xl animate-bounce">⏰</div>
                    <div className="text-xl font-bold">TIME&apos;S UP!</div>
                    <Button onClick={stopAlarm} size="sm" variant="destructive" className="w-full">
                      <BellOff className="h-3 w-3 mr-2" />
                      Stop Alarm
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-3 bg-card border rounded-lg space-y-4">
                {timeLeft === 0 && !isRunning ? (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Set Timer Duration</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Minutes</Label>
                        <Input
                          type="number"
                          value={minutes}
                          onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                          min="0"
                          max="999"
                          className="text-center text-xl font-mono h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Seconds</Label>
                        <Input
                          type="number"
                          value={seconds}
                          onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                          min="0"
                          max="59"
                          className="text-center text-xl font-mono h-12"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center py-6">
                      <div className="text-7xl font-bold font-mono tabular-nums">
                        {displayMinutes.toString().padStart(2, "0")}:{displaySeconds.toString().padStart(2, "0")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-3">
                        {Math.floor(timeLeft / 60)}m {timeLeft % 60}s remaining
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2">
                  {!isRunning ? (
                    <Button onClick={startTimer} className="flex-1" size="sm" disabled={minutes === 0 && seconds === 0}>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button onClick={pauseTimer} variant="secondary" className="flex-1" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={resetTimer} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Presets & Settings */}
            <div className="space-y-3">
              {/* Quick Presets */}
              <div className="p-3 bg-card border rounded-lg space-y-3">
                <Label className="text-sm font-medium">Quick Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 10, 15, 20, 25, 30, 45, 60].map((mins) => (
                    <Button
                      key={mins}
                      variant="outline"
                      size="sm"
                      onClick={() => setPresetTimer(mins)}
                      className="text-xs"
                      disabled={isRunning}
                    >
                      {mins}m
                    </Button>
                  ))}
                </div>
              </div>

              {/* Alarm Settings */}
              <div className="p-3 bg-card border rounded-lg space-y-3">
                <Label className="text-sm font-medium">Alarm Settings</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Bell className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">Notifications</span>
                    </div>
                    <Button
                      variant={alarmEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAlarmEnabled(!alarmEnabled)}
                      className="h-7 w-7 p-0"
                    >
                      {alarmEnabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">Sound</span>
                    </div>
                    <Button
                      variant={soundEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="h-7 w-7 p-0"
                    >
                      {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stopwatch Mode */}
        {mode === "stopwatch" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Left: Stopwatch Display */}
            <div className="p-3 bg-card border rounded-lg space-y-4">
              <div className="text-center py-6">
                <div className="text-7xl font-bold font-mono tabular-nums">
                  {stopwatchMinutes.toString().padStart(2, "0")}:{stopwatchSeconds.toString().padStart(2, "0")}
                </div>
                <div className="text-3xl font-mono text-muted-foreground mt-2">
                  .{stopwatchMillis.toString().padStart(2, "0")}
                </div>
                {laps.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="text-xs">
                      {laps.length} {laps.length === 1 ? 'Lap' : 'Laps'}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!stopwatchRunning ? (
                  <Button onClick={startStopwatch} className="flex-1" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <>
                    <Button onClick={pauseStopwatch} variant="secondary" className="flex-1" size="sm">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                    <Button onClick={addLap} variant="outline" size="sm">
                      <Flag className="h-4 w-4 mr-2" />
                      Lap
                    </Button>
                  </>
                )}
                <Button onClick={resetStopwatch} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right: Lap Times */}
            <div className="p-3 bg-card border rounded-lg space-y-3">
              <Label className="text-sm font-medium">Lap Times</Label>
              {laps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No laps recorded yet</p>
                  <p className="text-xs mt-1">Click &quot;Lap&quot; while running</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-3">
                  <div className="space-y-2">
                    {[...laps].reverse().map((lap, index) => (
                      <div
                        key={lap.id}
                        className="flex items-center justify-between p-2 border rounded text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{laps.length - index}
                          </Badge>
                          <span className="font-mono">{formatTime(lap.lapTime)}</span>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {formatTime(lap.time)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
