import { useState, useCallback, useRef } from "react";
import { Activity, BarChart3, Network, Settings2, FileText, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import NetworkView from "@/components/NetworkView";
import SimulationPanel from "@/components/SimulationPanel";
import ResultsView from "@/components/ResultsView";
import InputDataPanel from "@/components/InputDataPanel";
import PropertyInspector from "@/components/PropertyInspector";
import GuidedWorkflow from "@/components/GuidedWorkflow";
import TechDetailsModal from "@/components/TechDetailsModal";
import TimeSlider from "@/components/TimeSlider";
import ComparisonMode from "@/components/ComparisonMode";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NetworkNode, NetworkPipe, NetworkPump, sampleNodes, samplePipes, samplePumps, networkMetadata } from "@/data/sampleNetwork";
import { runSimulation, TimeStepResult } from "@/lib/simulationEngine";

interface NetworkMetadata {
  name: string;
  description: string;
  nodeCount: number;
  pipeCount: number;
  pumpCount: number;
}

const Index = () => {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState("network");
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(2);
  const [stormMultiplier, setStormMultiplier] = useState(1.5);
  const [simulationResults, setSimulationResults] = useState<TimeStepResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedPipe, setSelectedPipe] = useState<NetworkPipe | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // Network state - allows loading custom networks
  const [nodes, setNodes] = useState<NetworkNode[]>(sampleNodes);
  const [pipes, setPipes] = useState<NetworkPipe[]>(samplePipes);
  const [pumps, setPumps] = useState<NetworkPump[]>(samplePumps);
  const [currentNetworkMetadata, setCurrentNetworkMetadata] = useState<NetworkMetadata>(networkMetadata);

  const simulationRef = useRef<boolean>(false);
  const animationRef = useRef<number | null>(null);

  const handleNetworkImport = useCallback((
    importedNodes: NetworkNode[], 
    importedPipes: NetworkPipe[], 
    importedPumps: NetworkPump[],
    metadata: NetworkMetadata
  ) => {
    setNodes(importedNodes);
    setPipes(importedPipes);
    setPumps(importedPumps);
    setCurrentNetworkMetadata(metadata);
    setSimulationResults([]);
    setCurrentStep(0);
    setSelectedNode(null);
    setSelectedPipe(null);
  }, []);

  const handleRunSimulation = useCallback(() => {
    setIsSimulating(true);
    simulationRef.current = true;
    setSimulationProgress(0);
    setCurrentTime(0);
    setCurrentStep(0);
    setSimulationResults([]);

    toast({
      title: "Simulation Started",
      description: `Running ${duration}-hour storm analysis...`,
    });

    // Run simulation with current network data
    const results = runSimulation(
      {
        duration,
        timeStep: 5,
        stormMultiplier,
      },
      (progress, time) => {
        if (!simulationRef.current) return;
        setSimulationProgress(progress);
        setCurrentTime(time);
      },
      { nodes, pipes }
    );

    // Animate through results
    let step = 0;
    const animateResults = () => {
      if (!simulationRef.current || step >= results.length) {
        setIsSimulating(false);
        simulationRef.current = false;
        setSimulationResults(results);
        setCurrentStep(results.length - 1);
        
        toast({
          title: "Simulation Complete",
          description: `Analysis finished. ${results.length} time steps computed.`,
        });
        return;
      }

      setCurrentStep(step);
      setCurrentTime(results[step].time);
      setSimulationProgress((step / results.length) * 100);
      setSimulationResults(results.slice(0, step + 1));
      step++;

      // Speed up animation - 50ms per step
      animationRef.current = window.setTimeout(animateResults, 50);
    };

    // Start animation after a brief delay
    setTimeout(animateResults, 100);
  }, [duration, stormMultiplier, toast, nodes, pipes]);

  const handleStopSimulation = useCallback(() => {
    simulationRef.current = false;
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setIsSimulating(false);
    
    toast({
      title: "Simulation Stopped",
      description: "Analysis has been terminated.",
      variant: "destructive",
    });
  }, [toast]);

  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNode(node);
    setSelectedPipe(null);
  }, []);

  const handlePipeClick = useCallback((pipe: NetworkPipe) => {
    setSelectedPipe(pipe);
    setSelectedNode(null);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setSelectedNode(null);
    setSelectedPipe(null);
  }, []);

  // Time slider for reviewing results
  const handleTimeSliderChange = useCallback((step: number) => {
    const clampedStep = Math.min(step, simulationResults.length - 1);
    setCurrentStep(clampedStep);
    if (simulationResults[clampedStep]) {
      setCurrentTime(simulationResults[clampedStep].time);
    }
  }, [simulationResults]);

  const getTimeAtStep = useCallback((step: number) => {
    return simulationResults[step]?.time || 0;
  }, [simulationResults]);

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
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowComparison(true)}
                className="gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Compare
              </Button>
              <TechDetailsModal />
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <ThemeToggle />
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
          <div className="lg:col-span-3 space-y-4">
            <GuidedWorkflow 
              currentStep={currentStep}
              isSimulating={isSimulating}
              hasResults={simulationResults.length > 0}
            />
            <SimulationPanel 
              isSimulating={isSimulating}
              simulationProgress={simulationProgress}
              currentTime={currentTime}
              duration={duration}
              setDuration={setDuration}
              stormMultiplier={stormMultiplier}
              setStormMultiplier={setStormMultiplier}
              onRunSimulation={handleRunSimulation}
              onStopSimulation={handleStopSimulation}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <div className="flex gap-4">
              {/* Main Panel */}
              <Card className="flex-1 p-0 overflow-hidden shadow-medium">
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
                    <NetworkView 
                      isSimulating={isSimulating}
                      simulationProgress={simulationProgress}
                      currentTime={currentTime}
                      simulationResults={simulationResults}
                      currentStep={currentStep}
                      onNodeClick={handleNodeClick}
                      onPipeClick={handlePipeClick}
                      nodes={nodes}
                      pipes={pipes}
                    />
                  </TabsContent>

                  <TabsContent value="results" className="m-0 p-6">
                    <ResultsView simulationResults={simulationResults} pipes={pipes} />
                  </TabsContent>

                  <TabsContent value="input" className="m-0 p-6">
                    <InputDataPanel onNetworkImport={handleNetworkImport} />
                  </TabsContent>
                </Tabs>

                {/* Time Slider - shown when results are available */}
                {simulationResults.length > 1 && (
                  <div className="mt-4">
                    <TimeSlider
                      totalSteps={simulationResults.length}
                      currentStep={currentStep}
                      onStepChange={handleTimeSliderChange}
                      getTimeAtStep={getTimeAtStep}
                      disabled={isSimulating}
                    />
                  </div>
                )}
              </Card>

              {/* Property Inspector Sidebar */}
              {(selectedNode || selectedPipe) && (
                <PropertyInspector
                  selectedNode={selectedNode}
                  selectedPipe={selectedPipe}
                  simulationResults={simulationResults}
                  currentStep={currentStep}
                  onClose={handleCloseInspector}
                  pipes={pipes}
                />
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 flex items-center justify-between rounded-lg border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${isSimulating ? 'text-success animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">
                {isSimulating ? 'Simulation Running...' : simulationResults.length > 0 ? 'Results Available' : 'Ready'}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm text-muted-foreground">
              Network: <span className="font-medium text-foreground">{currentNetworkMetadata.name}</span>
            </div>
            {simulationResults.length > 0 && (
              <>
                <div className="h-4 w-px bg-border" />
                <div className="text-sm text-muted-foreground">
                  Time Steps: <span className="font-medium text-foreground">{simulationResults.length}</span>
                </div>
              </>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Last Updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Comparison Mode Modal */}
      {showComparison && (
        <ComparisonMode onClose={() => setShowComparison(false)} />
      )}
    </div>
  );
};

export default Index;
