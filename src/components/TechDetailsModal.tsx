import { useState } from "react";
import { Info, BookOpen, AlertTriangle, X, ExternalLink, Calculator, Waves, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TechDetailsModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-2" />
          Tech Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Technical Documentation
          </DialogTitle>
          <DialogDescription>
            Calculation methodology, limitations, and references
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="methodology" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="methodology">Methodology</TabsTrigger>
            <TabsTrigger value="equations">Equations</TabsTrigger>
            <TabsTrigger value="limitations">Limitations</TabsTrigger>
          </TabsList>

          <TabsContent value="methodology" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Waves className="h-4 w-4" />
                  Hydraulic Analysis Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  InfoSewer Engine uses a simplified approach to the <strong>Saint-Venant equations</strong> 
                  for unsteady flow in open channels and closed conduits. The implementation uses an 
                  <strong> implicit finite difference method</strong> for numerical stability.
                </p>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Solution Method</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Extended Period Simulation (EPS) with configurable time steps</li>
                    <li>Manning's equation for steady-state flow capacity</li>
                    <li>Kinematic wave approximation for pipe flow routing</li>
                    <li>Iterative solution with convergence tolerance of 0.001</li>
                  </ul>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Storm Loading</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>SCS Type II design storm hyetograph</li>
                    <li>Adjustable intensity multiplier (0.5x - 3.0x)</li>
                    <li>Distributed inflow based on network topology</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Network Representation
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  The network is modeled as a directed graph where nodes represent manholes, 
                  wet wells, and outfalls, while links represent pipes and pumps. Flow is 
                  computed based on the hydraulic grade line (HGL) difference between connected nodes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equations" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manning's Equation</CardTitle>
                <CardDescription>Flow capacity in gravity sewers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-foreground text-background p-4 rounded-lg font-mono text-sm">
                  Q = (1.49/n) × A × R^(2/3) × S^(1/2)
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Where:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded">Q</code> = Flow rate (cfs)</li>
                    <li><code className="bg-muted px-1 rounded">n</code> = Manning's roughness coefficient</li>
                    <li><code className="bg-muted px-1 rounded">A</code> = Cross-sectional area (sq ft)</li>
                    <li><code className="bg-muted px-1 rounded">R</code> = Hydraulic radius (ft)</li>
                    <li><code className="bg-muted px-1 rounded">S</code> = Slope (ft/ft)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Continuity Equation</CardTitle>
                <CardDescription>Mass balance at nodes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-foreground text-background p-4 rounded-lg font-mono text-sm">
                  ∂A/∂t + ∂Q/∂x = q
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Conservation of mass ensuring inflows equal outflows plus storage change at each node.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Momentum Equation (Simplified)</CardTitle>
                <CardDescription>Kinematic wave approximation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-foreground text-background p-4 rounded-lg font-mono text-sm">
                  Sf = S0 (bed slope = friction slope)
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Assumes steady uniform flow conditions within each time step - valid for gradually varied flow in sewers.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limitations" className="space-y-4 mt-4">
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Beta Version Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>
                  This is a <strong>demonstration version</strong> of InfoSewer Engine intended for 
                  educational and evaluation purposes. Results should not be used for final engineering 
                  design without validation.
                </p>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">Current Limitations:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Handles only <strong>dendritic (tree-like) networks</strong> - no loops</li>
                    <li>Simplified pump representation (on/off control only)</li>
                    <li>No backwater effects between connected pipes</li>
                    <li>Pressure flow (surcharge) uses simplified approximation</li>
                    <li>No water quality modeling in this version</li>
                    <li>Maximum network size: 500 nodes, 500 pipes</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Recommended For:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Preliminary capacity screening</li>
                    <li>Educational demonstrations</li>
                    <li>Quick "what-if" scenario analysis</li>
                    <li>Identifying potential problem areas</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Not Recommended For:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Final design calculations</li>
                    <li>Regulatory compliance analysis</li>
                    <li>Complex looped network analysis</li>
                    <li>Real-time SCADA integration</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">References</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a href="https://www.epa.gov/water-research/storm-water-management-model-swmm" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-primary hover:underline">
                    EPA SWMM Documentation
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Rossman, L.A. (2015). Storm Water Management Model Reference Manual
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Yen, B.C. (2001). Hydraulics of Sewer Systems, in Mays, L.W. (ed.)
                  </span>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TechDetailsModal;
