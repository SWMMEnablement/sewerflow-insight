import { useState } from "react";
import { Activity, BarChart3, Network, Play, Settings2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NetworkView from "@/components/NetworkView";
import SimulationPanel from "@/components/SimulationPanel";
import ResultsView from "@/components/ResultsView";
import InputDataPanel from "@/components/InputDataPanel";

const Index = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState("network");

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Network className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">InfoSewer Engine</h1>
                <p className="text-sm text-muted-foreground">Hydraulic Analysis & Simulation Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Sidebar - Simulation Controls */}
          <div className="lg:col-span-3">
            <SimulationPanel 
              isSimulating={isSimulating} 
              setIsSimulating={setIsSimulating}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <Card className="p-0 overflow-hidden shadow-medium">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b bg-muted/30 px-6 py-3">
                  <TabsList className="bg-background">
                    <TabsTrigger value="network" className="gap-2">
                      <Network className="h-4 w-4" />
                      Network
                    </TabsTrigger>
                    <TabsTrigger value="results" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="input" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Input Data
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="network" className="m-0 p-6">
                  <NetworkView isSimulating={isSimulating} />
                </TabsContent>

                <TabsContent value="results" className="m-0 p-6">
                  <ResultsView />
                </TabsContent>

                <TabsContent value="input" className="m-0 p-6">
                  <InputDataPanel />
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 flex items-center justify-between rounded-lg border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${isSimulating ? 'text-success animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">
                {isSimulating ? 'Simulation Running...' : 'Ready'}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm text-muted-foreground">
              Network: <span className="font-medium text-foreground">Sample_Network.inp</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Last Updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
