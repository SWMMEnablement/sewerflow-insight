import { Play, Square, Settings, Clock, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SimulationPanelProps {
  isSimulating: boolean;
  setIsSimulating: (value: boolean) => void;
}

const SimulationPanel = ({ isSimulating, setIsSimulating }: SimulationPanelProps) => {
  const { toast } = useToast();

  const handleSimulation = () => {
    if (!isSimulating) {
      setIsSimulating(true);
      toast({
        title: "Simulation Started",
        description: "EPS analysis is now running...",
      });
      // Simulate completion after 5 seconds
      setTimeout(() => {
        setIsSimulating(false);
        toast({
          title: "Simulation Complete",
          description: "Analysis finished successfully.",
        });
      }, 5000);
    } else {
      setIsSimulating(false);
      toast({
        title: "Simulation Stopped",
        description: "Analysis has been terminated.",
        variant: "destructive",
      });
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
                <SelectItem value="quality">Water Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duration (hours)</Label>
            <Slider defaultValue={[24]} max={168} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1h</span>
              <span>168h</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Time Step (minutes)</Label>
            <Select defaultValue="5">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 min</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
          <CardTitle className="text-lg">Network Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Manholes</span>
            <Badge variant="secondary">142</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pipes</span>
            <Badge variant="secondary">189</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pumps</span>
            <Badge variant="secondary">8</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Wet Wells</span>
            <Badge variant="secondary">4</Badge>
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
            <span className="text-sm font-medium">15 min</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Flow Units</span>
            </div>
            <span className="text-sm font-medium">MGD</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimulationPanel;
