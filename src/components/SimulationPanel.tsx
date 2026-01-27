import { Play, Square, Settings, Clock, Droplets, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { networkMetadata } from "@/data/sampleNetwork";

interface SimulationPanelProps {
  isSimulating: boolean;
  simulationProgress: number;
  currentTime: number;
  duration: number;
  setDuration: (value: number) => void;
  stormMultiplier: number;
  setStormMultiplier: (value: number) => void;
  onRunSimulation: () => void;
  onStopSimulation: () => void;
}

const SimulationPanel = ({ 
  isSimulating, 
  simulationProgress,
  currentTime,
  duration,
  setDuration,
  stormMultiplier,
  setStormMultiplier,
  onRunSimulation,
  onStopSimulation
}: SimulationPanelProps) => {

  const handleSimulation = () => {
    if (isSimulating) {
      onStopSimulation();
    } else {
      onRunSimulation();
    }
  };

  return (
    <div className="space-y-4">
      {/* Run Control */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="h-5 w-5 text-primary" />
            Simulation Control
          </CardTitle>
          <CardDescription>Configure and run hydraulic analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Analysis Type</Label>
            <Select defaultValue="dynamic">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dynamic">Dynamic EPS</SelectItem>
                <SelectItem value="static">Static Analysis</SelectItem>
                <SelectItem value="design">Design Run</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Duration</Label>
              <span className="text-sm text-muted-foreground">{duration} hours</span>
            </div>
            <Slider 
              value={[duration]} 
              onValueChange={(v) => setDuration(v[0])}
              max={6} 
              min={1}
              step={1} 
              disabled={isSimulating}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1h</span>
              <span>6h</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Storm Intensity</Label>
              <span className="text-sm text-muted-foreground">{stormMultiplier.toFixed(1)}x</span>
            </div>
            <Slider 
              value={[stormMultiplier]} 
              onValueChange={(v) => setStormMultiplier(v[0])}
              max={3} 
              min={0.5}
              step={0.1} 
              disabled={isSimulating}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low (0.5x)</span>
              <span>Extreme (3x)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Time Step</Label>
            <Select defaultValue="5" disabled={isSimulating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 min</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress during simulation */}
          {isSimulating && (
            <div className="space-y-2 p-3 bg-primary/5 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Running...</span>
                <span>{Math.round(simulationProgress)}%</span>
              </div>
              <Progress value={simulationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Time: {currentTime} min
              </p>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={handleSimulation}
            variant={isSimulating ? "destructive" : "default"}
          >
            {isSimulating ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Network Statistics */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-accent" />
            Network Overview
          </CardTitle>
          <CardDescription>{networkMetadata.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Manholes</span>
            <Badge variant="secondary">{networkMetadata.nodeCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pipes</span>
            <Badge variant="secondary">{networkMetadata.pipeCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pumps</span>
            <Badge variant="secondary">{networkMetadata.pumpCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Length</span>
            <Badge variant="secondary">{networkMetadata.totalLength.toLocaleString()} ft</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Settings */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-accent" />
            Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Report Time Step</span>
            </div>
            <span className="text-sm font-medium">5 min</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Flow Units</span>
            </div>
            <span className="text-sm font-medium">{networkMetadata.flowUnits}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulationPanel;
