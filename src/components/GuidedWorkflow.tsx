import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, HelpCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GuidedWorkflowProps {
  currentStep: number;
  isSimulating: boolean;
  hasResults: boolean;
  onStepAction?: (step: number) => void;
}

const steps = [
  {
    number: 1,
    title: "View the Network",
    description: "Explore the pre-loaded EPA example network. Click on manholes and pipes to view their properties.",
    action: "Explore Network",
    completed: (props: { hasResults: boolean }) => true, // Always available
  },
  {
    number: 2,
    title: "Configure Storm Event",
    description: "Set the simulation duration (2 hours recommended) and storm intensity multiplier.",
    action: "Set Parameters",
    completed: (props: { hasResults: boolean }) => true,
  },
  {
    number: 3,
    title: "Run the Simulation",
    description: "Click 'Run Analysis' to execute the hydraulic simulation. Watch pipes change color as flow increases.",
    action: "Run Analysis",
    completed: (props: { hasResults: boolean }) => props.hasResults,
  },
  {
    number: 4,
    title: "Review Results",
    description: "See which pipes are overloaded (shown in red). Check the surcharged manholes table.",
    action: "View Results",
    completed: (props: { hasResults: boolean }) => props.hasResults,
  },
  {
    number: 5,
    title: "Export Report",
    description: "Download a summary report with peak flow, max velocity, and problem areas identified.",
    action: "Export",
    completed: (props: { hasResults: boolean }) => props.hasResults,
  },
];

const GuidedWorkflow = ({ currentStep, isSimulating, hasResults, onStepAction }: GuidedWorkflowProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine current active step
  const activeStep = hasResults ? 4 : isSimulating ? 3 : 1;

  return (
    <Card className="shadow-soft border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            Quick Start Guide
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </Button>
        </div>
        <CardDescription className="text-xs">
          Follow these steps to run your first analysis
        </CardDescription>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="pt-2">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = step.number === activeStep;
              const isCompleted = step.completed({ hasResults });
              const isPast = step.number < activeStep;

              return (
                <div 
                  key={step.number}
                  className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10 border border-primary/20' : 
                    isPast ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPast && isCompleted ? 'bg-success text-success-foreground' :
                    isActive ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isPast && isCompleted ? '✓' : step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default GuidedWorkflow;
