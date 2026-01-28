import { X, Activity, ArrowDown, Gauge, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NetworkNode, NetworkPipe } from "@/data/sampleNetwork";
import { TimeStepResult, getNodeTimeSeries, getPipeTimeSeries } from "@/lib/simulationEngine";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PropertyInspectorProps {
  selectedNode: NetworkNode | null;
  selectedPipe: NetworkPipe | null;
  simulationResults: TimeStepResult[];
  currentStep: number;
  onClose: () => void;
  pipes: NetworkPipe[];
}

const PropertyInspector = ({
  selectedNode,
  selectedPipe,
  simulationResults,
  currentStep,
  onClose,
  pipes
}: PropertyInspectorProps) => {
  if (!selectedNode && !selectedPipe) return null;

  const currentResult = simulationResults[currentStep];

  if (selectedNode) {
    const nodeResult = currentResult?.nodes[selectedNode.id];
    const timeSeries = simulationResults.length > 0 
      ? getNodeTimeSeries(simulationResults, selectedNode.id)
      : [];

    // Find connected pipes
    const connectedPipes = pipes.filter(
      p => p.fromNode === selectedNode.id || p.toNode === selectedNode.id
    );

    return (
      <Card className="w-80 shadow-lg border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <CardTitle className="text-lg">{selectedNode.label}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant="secondary" className="w-fit">
            {selectedNode.type === 'manhole' ? 'Manhole' : 
             selectedNode.type === 'wetwell' ? 'Wet Well' : 'Outfall'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Static Properties */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Properties</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rim Elev:</span>
                <span className="font-medium">{selectedNode.rimElevation} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invert:</span>
                <span className="font-medium">{selectedNode.invertElevation} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Depth:</span>
                <span className="font-medium">{selectedNode.maxDepth} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connections:</span>
                <span className="font-medium">{connectedPipes.length}</span>
              </div>
            </div>
          </div>

          {/* Simulation Results */}
          {nodeResult && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Current Results
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depth:</span>
                    <span className="font-medium">{nodeResult.depth} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HGL:</span>
                    <span className="font-medium">{nodeResult.hgl} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inflow:</span>
                    <span className="font-medium">{nodeResult.inflow} MGD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge 
                      variant={nodeResult.isSurcharged ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {nodeResult.isSurcharged ? "Surcharged" : "Normal"}
                    </Badge>
                  </div>
                </div>
                {nodeResult.flooding > 0 && (
                  <div className="bg-destructive/10 text-destructive p-2 rounded text-sm">
                    ⚠️ Flooding: {nodeResult.flooding} MGD
                  </div>
                )}
              </div>
            </>
          )}

          {/* Time Series Graph */}
          {timeSeries.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Depth Over Time</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 10 }}
                        label={{ value: 'min', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        label={{ value: 'ft', angle: -90, position: 'insideLeft', fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} ft`, 'Depth']}
                        labelFormatter={(label) => `Time: ${label} min`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="depth" 
                        stroke="#0066CC" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (selectedPipe) {
    const pipeResult = currentResult?.pipes[selectedPipe.id];
    const timeSeries = simulationResults.length > 0 
      ? getPipeTimeSeries(simulationResults, selectedPipe.id)
      : [];

    return (
      <Card className="w-80 shadow-lg border-l-4 border-l-accent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-accent rounded" />
              <CardTitle className="text-lg">{selectedPipe.id}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Badge variant="outline" className="w-fit">Conduit</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Static Properties */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Properties</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium">{selectedPipe.fromNode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium">{selectedPipe.toNode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diameter:</span>
                <span className="font-medium">{selectedPipe.diameter}"</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Length:</span>
                <span className="font-medium">{selectedPipe.length} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slope:</span>
                <span className="font-medium">{selectedPipe.slope}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manning's n:</span>
                <span className="font-medium">{selectedPipe.roughness}</span>
              </div>
            </div>
          </div>

          {/* Simulation Results */}
          {pipeResult && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Current Results
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flow:</span>
                    <span className="font-medium">{pipeResult.flow} MGD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Velocity:</span>
                    <span className="font-medium">{pipeResult.velocity} ft/s</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Capacity:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            pipeResult.capacity > 90 ? 'bg-destructive' :
                            pipeResult.capacity > 75 ? 'bg-warning' :
                            pipeResult.capacity > 50 ? 'bg-primary' : 'bg-success'
                          }`}
                          style={{ width: `${pipeResult.capacity}%` }}
                        />
                      </div>
                      <span className="font-medium">{pipeResult.capacity}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge 
                      variant={pipeResult.isSurcharged ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {pipeResult.isSurcharged ? "Surcharged" : "Normal"}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Time Series Graph */}
          {timeSeries.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Flow & Velocity</h4>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="flow" 
                        stroke="#0066CC" 
                        strokeWidth={2}
                        dot={false}
                        name="Flow (MGD)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="velocity" 
                        stroke="#0099CC" 
                        strokeWidth={2}
                        dot={false}
                        name="Velocity (ft/s)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default PropertyInspector;
