import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Download, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TimeStepResult, getResultsSummary, getPipeTimeSeries } from "@/lib/simulationEngine";
import { samplePipes } from "@/data/sampleNetwork";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { useState } from "react";

interface ResultsViewProps {
  simulationResults: TimeStepResult[];
  onPipeSelect?: (pipeId: string) => void;
}

const ResultsView = ({ simulationResults, onPipeSelect }: ResultsViewProps) => {
  const [selectedPipeId, setSelectedPipeId] = useState<string | null>(null);
  
  const hasResults = simulationResults.length > 0;
  const summary = hasResults ? getResultsSummary(simulationResults) : null;
  
  // Get the last timestep results for table
  const lastResult = hasResults ? simulationResults[simulationResults.length - 1] : null;

  const summaryStats = summary ? [
    { label: "Peak Flow", value: `${summary.peakFlow.toFixed(2)} MGD`, status: "success", icon: TrendingUp },
    { label: "Max Velocity", value: `${summary.maxVelocity.toFixed(1)} ft/s`, status: summary.maxVelocity > 8 ? "warning" : "success", icon: summary.maxVelocity > 8 ? AlertTriangle : TrendingUp },
    { label: "Surcharged Pipes", value: `${summary.surchargeCount} pipes`, status: summary.surchargeCount > 3 ? "error" : summary.surchargeCount > 0 ? "warning" : "success", icon: summary.surchargeCount > 0 ? AlertTriangle : CheckCircle2 },
    { label: "System Status", value: summary.systemStatus, status: summary.systemStatus === 'Stable' ? "success" : summary.systemStatus === 'Warning' ? "warning" : "error", icon: summary.systemStatus === 'Stable' ? CheckCircle2 : AlertTriangle },
  ] : [
    { label: "Peak Flow", value: "—", status: "default", icon: TrendingUp },
    { label: "Max Velocity", value: "—", status: "default", icon: TrendingUp },
    { label: "Surcharged Pipes", value: "—", status: "default", icon: AlertTriangle },
    { label: "System Status", value: "No Data", status: "default", icon: CheckCircle2 },
  ];

  // Get pipe results sorted by capacity
  const pipeResults = lastResult 
    ? Object.entries(lastResult.pipes)
        .map(([id, result]) => ({ id, ...result }))
        .sort((a, b) => b.capacity - a.capacity)
    : [];

  // Get selected pipe time series
  const selectedPipeTimeSeries = selectedPipeId 
    ? getPipeTimeSeries(simulationResults, selectedPipeId)
    : [];

  // Get system flow time series
  const systemFlowSeries = simulationResults.map(r => ({
    time: r.time,
    flow: r.systemFlow
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "text-success";
      case "warning": return "text-warning";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "success": return "secondary";
      case "warning": return "outline";
      case "error": return "destructive";
      default: return "default";
    }
  };

  const handleExportReport = () => {
    if (!hasResults || !summary) return;
    
    const report = `
INFOSEWER ENGINE - SIMULATION REPORT
=====================================
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Peak Flow: ${summary.peakFlow.toFixed(2)} MGD
Max Velocity: ${summary.maxVelocity.toFixed(1)} ft/s
Surcharged Pipes: ${summary.surchargeCount}
System Status: ${summary.systemStatus}

TOP 10 SURCHARGED MANHOLES
--------------------------
${summary.surchargeManholes.map((m, i) => 
  `${i + 1}. ${m.id}: Max Depth ${m.maxDepth.toFixed(2)} ft, Duration ${m.duration} min`
).join('\n')}

PIPE RESULTS (Sorted by Capacity)
----------------------------------
${pipeResults.slice(0, 10).map(p => 
  `${p.id}: Flow ${p.flow} MGD, Velocity ${p.velocity} ft/s, Capacity ${p.capacity}%`
).join('\n')}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation_report.txt';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* No Results Message */}
      {!hasResults && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Simulation Results</h3>
            <p className="text-muted-foreground">
              Run a simulation to see hydraulic analysis results here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <stat.icon className={`h-5 w-5 ${getStatusColor(stat.status)}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasResults && (
        <>
          {/* System Flow Graph */}
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    System Flow Over Time
                  </CardTitle>
                  <CardDescription>Total system flow throughout the simulation</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={systemFlowSeries}>
                    <defs>
                      <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Flow (MGD)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)} MGD`, 'System Flow']}
                      labelFormatter={(label) => `Time: ${label} min`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="flow" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#flowGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analysis Results
              </CardTitle>
              <CardDescription>Detailed hydraulic analysis output</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pipes" className="w-full">
                <TabsList>
                  <TabsTrigger value="pipes">Pipes</TabsTrigger>
                  <TabsTrigger value="manholes">Surcharged Manholes</TabsTrigger>
                  <TabsTrigger value="graph">Pipe Time Series</TabsTrigger>
                </TabsList>

                <TabsContent value="pipes" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Click on a pipe to view its time series in the "Pipe Time Series" tab
                  </p>
                  <div className="rounded-lg border max-h-80 overflow-auto">
                    <div className="grid grid-cols-5 gap-4 p-4 bg-muted/30 font-medium text-sm border-b sticky top-0">
                      <div>Pipe ID</div>
                      <div>Flow Rate</div>
                      <div>Velocity</div>
                      <div>Capacity</div>
                      <div>Status</div>
                    </div>
                    {pipeResults.map((pipe) => (
                      <div 
                        key={pipe.id} 
                        className={`grid grid-cols-5 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer ${
                          selectedPipeId === pipe.id ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => setSelectedPipeId(pipe.id)}
                      >
                        <div className="font-medium">{pipe.id}</div>
                        <div className="text-muted-foreground">{pipe.flow} MGD</div>
                        <div className="text-muted-foreground">{pipe.velocity} ft/s</div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={pipe.capacity} 
                            className={`h-2 flex-1 ${
                              pipe.capacity > 90 ? '[&>div]:bg-destructive' :
                              pipe.capacity > 75 ? '[&>div]:bg-warning' : ''
                            }`}
                          />
                          <span className="text-sm text-muted-foreground w-10 text-right">{pipe.capacity}%</span>
                        </div>
                        <div>
                          <Badge variant={pipe.capacity > 90 ? "destructive" : pipe.capacity > 75 ? "outline" : "secondary"}>
                            {pipe.capacity > 90 ? "Critical" : pipe.capacity > 75 ? "Caution" : "Normal"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="manholes" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Top 10 manholes by surcharge duration
                  </p>
                  {summary && summary.surchargeManholes.length > 0 ? (
                    <div className="rounded-lg border">
                      <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 font-medium text-sm border-b">
                        <div>Rank</div>
                        <div>Manhole ID</div>
                        <div>Max Depth</div>
                        <div>Duration</div>
                      </div>
                      {summary.surchargeManholes.map((mh, index) => (
                        <div key={mh.id} className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                          <div className="font-medium">#{index + 1}</div>
                          <div className="font-medium">{mh.id}</div>
                          <div className="text-muted-foreground">{mh.maxDepth.toFixed(2)} ft</div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{mh.duration} min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                      No surcharged manholes detected
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="graph" className="space-y-4 mt-4">
                  {selectedPipeId ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Time Series for {selectedPipeId}</h4>
                        <Badge variant="secondary">
                          {samplePipes.find(p => p.id === selectedPipeId)?.diameter}" diameter
                        </Badge>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedPipeTimeSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="time" 
                              label={{ value: 'Time (min)', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis 
                              yAxisId="left"
                              label={{ value: 'Flow (MGD)', angle: -90, position: 'insideLeft' }}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              label={{ value: 'Capacity (%)', angle: 90, position: 'insideRight' }}
                            />
                            <Tooltip />
                            <Legend />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="flow" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={false}
                              name="Flow (MGD)"
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="capacity" 
                              stroke="hsl(var(--accent))" 
                              strokeWidth={2}
                              dot={false}
                              name="Capacity (%)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Select a pipe from the "Pipes" tab to view its time series
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ResultsView;
