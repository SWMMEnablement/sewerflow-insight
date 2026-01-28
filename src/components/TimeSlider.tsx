import { Play, Pause, SkipBack, SkipForward, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useRef, useCallback } from "react";

interface TimeSliderProps {
  totalSteps: number;
  currentStep: number;
  onStepChange: (step: number) => void;
  getTimeAtStep: (step: number) => number;
  disabled?: boolean;
}

const TimeSlider = ({
  totalSteps,
  currentStep,
  onStepChange,
  getTimeAtStep,
  disabled = false,
}: TimeSliderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playIntervalRef = useRef<number | null>(null);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  };

  const handlePlay = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      onStepChange(0);
    }
    setIsPlaying(true);
  }, [currentStep, totalSteps, onStepChange]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleStepBack = useCallback(() => {
    onStepChange(Math.max(0, currentStep - 1));
  }, [currentStep, onStepChange]);

  const handleStepForward = useCallback(() => {
    onStepChange(Math.min(totalSteps - 1, currentStep + 1));
  }, [currentStep, totalSteps, onStepChange]);

  const handleSliderChange = useCallback(
    (value: number[]) => {
      onStepChange(value[0]);
    },
    [onStepChange]
  );

  const cyclePlaybackSpeed = useCallback(() => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 4;
      return 1;
    });
  }, []);

  // Playback effect
  useEffect(() => {
    if (isPlaying && !disabled) {
      const interval = 200 / playbackSpeed;
      playIntervalRef.current = window.setInterval(() => {
        onStepChange(currentStep + 1);
      }, interval);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentStep, playbackSpeed, disabled, onStepChange]);

  // Stop at end
  useEffect(() => {
    if (currentStep >= totalSteps - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentStep, totalSteps, isPlaying]);

  // Stop playback when disabled
  useEffect(() => {
    if (disabled) {
      setIsPlaying(false);
    }
  }, [disabled]);

  if (totalSteps <= 1) {
    return null;
  }

  const currentTime = getTimeAtStep(currentStep);
  const totalTime = getTimeAtStep(totalSteps - 1);
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Card className="p-4 shadow-soft bg-card/95 backdrop-blur-sm">
      <div className="space-y-3">
        {/* Time display */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">
              {formatTime(currentTime)}
            </span>
            <span className="text-muted-foreground">/ {formatTime(totalTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <div className="h-3 w-px bg-border" />
            <span className="text-xs font-medium text-primary">
              {progress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Slider */}
        <Slider
          value={[currentStep]}
          min={0}
          max={totalSteps - 1}
          step={1}
          onValueChange={handleSliderChange}
          disabled={disabled}
          className="cursor-pointer"
        />

        {/* Playback controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleStepBack}
              disabled={disabled || currentStep === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              className="h-8 w-8"
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={disabled}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleStepForward}
              disabled={disabled || currentStep >= totalSteps - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={cyclePlaybackSpeed}
            disabled={disabled}
          >
            {playbackSpeed}x Speed
          </Button>

          <div className="flex gap-1">
            {[0, Math.floor(totalSteps / 4), Math.floor(totalSteps / 2), Math.floor((3 * totalSteps) / 4), totalSteps - 1].map(
              (step) => (
                <Button
                  key={step}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => onStepChange(step)}
                  disabled={disabled}
                >
                  {formatTime(getTimeAtStep(step))}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TimeSlider;
