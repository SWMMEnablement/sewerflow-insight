import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NetworkViewProps {
  isSimulating: boolean;
}

const NetworkView = ({ isSimulating }: NetworkViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sample network
    drawNetwork(ctx, canvas.width, canvas.height, isSimulating);
  }, [isSimulating, zoom]);

  const drawNetwork = (ctx: CanvasRenderingContext2D, width: number, height: number, animating: boolean) => {
    // Background grid
    ctx.strokeStyle = "rgba(0, 102, 204, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Sample network nodes (manholes)
    const nodes = [
      { x: 100, y: 100, label: "MH-1" },
      { x: 250, y: 120, label: "MH-2" },
      { x: 400, y: 100, label: "MH-3" },
      { x: 550, y: 130, label: "MH-4" },
      { x: 175, y: 250, label: "MH-5" },
      { x: 325, y: 270, label: "MH-6" },
      { x: 475, y: 260, label: "MH-7" },
      { x: 250, y: 400, label: "WW-1" },
      { x: 400, y: 420, label: "WW-2" },
    ];

    // Sample pipes
    const pipes = [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 5 },
      { from: 2, to: 6 },
      { from: 4, to: 5 },
      { from: 5, to: 6 },
      { from: 4, to: 7 },
      { from: 5, to: 7 },
      { from: 6, to: 8 },
    ];

    // Draw pipes
    pipes.forEach((pipe) => {
      const from = nodes[pipe.from];
      const to = nodes[pipe.to];
      
      ctx.strokeStyle = animating ? "rgba(0, 153, 204, 0.8)" : "rgba(0, 102, 204, 0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Flow direction arrow
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      
      ctx.fillStyle = animating ? "#0099CC" : "#0066CC";
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
    });

    // Draw nodes
    nodes.forEach((node, index) => {
      const isWetWell = node.label.startsWith("WW");
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isWetWell ? 16 : 12, 0, Math.PI * 2);
      ctx.fillStyle = isWetWell ? "#0099CC" : (animating ? "#00CC99" : "#0066CC");
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = "#1e293b";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y - 20);
    });

    // Legend
    const legendX = width - 150;
    const legendY = 30;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(legendX, legendY, 130, 100);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(legendX, legendY, 130, 100);
    
    ctx.fillStyle = "#1e293b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Legend", legendX + 10, legendY + 20);
    
    // Manhole
    ctx.beginPath();
    ctx.arc(legendX + 20, legendY + 40, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#0066CC";
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.fillText("Manhole", legendX + 35, legendY + 44);
    
    // Wet Well
    ctx.beginPath();
    ctx.arc(legendX + 20, legendY + 60, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#0099CC";
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.fillText("Wet Well", legendX + 35, legendY + 64);
    
    // Pipe
    ctx.strokeStyle = "#0066CC";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendX + 10, legendY + 85);
    ctx.lineTo(legendX + 30, legendY + 85);
    ctx.stroke();
    ctx.fillStyle = "#475569";
    ctx.fillText("Pipe", legendX + 35, legendY + 89);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Network Visualization</h3>
          {isSimulating && (
            <Badge variant="default" className="animate-pulse">
              Simulating
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
      
      <div className="relative rounded-lg border bg-white overflow-hidden" style={{ height: "600px" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        Zoom: {(zoom * 100).toFixed(0)}% • Click nodes for details • Drag to pan
      </div>
    </div>
  );
};

export default NetworkView;
