import { Upload, Download, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const InputDataPanel = () => {
  const { toast } = useToast();

  const handleImport = () => {
    toast({
      title: "Import Started",
      description: "Reading input file...",
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
          <CardDescription>Import and export network data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={handleImport} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Import INP File
            </Button>
            <Button onClick={handleExport} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
          <div className="rounded-lg border border-dashed p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop INP file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: .INP, .TXT
            </p>
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
