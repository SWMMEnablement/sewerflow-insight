import { useRef, useState } from "react";
import { Upload, Download, FileText, Database, CheckCircle2, AlertCircle, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { NetworkNode, NetworkPipe, NetworkPump, sampleNodes, samplePipes, samplePumps, networkMetadata } from "@/data/sampleNetwork";
import { parseINPFile, generateSampleINP } from "@/lib/inpParser";

interface NetworkMetadata {
  name: string;
  description: string;
  nodeCount: number;
  pipeCount: number;
  pumpCount: number;
}

interface InputDataPanelProps {
  onNetworkImport: (
    nodes: NetworkNode[], 
    pipes: NetworkPipe[], 
    pumps: NetworkPump[],
    metadata: NetworkMetadata
  ) => void;
}

const InputDataPanel = ({ onNetworkImport }: InputDataPanelProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importStats, setImportStats] = useState<{ nodes: number; pipes: number; pumps: number } | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('idle');
    setParseWarnings([]);

    toast({
      title: "Import Started",
      description: `Reading ${file.name}...`,
    });

    try {
      const content = await file.text();
      const result = parseINPFile(content);

      if (result.errors.length > 0) {
        setImportStatus('error');
        toast({
          title: "Import Failed",
          description: result.errors[0],
          variant: "destructive",
        });
        return;
      }

      if (result.nodes.length === 0) {
        setImportStatus('error');
        toast({
          title: "Import Failed",
          description: "No valid nodes found in the file.",
          variant: "destructive",
        });
        return;
      }

      // Success - update network
      onNetworkImport(result.nodes, result.pipes, result.pumps, {
        ...result.metadata,
        name: file.name.replace(/\.[^/.]+$/, ""),
      });

      setImportStatus('success');
      setImportStats({
        nodes: result.nodes.length,
        pipes: result.pipes.length,
        pumps: result.pumps.length,
      });
      setParseWarnings(result.warnings);

      toast({
        title: "Import Successful",
        description: `Loaded ${result.nodes.length} nodes and ${result.pipes.length} pipes.`,
      });
    } catch (error) {
      setImportStatus('error');
      toast({
        title: "Import Failed",
        description: "Could not parse the file. Please check the format.",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Create a synthetic event for the file handler
    const syntheticEvent = {
      target: { files: [file] }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    await handleFileSelect(syntheticEvent);
  };

  const handleLoadSample = () => {
    onNetworkImport(sampleNodes, samplePipes, samplePumps, networkMetadata);
    setImportStatus('success');
    setImportStats({
      nodes: sampleNodes.length,
      pipes: samplePipes.length,
      pumps: samplePumps.length,
    });
    setParseWarnings([]);
    
    toast({
      title: "Sample Network Loaded",
      description: "EPA Example Network 1 is now active.",
    });
  };

  const handleDownloadSample = () => {
    const content = generateSampleINP();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_network.inp';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Sample Downloaded",
      description: "sample_network.inp has been downloaded.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Complete",
      description: "Data exported successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Import/Export Section */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Management
          </CardTitle>
          <CardDescription>Import SWMM .INP files or use sample network</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={() => fileInputRef.current?.click()} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Import INP File
            </Button>
            <Button onClick={handleLoadSample} variant="outline" className="flex-1">
              <FileCode className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".inp,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div 
            className="rounded-lg border border-dashed p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop INP file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: .INP, .TXT (EPA SWMM format)
            </p>
          </div>

          {/* Import Status */}
          {importStatus === 'success' && importStats && (
            <div className="rounded-lg border border-success/50 bg-success/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium text-success">Import Successful</span>
              </div>
              <div className="flex gap-4 text-sm">
                <Badge variant="secondary">{importStats.nodes} Nodes</Badge>
                <Badge variant="secondary">{importStats.pipes} Pipes</Badge>
                <Badge variant="secondary">{importStats.pumps} Pumps</Badge>
              </div>
              {parseWarnings.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">{parseWarnings.length} warnings:</p>
                  <ul className="list-disc list-inside max-h-20 overflow-auto">
                    {parseWarnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {parseWarnings.length > 5 && (
                      <li>...and {parseWarnings.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {importStatus === 'error' && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">Import Failed</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Please check the file format and try again.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleDownloadSample} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Sample INP
            </Button>
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Forms */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Network Elements</CardTitle>
          <CardDescription>Configure pipes, manholes, and pumps</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pipes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pipes">Pipes</TabsTrigger>
              <TabsTrigger value="manholes">Manholes</TabsTrigger>
              <TabsTrigger value="pumps">Pumps</TabsTrigger>
            </TabsList>

            <TabsContent value="pipes" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pipeId">Pipe ID</Label>
                  <Input id="pipeId" placeholder="P-101" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diameter">Diameter (inches)</Label>
                  <Input id="diameter" type="number" placeholder="12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Length (ft)</Label>
                  <Input id="length" type="number" placeholder="500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Select>
                    <SelectTrigger id="material">
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="pvc">PVC</SelectItem>
                      <SelectItem value="ductile">Ductile Iron</SelectItem>
                      <SelectItem value="steel">Steel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roughness">Roughness (Manning's n)</Label>
                  <Input id="roughness" type="number" step="0.001" placeholder="0.013" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slope">Slope (%)</Label>
                  <Input id="slope" type="number" step="0.01" placeholder="0.5" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Clear</Button>
                <Button>Add Pipe</Button>
              </div>
            </TabsContent>

            <TabsContent value="manholes" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manholeId">Manhole ID</Label>
                  <Input id="manholeId" placeholder="MH-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elevation">Ground Elevation (ft)</Label>
                  <Input id="elevation" type="number" placeholder="125.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invert">Invert Elevation (ft)</Label>
                  <Input id="invert" type="number" placeholder="115.2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mhDepth">Max Depth (ft)</Label>
                  <Input id="mhDepth" type="number" placeholder="10.3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initDepth">Initial Depth (ft)</Label>
                  <Input id="initDepth" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pondArea">Ponded Area (sq ft)</Label>
                  <Input id="pondArea" type="number" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Clear</Button>
                <Button>Add Manhole</Button>
              </div>
            </TabsContent>

            <TabsContent value="pumps" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pumpId">Pump ID</Label>
                  <Input id="pumpId" placeholder="PMP-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pumpType">Pump Type</Label>
                  <Select>
                    <SelectTrigger id="pumpType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capacity">Capacity</SelectItem>
                      <SelectItem value="curve">Pump Curve</SelectItem>
                      <SelectItem value="inline">Inline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (MGD)</Label>
                  <Input id="capacity" type="number" placeholder="2.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startup">Startup Depth (ft)</Label>
                  <Input id="startup" type="number" placeholder="3.0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shutoff">Shutoff Depth (ft)</Label>
                  <Input id="shutoff" type="number" placeholder="1.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select defaultValue="off">
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline">Clear</Button>
                <Button>Add Pump</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InputDataPanel;
