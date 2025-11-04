import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ResultsView = () => {
  const summaryStats = [
    { label: "Peak Flow", value: "12.45 MGD", status: "success", icon: TrendingUp },
    { label: "Max Velocity", value: "8.2 ft/s", status: "warning", icon: AlertTriangle },
    { label: "Surcharge Count", value: "3 pipes", status: "warning", icon: AlertTriangle },
    { label: "System Status", value: "Stable", status: "success", icon: CheckCircle2 },
  ];

  const pipeResults = [
    { id: "P-101", flow: "2.34 MGD", velocity: "5.2 ft/s", capacity: 78, status: "success" },
    { id: "P-102", flow: "3.12 MGD", velocity: "6.8 ft/s", capacity: 92, status: "warning" },
    { id: "P-103", flow: "1.89 MGD", velocity: "4.1 ft/s", capacity: 65, status: "success" },
    { id: "P-104", flow: "4.56 MGD", velocity: "8.2 ft/s", capacity: 98, status: "error" },
    { id: "P-105", flow: "2.78 MGD", velocity: "5.9 ft/s", capacity: 82, status: "success" },
  ];

  const manholeResults = [
    { id: "MH-1", inflow: "2.34 MGD", depth: "3.2 ft", hgl: "125.6 ft", status: "success" },
    { id: "MH-2", inflow: "3.45 MGD", depth: "4.8 ft", hgl: "124.2 ft", status: "success" },
    { id: "MH-3", inflow: "1.89 MGD", depth: "2.1 ft", hgl: "126.8 ft", status: "success" },
    { id: "MH-4", inflow: "5.23 MGD", depth: "6.5 ft", hgl: "122.4 ft", status: "warning" },
  ];

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

  return (
    <div className="space-y-6">
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
              <TabsTrigger value="manholes">Manholes</TabsTrigger>
              <TabsTrigger value="pumps">Pumps</TabsTrigger>
            </TabsList>

            <TabsContent value="pipes" className="space-y-4 mt-4">
              <div className="rounded-lg border">
                <div className="grid grid-cols-5 gap-4 p-4 bg-muted/30 font-medium text-sm border-b">
                  <div>Pipe ID</div>
                  <div>Flow Rate</div>
                  <div>Velocity</div>
                  <div>Capacity</div>
                  <div>Status</div>
                </div>
                {pipeResults.map((pipe) => (
                  <div key={pipe.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <div className="font-medium">{pipe.id}</div>
                    <div className="text-muted-foreground">{pipe.flow}</div>
                    <div className="text-muted-foreground">{pipe.velocity}</div>
                    <div className="flex items-center gap-2">
                      <Progress value={pipe.capacity} className="h-2 flex-1" />
                      <span className="text-sm text-muted-foreground w-10 text-right">{pipe.capacity}%</span>
                    </div>
                    <div>
                      <Badge variant={getStatusVariant(pipe.status)}>
                        {pipe.status === "success" ? "Normal" : pipe.status === "warning" ? "Caution" : "Critical"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="manholes" className="space-y-4 mt-4">
              <div className="rounded-lg border">
                <div className="grid grid-cols-5 gap-4 p-4 bg-muted/30 font-medium text-sm border-b">
                  <div>Manhole ID</div>
                  <div>Inflow</div>
                  <div>Depth</div>
                  <div>HGL</div>
                  <div>Status</div>
                </div>
                {manholeResults.map((mh) => (
                  <div key={mh.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <div className="font-medium">{mh.id}</div>
                    <div className="text-muted-foreground">{mh.inflow}</div>
                    <div className="text-muted-foreground">{mh.depth}</div>
                    <div className="text-muted-foreground">{mh.hgl}</div>
                    <div>
                      <Badge variant={getStatusVariant(mh.status)}>
                        {mh.status === "success" ? "Normal" : "Caution"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pumps" className="space-y-4 mt-4">
              <div className="text-center py-12 text-muted-foreground">
                No pump data available for current simulation
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsView;
