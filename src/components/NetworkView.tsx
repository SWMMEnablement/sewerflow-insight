import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NetworkNode, NetworkPipe } from "@/data/sampleNetwork";
import { TimeStepResult } from "@/lib/simulationEngine";
import NetworkEditorToolbar, { EditorMode } from "@/components/NetworkEditorToolbar";

interface NetworkViewProps {
  isSimulating: boolean;
  simulationProgress: number;
  currentTime: number;
  simulationResults: TimeStepResult[];
  currentStep: number;
  onNodeClick: (node: NetworkNode) => void;
  onPipeClick: (pipe: NetworkPipe) => void;
  nodes: NetworkNode[];
  pipes: NetworkPipe[];
  // Editor callbacks
  onAddNode?: (node: NetworkNode) => void;
  onUpdateNode?: (node: NetworkNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  onAddPipe?: (pipe: NetworkPipe) => void;
  onDeletePipe?: (pipeId: string) => void;
}

const NetworkView = ({ 
  isSimulating, 
  simulationProgress, 
  currentTime,
  simulationResults,
  currentStep,
  onNodeClick,
  onPipeClick,
  nodes,
  pipes,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onAddPipe,
  onDeletePipe,
}: NetworkViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 50, y: 30 });

  // Editor state
  const [editorActive, setEditorActive] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("select");
  const [pendingConnection, setPendingConnection] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const getNodePosition = useCallback((node: NetworkNode) => ({
    x: node.x * zoom + offset.x,
    y: node.y * zoom + offset.y
  }), [zoom, offset]);

  const canvasToNetwork = useCallback((canvasX: number, canvasY: number) => ({
    x: (canvasX - offset.x) / zoom,
    y: (canvasY - offset.y) / zoom,
  }), [zoom, offset]);

  // Get color based on capacity utilization
  const getCapacityColor = (capacity: number) => {
    if (capacity < 50) return 'rgba(34, 197, 94, 0.8)';
    if (capacity < 75) return 'rgba(59, 130, 246, 0.8)';
    if (capacity < 90) return 'rgba(251, 191, 36, 0.8)';
    return 'rgba(239, 68, 68, 0.9)';
  };

  const getNodeColor = (node: NetworkNode, isSurcharged: boolean) => {
    if (node.type === 'wetwell') return '#0099CC';
    if (node.type === 'outfall') return '#64748b';
    if (isSurcharged) return '#ef4444';
    return '#0066CC';
  };

  // Find node at canvas position
  const findNodeAt = useCallback((x: number, y: number): NetworkNode | null => {
    for (const node of nodes) {
      const pos = getNodePosition(node);
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 18) return node;
    }
    return null;
  }, [nodes, getNodePosition]);

  // Find pipe at canvas position
  const findPipeAt = useCallback((x: number, y: number): NetworkPipe | null => {
    for (const pipe of pipes) {
      const fromNode = nodes.find(n => n.id === pipe.fromNode);
      const toNode = nodes.find(n => n.id === pipe.toNode);
      if (!fromNode || !toNode) continue;
      const from = getNodePosition(fromNode);
      const to = getNodePosition(toNode);
      const lineLen = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
      const t = Math.max(0, Math.min(1, ((x - from.x) * (to.x - from.x) + (y - from.y) * (to.y - from.y)) / (lineLen * lineLen)));
      const projX = from.x + t * (to.x - from.x);
      const projY = from.y + t * (to.y - from.y);
      const distance = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
      if (distance < 10) return pipe;
    }
    return null;
  }, [nodes, pipes, getNodePosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // Editor mode grid dots
    if (editorActive && editorMode === 'addNode') {
      ctx.fillStyle = 'rgba(0, 102, 204, 0.15)';
      for (let x = 0; x < canvas.width; x += 40) {
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw pipes
    pipes.forEach((pipe) => {
      const fromNode = nodes.find(n => n.id === pipe.fromNode);
      const toNode = nodes.find(n => n.id === pipe.toNode);
      if (!fromNode || !toNode) return;

      const from = getNodePosition(fromNode);
      const to = getNodePosition(toNode);

      const pipeResult = currentResult?.pipes[pipe.id];
      const capacity = pipeResult?.capacity || 0;
      
      const pipeColor = currentResult 
        ? getCapacityColor(capacity)
        : 'rgba(0, 102, 204, 0.5)';
      
      const isDeleteTarget = editorActive && editorMode === 'delete' && hoveredElement === pipe.id;
      
      ctx.strokeStyle = isDeleteTarget ? '#ef4444' : hoveredElement === pipe.id ? '#0ea5e9' : pipeColor;
      ctx.lineWidth = hoveredElement === pipe.id ? 5 : 3;
      
      if (isDeleteTarget) {
        ctx.setLineDash([6, 4]);
      }
      
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);

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
      
      ctx.fillStyle = isDeleteTarget ? '#ef4444' : pipeColor;
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

      // Capacity label
      if (currentResult && capacity > 0) {
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.fillText(`${capacity}%`, midX, midY - 10);
      }
    });

    // Draw pending connection line
    if (editorActive && editorMode === 'addPipe' && pendingConnection) {
      const sourceNode = nodes.find(n => n.id === pendingConnection);
      if (sourceNode) {
        const pos = getNodePosition(sourceNode);
        // Draw pulsing ring on source node
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw nodes
    nodes.forEach((node) => {
      const pos = getNodePosition(node);
      const nodeResult = currentResult?.nodes[node.id];
      const isSurcharged = nodeResult?.isSurcharged || false;
      const isFlooding = (nodeResult?.flooding || 0) > 0;
      
      const isWetWell = node.type === 'wetwell';
      const isOutfall = node.type === 'outfall';
      const baseRadius = isWetWell ? 18 : isOutfall ? 14 : 12;
      const isHovered = hoveredElement === node.id;
      const isDeleteTarget = editorActive && editorMode === 'delete' && isHovered;
      const isMoveTarget = editorActive && editorMode === 'move' && (isHovered || draggingNode === node.id);
      const isConnectSource = pendingConnection === node.id;
      const isConnectTarget = editorActive && editorMode === 'addPipe' && pendingConnection && isHovered && pendingConnection !== node.id;
      
      const radius = baseRadius * (isHovered ? 1.3 : 1);

      // Flooding glow effect
      if (isFlooding) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.fill();
      }

      // Move target glow
      if (isMoveTarget) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fill();
      }

      // Connect target glow
      if (isConnectTarget) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isDeleteTarget ? '#ef4444' : isConnectSource ? '#22c55e' : getNodeColor(node, isSurcharged);
      ctx.fill();
      ctx.strokeStyle = isDeleteTarget ? '#dc2626' : isMoveTarget ? '#3b82f6' : isConnectTarget ? '#22c55e' : isHovered ? '#0ea5e9' : '#fff';
      ctx.lineWidth = isDeleteTarget || isMoveTarget || isConnectTarget ? 3 : 2;
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

  }, [isSimulating, zoom, offset, hoveredElement, simulationResults, currentStep, getNodePosition, nodes, pipes, editorActive, editorMode, pendingConnection, draggingNode]);

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
    
    ctx.beginPath();
    ctx.arc(legendX + 18, legendY + 38, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#0066CC";
    ctx.fill();
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText("Manhole", legendX + 32, legendY + 42);
    
    ctx.beginPath();
    ctx.arc(legendX + 18, legendY + 58, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#0099CC";
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.fillText("Wet Well", legendX + 32, legendY + 62);
    
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

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Generate unique IDs
  const nextNodeId = useCallback(() => {
    const existing = nodes.map(n => {
      const match = n.id.match(/^MH-(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
    const max = Math.max(0, ...existing);
    return `MH-${max + 1}`;
  }, [nodes]);

  const nextPipeId = useCallback(() => {
    const existing = pipes.map(p => {
      const match = p.id.match(/^P-(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
    const max = Math.max(0, ...existing);
    return `P-${max + 1}`;
  }, [pipes]);

  // Handle click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (editorActive) {
      switch (editorMode) {
        case "addNode": {
          if (!onAddNode) return;
          const networkPos = canvasToNetwork(x, y);
          const id = nextNodeId();
          onAddNode({
            id,
            x: Math.round(networkPos.x),
            y: Math.round(networkPos.y),
            type: 'manhole',
            label: id,
            elevation: 120,
            rimElevation: 120,
            invertElevation: 112,
            maxDepth: 8,
          });
          return;
        }
        case "addPipe": {
          const node = findNodeAt(x, y);
          if (!node) {
            setPendingConnection(null);
            return;
          }
          if (!pendingConnection) {
            setPendingConnection(node.id);
          } else {
            if (pendingConnection !== node.id && onAddPipe) {
              const fromNode = nodes.find(n => n.id === pendingConnection);
              const toNode = node;
              if (fromNode) {
                const dx = toNode.x - fromNode.x;
                const dy = toNode.y - fromNode.y;
                const length = Math.round(Math.sqrt(dx * dx + dy * dy) * 10) / 10;
                const drop = fromNode.invertElevation - toNode.invertElevation;
                const slope = length > 0 ? Math.round(Math.abs((drop / (length || 1)) * 100) * 1000) / 1000 : 0.5;
                const id = nextPipeId();
                onAddPipe({
                  id,
                  fromNode: pendingConnection,
                  toNode: node.id,
                  diameter: 12,
                  length: Math.max(50, length * 3),
                  roughness: 0.013,
                  slope: slope || 0.5,
                });
              }
            }
            setPendingConnection(null);
          }
          return;
        }
        case "delete": {
          const node = findNodeAt(x, y);
          if (node && onDeleteNode) {
            onDeleteNode(node.id);
            return;
          }
          const pipe = findPipeAt(x, y);
          if (pipe && onDeletePipe) {
            onDeletePipe(pipe.id);
            return;
          }
          return;
        }
        case "select":
        default:
          break;
      }
    }

    // Default: inspect mode
    const node = findNodeAt(x, y);
    if (node) { onNodeClick(node); return; }
    const pipe = findPipeAt(x, y);
    if (pipe) { onPipeClick(pipe); return; }
  };

  // Handle mouse down for drag
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editorActive || editorMode !== 'move') return;
    const { x, y } = getCanvasCoords(e);
    const node = findNodeAt(x, y);
    if (node) {
      setDraggingNode(node.id);
      setDragStart({ x, y });
      e.preventDefault();
    }
  };

  // Handle mouse move
  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e);

    // Handle drag
    if (draggingNode && dragStart && onUpdateNode) {
      const node = nodes.find(n => n.id === draggingNode);
      if (node) {
        const dx = (x - dragStart.x) / zoom;
        const dy = (y - dragStart.y) / zoom;
        onUpdateNode({
          ...node,
          x: node.x + dx,
          y: node.y + dy,
        });
        setDragStart({ x, y });
      }
      return;
    }

    // Hover detection
    let found = false;
    for (const node of nodes) {
      const pos = getNodePosition(node);
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (distance < 18) {
        setHoveredElement(node.id);
        found = true;
        break;
      }
    }

    if (!found) {
      for (const pipe of pipes) {
        const fromNode = nodes.find(n => n.id === pipe.fromNode);
        const toNode = nodes.find(n => n.id === pipe.toNode);
        if (!fromNode || !toNode) continue;
        const from = getNodePosition(fromNode);
        const to = getNodePosition(toNode);
        const lineLen = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
        const t = Math.max(0, Math.min(1, ((x - from.x) * (to.x - from.x) + (y - from.y) * (to.y - from.y)) / (lineLen * lineLen)));
        const projX = from.x + t * (to.x - from.x);
        const projY = from.y + t * (to.y - from.y);
        const distance = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
        if (distance < 10) {
          setHoveredElement(pipe.id);
          found = true;
          break;
        }
      }
    }

    if (!found) setHoveredElement(null);

    // Cursor
    if (editorActive) {
      if (editorMode === 'addNode') {
        canvas.style.cursor = 'crosshair';
      } else if (editorMode === 'move') {
        canvas.style.cursor = draggingNode ? 'grabbing' : found ? 'grab' : 'default';
      } else if (editorMode === 'delete') {
        canvas.style.cursor = found ? 'pointer' : 'default';
      } else if (editorMode === 'addPipe') {
        canvas.style.cursor = found ? 'pointer' : 'default';
      } else {
        canvas.style.cursor = found ? 'pointer' : 'default';
      }
    } else {
      canvas.style.cursor = found ? 'pointer' : 'default';
    }
  };

  // Handle mouse up for drag end
  const handleCanvasMouseUp = () => {
    setDraggingNode(null);
    setDragStart(null);
  };

  // Handle mouse leave
  const handleCanvasMouseLeave = () => {
    setDraggingNode(null);
    setDragStart(null);
    setHoveredElement(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.6));

  const handleToggleEditor = useCallback(() => {
    setEditorActive(prev => !prev);
    setEditorMode("select");
    setPendingConnection(null);
    setDraggingNode(null);
  }, []);

  const handleModeChange = useCallback((mode: EditorMode) => {
    setEditorMode(mode);
    setPendingConnection(null);
    setDraggingNode(null);
  }, []);

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

      {/* Editor Toolbar */}
      <NetworkEditorToolbar
        editorActive={editorActive}
        onToggleEditor={handleToggleEditor}
        mode={editorMode}
        onModeChange={handleModeChange}
        pendingConnection={pendingConnection}
        nodeCount={nodes.length}
        pipeCount={pipes.length}
      />

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
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
        />

        {/* Editor mode indicator */}
        {editorActive && editorMode !== 'select' && (
          <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium shadow-md">
            {editorMode === 'addNode' && '⊕ Click to place manhole'}
            {editorMode === 'move' && '✋ Drag nodes to reposition'}
            {editorMode === 'addPipe' && '🔗 Click two nodes to connect'}
            {editorMode === 'delete' && '🗑 Click element to remove'}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MousePointer className="h-4 w-4" />
          <span>
            {editorActive 
              ? 'Editor mode active — use the toolbar above to switch tools'
              : 'Click on nodes or pipes to view properties'}
          </span>
        </div>
        <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default NetworkView;
