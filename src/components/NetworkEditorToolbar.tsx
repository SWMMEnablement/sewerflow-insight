import { MousePointer, Plus, Move, Link2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type EditorMode = "select" | "addNode" | "move" | "addPipe" | "delete";

interface NetworkEditorToolbarProps {
  editorActive: boolean;
  onToggleEditor: () => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  pendingConnection: string | null;
  nodeCount: number;
  pipeCount: number;
}

const tools: { mode: EditorMode; icon: typeof MousePointer; label: string; tip: string }[] = [
  { mode: "select", icon: MousePointer, label: "Select", tip: "Click to inspect nodes & pipes" },
  { mode: "addNode", icon: Plus, label: "Add Node", tip: "Click on canvas to place a manhole" },
  { mode: "move", icon: Move, label: "Move", tip: "Drag nodes to reposition them" },
  { mode: "addPipe", icon: Link2, label: "Connect", tip: "Click two nodes to add a pipe between them" },
  { mode: "delete", icon: Trash2, label: "Delete", tip: "Click a node or pipe to remove it" },
];

const NetworkEditorToolbar = ({
  editorActive,
  onToggleEditor,
  mode,
  onModeChange,
  pendingConnection,
  nodeCount,
  pipeCount,
}: NetworkEditorToolbarProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={editorActive ? "default" : "outline"}
        size="sm"
        onClick={onToggleEditor}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        {editorActive ? "Editing" : "Edit Network"}
      </Button>

      {editorActive && (
        <>
          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {tools.map((tool) => (
              <Tooltip key={tool.mode}>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === tool.mode ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onModeChange(tool.mode)}
                  >
                    <tool.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="font-medium">{tool.label}</p>
                  <p className="text-xs text-muted-foreground">{tool.tip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {pendingConnection && (
            <Badge variant="outline" className="animate-pulse border-primary text-primary">
              Click second node to connect from {pendingConnection}
            </Badge>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>{nodeCount} nodes</span>
            <span>•</span>
            <span>{pipeCount} pipes</span>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkEditorToolbar;
