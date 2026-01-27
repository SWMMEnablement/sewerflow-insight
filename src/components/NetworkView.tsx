import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { sampleNodes, samplePipes, NetworkNode, NetworkPipe } from "@/data/sampleNetwork";
import { TimeStepResult } from "@/lib/simulationEngine";

interface NetworkViewProps {
  isSimulating: boolean;
  simulationProgress: number;
  currentTime: number;
  simulationResults: TimeStepResult[];
  currentStep: number;
  onNodeClick: (node: NetworkNode) => void;
  onPipeClick: (pipe: NetworkPipe) => void;
}

const NetworkView = ({ 
  isSimulating, 
  simulationProgress, 
  currentTime,
  simulationResults,
  currentStep,
  onNodeClick,
  onPipeClick
}: NetworkViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 50, y: 30 });

  const getNodePosition = useCallback((node: NetworkNode) => ({
    x: node.x * zoom + offset.x,
    y: node.y * zoom + offset.y
  }), [zoom, offset]);

  // Get color based on capacity utilization
  const getCapacityColor = (capacity: number) => {
    if (capacity < 50) return 'rgba(34, 197, 94, 0.8)'; // Green
    if (capacity < 75) return 'rgba(59, 130, 246, 0.8)'; // Blue
    if (capacity < 90) return 'rgba(251, 191, 36, 0.8)'; // Yellow/Orange
    return 'rgba(239, 68, 68, 0.9)'; // Red
  };

  const getNodeColor = (node: NetworkNode, isSurcharged: boolean) => {
    if (node.type === 'wetwell') return '#0099CC';
    if (node.type === 'outfall') return '#64748b';
    if (isSurcharged) return '#ef4444';
    return '#0066CC';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current simulation state
    const currentResult = simulationResults[currentStep] || null;

    // Background grid
    ctx.strokeStyle = "rgba(0, 102, 204, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw pipes
    samplePipes.forEach((pipe) => {
      const fromNode = sampleNodes.find(n => n.id === pipe.fromNode);
      const toNode = sampleNodes.find(n => n.id === pipe.toNode);
      if (!fromNode || !toNode) return;

      const from = getNodePosition(fromNode);
      const to = getNodePosition(toNode);

      // Get pipe result for coloring
      const pipeResult = currentResult?.pipes[pipe.id];
      const capacity = pipeResult?.capacity || 0;
      
      // Pipe line
      const pipeColor = currentResult 
        ? getCapacityColor(capacity)
        : 'rgba(0, 102, 204, 0.5)';
      
      ctx.strokeStyle = hoveredElement === pipe.id ? '#0ea5e9' : pipeColor;
      ctx.lineWidth = hoveredElement === pipe.id ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Flow animation dots when simulating
      if (isSimulating && pipeResult) {
        const t = (Date.now() % 1000) / 1000;
        const dotX = from.x + (to.x - from.x) * t;
        const dotY = from.y + (to.y - from.y) * t;
        
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }

      // Flow direction arrow
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      
      ctx.fillStyle = pipeColor;
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(0, -4);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Capacity label for active simulation
      if (currentResult && capacity > 0) {
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.fillText(`${capacity}%`, midX, midY - 10);
      }
    });

    // Draw nodes
    sampleNodes.forEach((node) => {
      const pos = getNodePosition(node);
      const nodeResult = currentResult?.nodes[node.id];
      const isSurcharged = nodeResult?.isSurcharged || false;
      const isFlooding = (nodeResult?.flooding || 0) > 0;
      
      const isWetWell = node.type === 'wetwell';
      const isOutfall = node.type === 'outfall';
      const baseRadius = isWetWell ? 18 : isOutfall ? 14 : 12;
      const radius = baseRadius * (hoveredElement === node.id ? 1.3 : 1);

      // Flooding glow effect
      if (isFlooding) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = getNodeColor(node, isSurcharged);
      ctx.fill();
      ctx.strokeStyle = hoveredElement === node.id ? '#0ea5e9' : '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Depth indicator inside node
      if (nodeResult && nodeResult.depth > 0) {
        const fillHeight = (nodeResult.depth / node.maxDepth) * radius * 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.fillRect(pos.x - radius, pos.y + radius - fillHeight, radius * 2, fillHeight);
        ctx.restore();
      }

      // Node label
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.label, pos.x, pos.y - radius - 6);
    });

    // Legend
    drawLegend(ctx, canvas.width, canvas.height, currentResult !== null);

  }, [isSimulating, zoom, offset, hoveredElement, simulationResults, currentStep, getNodePosition]);

  const drawLegend = (ctx: CanvasRenderingContext2D, width: number, height: number, hasResults: boolean) => {
    const legendX = width - 160;
    const legendY = 20;
    const legendHeight = hasResults ? 160 : 110;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(legendX, legendY, 145, legendHeight);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(legendX, legendY, 145, legendHeight);
    
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Legend", legendX + 10, legendY + 18);
    
    // Manhole
    ctx.beginPath();
    ctx.arc(legendX + 18, legendY + 38, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#0066CC";
    ctx.fill();
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText("Manhole", legendX + 32, legendY + 42);
    
    // Wet Well
    ctx.beginPath();
    ctx.arc(legendX + 18, legendY + 58, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#0099CC";
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.fillText("Wet Well", legendX + 32, legendY + 62);
    
    // Outfall
    ctx.beginPath();
    ctx.arc(legendX + 18, legendY + 78, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#64748b";
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.fillText("Outfall", legendX + 32, legendY + 82);

    if (hasResults) {
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("Capacity", legendX + 10, legendY + 105);
      
      // Capacity colors
      const colors = [
        { color: 'rgba(34, 197, 94, 0.8)', label: '< 50%' },
        { color: 'rgba(59, 130, 246, 0.8)', label: '50-75%' },
        { color: 'rgba(251, 191, 36, 0.8)', label: '75-90%' },
        { color: 'rgba(239, 68, 68, 0.9)', label: '> 90%' }
      ];
      
      colors.forEach((c, i) => {
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(legendX + 10, legendY + 120 + i * 12);
        ctx.lineTo(legendX + 28, legendY + 120 + i * 12);
        ctx.stroke();
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText(c.label, legendX + 34, legendY + 124 + i * 12);
      });
    }
  };

  // Handle click detection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check nodes first
    for (const node of sampleNodes) {
      const pos = getNodePosition(node);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance < 18) {
        onNodeClick(node);
        return;
      }
    }

    // Check pipes
    for (const pipe of samplePipes) {
      const fromNode = sampleNodes.find(n => n.id === pipe.fromNode);
      const toNode = sampleNodes.find(n => n.id === pipe.toNode);
      if (!fromNode || !toNode) continue;

      const from = getNodePosition(fromNode);
      const to = getNodePosition(toNode);
      
      // Point to line distance
      const lineLen = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
      const t = Math.max(0, Math.min(1, ((x - from.x) * (to.x - from.x) + (y - from.y) * (to.y - from.y)) / (lineLen * lineLen)));
      const projX = from.x + t * (to.x - from.x);
      const projY = from.y + t * (to.y - from.y);
      const distance = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));
      
      if (distance < 10) {
        onPipeClick(pipe);
        return;
      }
    }
  };

  // Handle mouse move for hover effects
  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found = false;

    // Check nodes
    for (const node of sampleNodes) {
      const pos = getNodePosition(node);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance < 18) {
        setHoveredElement(node.id);
        canvas.style.cursor = 'pointer';
        found = true;
        break;
      }
    }

    // Check pipes if no node found
    if (!found) {
      for (const pipe of samplePipes) {
        const fromNode = sampleNodes.find(n => n.id === pipe.fromNode);
        const toNode = sampleNodes.find(n => n.id === pipe.toNode);
        if (!fromNode || !toNode) continue;

        const from = getNodePosition(fromNode);
        const to = getNodePosition(toNode);
        
        const lineLen = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
        const t = Math.max(0, Math.min(1, ((x - from.x) * (to.x - from.x) + (y - from.y) * (to.y - from.y)) / (lineLen * lineLen)));
        const projX = from.x + t * (to.x - from.x);
        const projY = from.y + t * (to.y - from.y);
        const distance = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));
        
        if (distance < 10) {
          setHoveredElement(pipe.id);
          canvas.style.cursor = 'pointer';
          found = true;
          break;
        }
      }
    }

    if (!found) {
      setHoveredElement(null);
      canvas.style.cursor = 'default';
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.6));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Network Visualization</h3>
          {isSimulating && (
            <Badge variant="default" className="animate-pulse bg-primary">
              Simulating...
            </Badge>
          )}
          {!isSimulating && simulationResults.length > 0 && (
            <Badge variant="secondary">
              Results at t={currentTime} min
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar during simulation */}
      {isSimulating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Simulation Progress</span>
            <span className="font-medium">{Math.round(simulationProgress)}%</span>
          </div>
          <Progress value={simulationProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Time: {currentTime} minutes • Solving hydraulic equations...
          </p>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="relative rounded-lg border bg-white overflow-hidden" 
        style={{ height: "520px" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MousePointer className="h-4 w-4" />
          <span>Click on nodes or pipes to view properties</span>
        </div>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default NetworkView;
