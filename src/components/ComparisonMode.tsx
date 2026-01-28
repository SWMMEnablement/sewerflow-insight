import { useState, useCallback } from "react";
import { Play, X, ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { runSimulation, getResultsSummary, TimeStepResult } from "@/lib/simulationEngine";

interface ScenarioConfig {
  name: string;
  stormMultiplier: number;
  duration: number;
}

interface ScenarioResult {
  config: ScenarioConfig;
  results: TimeStepResult[];
  summary: ReturnType<typeof getResultsSummary>;
}

interface ComparisonModeProps {
  onClose: () => void;
}

const ComparisonMode = ({ onClose }: ComparisonModeProps) => {
  const [scenarioA, setScenarioA] = useState<ScenarioConfig>({
    name: "Scenario A",
    stormMultiplier: 1.0,
    duration: 2,
  });
  const [scenarioB, setScenarioB] = useState<ScenarioConfig>({
    name: "Scenario B",
    stormMultiplier: 2.0,
    duration: 2,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultsA, setResultsA] = useState<ScenarioResult | null>(null);
  const [resultsB, setResultsB] = useState<ScenarioResult | null>(null);

  const runComparison = useCallback(() => {
    setIsRunning(true);
    setProgress(0);
    setResultsA(null);
    setResultsB(null);

    // Run Scenario A
    setTimeout(() => {
      const resultsDataA = runSimulation({
        duration: scenarioA.duration,
        timeStep: 5,
        stormMultiplier: scenarioA.stormMultiplier,
      });
      setResultsA({
        config: scenarioA,
        results: resultsDataA,
        summary: getResultsSummary(resultsDataA),
      });
      setProgress(50);

      // Run Scenario B
      setTimeout(() => {
        const resultsDataB = runSimulation({
          duration: scenarioB.duration,
          timeStep: 5,
          stormMultiplier: scenarioB.stormMultiplier,
        });
        setResultsB({
          config: scenarioB,
          results: resultsDataB,
          summary: getResultsSummary(resultsDataB),
        });
        setProgress(100);
        setIsRunning(false);
      }, 500);
    }, 500);
  }, [scenarioA, scenarioB]);

  const getDelta = (a: number, b: number) => {
    if (a === 0) return b > 0 ? 100 : 0;
    return ((b - a) / a) * 100;
  };

  const DeltaIndicator = ({ delta }: { delta: number }) => {
    if (Math.abs(delta) < 1) {
      return (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <Minus className="h-3 w-3" />
          No change
        </span>
      );
    }
    if (delta > 0) {
      return (
        <span className="flex items-center gap-1 text-destructive text-xs">
          <TrendingUp className="h-3 w-3" />
          +{delta.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-success text-xs">
        <TrendingDown className="h-3 w-3" />
        {delta.toFixed(1)}%
      </span>
    );
  };

  return (
    <Card className="fixed inset-4 z-50 flex flex-col overflow-hidden shadow-medium bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Scenario Comparison Mode</h2>
          <Badge variant="secondary">Beta</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="grid grid-cols-2 gap-6 h-full">
          {/* Scenario A Configuration */}
          <div className="space-y-4">
            <Card className="p-4 border-primary/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <h3 className="font-semibold">Scenario A (Baseline)</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Storm Intensity: {scenarioA.stormMultiplier.toFixed(1)}x
                  </Label>
                  <Slider
                    value={[scenarioA.stormMultiplier]}
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    onValueChange={([v]) =>
                      setScenarioA((s) => ({ ...s, stormMultiplier: v }))
                    }
                    disabled={isRunning}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Duration: {scenarioA.duration}h
                  </Label>
                  <Slider
                    value={[scenarioA.duration]}
                    min={1}
                    max={6}
                    step={0.5}
                    onValueChange={([v]) =>
                      setScenarioA((s) => ({ ...s, duration: v }))
                    }
                    disabled={isRunning}
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Scenario A Results */}
            {resultsA && (
              <ScrollArea className="h-[300px]">
                <Card className="p-4 space-y-3">
                  <h4 className="font-medium text-sm">Results Summary</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Peak Flow</div>
                      <div className="text-lg font-semibold">{resultsA.summary.peakFlow.toFixed(2)} MGD</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Max Velocity</div>
                      <div className="text-lg font-semibold">{resultsA.summary.maxVelocity.toFixed(2)} ft/s</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Surcharged Pipes</div>
                      <div className="text-lg font-semibold">{resultsA.summary.surchargeCount}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Flooded Nodes</div>
                      <div className="text-lg font-semibold">{resultsA.summary.floodedNodes.length}</div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Badge variant={resultsA.summary.systemStatus === 'Critical' ? 'destructive' : resultsA.summary.systemStatus === 'Warning' ? 'secondary' : 'default'}>
                      {resultsA.summary.systemStatus}
                    </Badge>
                  </div>
                </Card>
              </ScrollArea>
            )}
          </div>

          {/* Scenario B Configuration */}
          <div className="space-y-4">
            <Card className="p-4 border-accent/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-accent" />
                <h3 className="font-semibold">Scenario B (Alternative)</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Storm Intensity: {scenarioB.stormMultiplier.toFixed(1)}x
                  </Label>
                  <Slider
                    value={[scenarioB.stormMultiplier]}
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    onValueChange={([v]) =>
                      setScenarioB((s) => ({ ...s, stormMultiplier: v }))
                    }
                    disabled={isRunning}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Duration: {scenarioB.duration}h
                  </Label>
                  <Slider
                    value={[scenarioB.duration]}
                    min={1}
                    max={6}
                    step={0.5}
                    onValueChange={([v]) =>
                      setScenarioB((s) => ({ ...s, duration: v }))
                    }
                    disabled={isRunning}
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Scenario B Results */}
            {resultsB && (
              <ScrollArea className="h-[300px]">
                <Card className="p-4 space-y-3">
                  <h4 className="font-medium text-sm">Results Summary</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Peak Flow</div>
                      <div className="text-lg font-semibold">{resultsB.summary.peakFlow.toFixed(2)} MGD</div>
                      {resultsA && <DeltaIndicator delta={getDelta(resultsA.summary.peakFlow, resultsB.summary.peakFlow)} />}
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Max Velocity</div>
                      <div className="text-lg font-semibold">{resultsB.summary.maxVelocity.toFixed(2)} ft/s</div>
                      {resultsA && <DeltaIndicator delta={getDelta(resultsA.summary.maxVelocity, resultsB.summary.maxVelocity)} />}
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Surcharged Pipes</div>
                      <div className="text-lg font-semibold">{resultsB.summary.surchargeCount}</div>
                      {resultsA && <DeltaIndicator delta={getDelta(resultsA.summary.surchargeCount, resultsB.summary.surchargeCount)} />}
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Flooded Nodes</div>
                      <div className="text-lg font-semibold">{resultsB.summary.floodedNodes.length}</div>
                      {resultsA && <DeltaIndicator delta={getDelta(resultsA.summary.floodedNodes.length, resultsB.summary.floodedNodes.length)} />}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Badge variant={resultsB.summary.systemStatus === 'Critical' ? 'destructive' : resultsB.summary.systemStatus === 'Warning' ? 'secondary' : 'default'}>
                      {resultsB.summary.systemStatus}
                    </Badge>
                  </div>
                </Card>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          {isRunning ? (
            <div className="flex-1 mr-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Running comparison...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {resultsA && resultsB
                ? "Comparison complete. Review the results above."
                : "Configure both scenarios and click Run to compare."}
            </div>
          )}
          <Button onClick={runComparison} disabled={isRunning} className="gap-2">
            <Play className="h-4 w-4" />
            Run Comparison
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ComparisonMode;
