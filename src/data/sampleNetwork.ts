// EPA SWMM-style sample network data - Simple Example Network
// Based on public domain examples for educational purposes

export interface NetworkNode {
  id: string;
  x: number;
  y: number;
  type: 'manhole' | 'wetwell' | 'outfall';
  label: string;
  elevation: number; // feet
  rimElevation: number;
  invertElevation: number;
  maxDepth: number;
}

export interface NetworkPipe {
  id: string;
  fromNode: string;
  toNode: string;
  diameter: number; // inches
  length: number; // feet
  roughness: number; // Manning's n
  slope: number; // percent
}

export interface NetworkPump {
  id: string;
  fromNode: string;
  toNode: string;
  capacity: number; // GPM
  onLevel: number;
  offLevel: number;
}

export interface SimulationResult {
  time: number; // minutes from start
  nodeResults: Map<string, NodeResult>;
  pipeResults: Map<string, PipeResult>;
}

export interface NodeResult {
  depth: number; // feet
  hgl: number; // feet
  inflow: number; // MGD
  flooding: number; // MGD
  isSurcharged: boolean;
}

export interface PipeResult {
  flow: number; // MGD
  velocity: number; // ft/s
  capacity: number; // percent utilized
  isSurcharged: boolean;
}

// Sample Network: Modified EPA Example 1 - Dendritic sewer system
export const sampleNodes: NetworkNode[] = [
  { id: 'MH-1', x: 80, y: 60, type: 'manhole', label: 'MH-1', elevation: 128.0, rimElevation: 128.0, invertElevation: 120.0, maxDepth: 8.0 },
  { id: 'MH-2', x: 200, y: 80, type: 'manhole', label: 'MH-2', elevation: 126.0, rimElevation: 126.0, invertElevation: 118.5, maxDepth: 7.5 },
  { id: 'MH-3', x: 320, y: 60, type: 'manhole', label: 'MH-3', elevation: 125.0, rimElevation: 125.0, invertElevation: 117.0, maxDepth: 8.0 },
  { id: 'MH-4', x: 450, y: 90, type: 'manhole', label: 'MH-4', elevation: 124.0, rimElevation: 124.0, invertElevation: 116.0, maxDepth: 8.0 },
  { id: 'MH-5', x: 140, y: 180, type: 'manhole', label: 'MH-5', elevation: 122.0, rimElevation: 122.0, invertElevation: 114.5, maxDepth: 7.5 },
  { id: 'MH-6', x: 260, y: 200, type: 'manhole', label: 'MH-6', elevation: 120.0, rimElevation: 120.0, invertElevation: 112.0, maxDepth: 8.0 },
  { id: 'MH-7', x: 380, y: 180, type: 'manhole', label: 'MH-7', elevation: 118.0, rimElevation: 118.0, invertElevation: 110.0, maxDepth: 8.0 },
  { id: 'MH-8', x: 500, y: 200, type: 'manhole', label: 'MH-8', elevation: 116.0, rimElevation: 116.0, invertElevation: 108.0, maxDepth: 8.0 },
  { id: 'MH-9', x: 200, y: 300, type: 'manhole', label: 'MH-9', elevation: 115.0, rimElevation: 115.0, invertElevation: 107.0, maxDepth: 8.0 },
  { id: 'MH-10', x: 320, y: 320, type: 'manhole', label: 'MH-10', elevation: 112.0, rimElevation: 112.0, invertElevation: 104.0, maxDepth: 8.0 },
  { id: 'MH-11', x: 440, y: 300, type: 'manhole', label: 'MH-11', elevation: 110.0, rimElevation: 110.0, invertElevation: 102.0, maxDepth: 8.0 },
  { id: 'WW-1', x: 280, y: 420, type: 'wetwell', label: 'WW-1', elevation: 105.0, rimElevation: 110.0, invertElevation: 95.0, maxDepth: 15.0 },
  { id: 'OUT-1', x: 400, y: 480, type: 'outfall', label: 'Outfall', elevation: 100.0, rimElevation: 100.0, invertElevation: 98.0, maxDepth: 2.0 },
];

export const samplePipes: NetworkPipe[] = [
  { id: 'P-1', fromNode: 'MH-1', toNode: 'MH-2', diameter: 12, length: 400, roughness: 0.013, slope: 0.5 },
  { id: 'P-2', fromNode: 'MH-2', toNode: 'MH-3', diameter: 15, length: 380, roughness: 0.013, slope: 0.4 },
  { id: 'P-3', fromNode: 'MH-3', toNode: 'MH-4', diameter: 18, length: 420, roughness: 0.013, slope: 0.35 },
  { id: 'P-4', fromNode: 'MH-1', toNode: 'MH-5', diameter: 12, length: 350, roughness: 0.013, slope: 0.6 },
  { id: 'P-5', fromNode: 'MH-2', toNode: 'MH-6', diameter: 15, length: 360, roughness: 0.013, slope: 0.45 },
  { id: 'P-6', fromNode: 'MH-3', toNode: 'MH-7', diameter: 18, length: 370, roughness: 0.013, slope: 0.4 },
  { id: 'P-7', fromNode: 'MH-4', toNode: 'MH-8', diameter: 21, length: 390, roughness: 0.013, slope: 0.35 },
  { id: 'P-8', fromNode: 'MH-5', toNode: 'MH-6', diameter: 15, length: 380, roughness: 0.013, slope: 0.5 },
  { id: 'P-9', fromNode: 'MH-6', toNode: 'MH-7', diameter: 18, length: 360, roughness: 0.013, slope: 0.45 },
  { id: 'P-10', fromNode: 'MH-7', toNode: 'MH-8', diameter: 21, length: 380, roughness: 0.013, slope: 0.4 },
  { id: 'P-11', fromNode: 'MH-5', toNode: 'MH-9', diameter: 18, length: 340, roughness: 0.013, slope: 0.55 },
  { id: 'P-12', fromNode: 'MH-6', toNode: 'MH-10', diameter: 21, length: 360, roughness: 0.013, slope: 0.5 },
  { id: 'P-13', fromNode: 'MH-7', toNode: 'MH-11', diameter: 24, length: 350, roughness: 0.013, slope: 0.45 },
  { id: 'P-14', fromNode: 'MH-8', toNode: 'MH-11', diameter: 24, length: 380, roughness: 0.013, slope: 0.4 },
  { id: 'P-15', fromNode: 'MH-9', toNode: 'MH-10', diameter: 24, length: 340, roughness: 0.013, slope: 0.5 },
  { id: 'P-16', fromNode: 'MH-10', toNode: 'WW-1', diameter: 30, length: 320, roughness: 0.013, slope: 0.55 },
  { id: 'P-17', fromNode: 'MH-11', toNode: 'WW-1', diameter: 30, length: 380, roughness: 0.013, slope: 0.5 },
  { id: 'P-18', fromNode: 'WW-1', toNode: 'OUT-1', diameter: 36, length: 200, roughness: 0.013, slope: 0.6 },
];

export const samplePumps: NetworkPump[] = [
  { id: 'PUMP-1', fromNode: 'WW-1', toNode: 'OUT-1', capacity: 2500, onLevel: 6.0, offLevel: 2.0 },
];

// Storm hyetograph - 2-hour storm (SCS Type II)
export const stormHyetograph = [
  { time: 0, intensity: 0.1 },
  { time: 10, intensity: 0.15 },
  { time: 20, intensity: 0.25 },
  { time: 30, intensity: 0.4 },
  { time: 40, intensity: 0.6 },
  { time: 50, intensity: 0.9 },
  { time: 60, intensity: 1.5 }, // Peak
  { time: 70, intensity: 0.8 },
  { time: 80, intensity: 0.5 },
  { time: 90, intensity: 0.3 },
  { time: 100, intensity: 0.2 },
  { time: 110, intensity: 0.1 },
  { time: 120, intensity: 0.05 },
];

// Network metadata
export const networkMetadata = {
  name: "EPA Example Network 1",
  description: "Simple dendritic sanitary sewer system for demonstration",
  units: "US Customary",
  flowUnits: "MGD",
  nodeCount: sampleNodes.length,
  pipeCount: samplePipes.length,
  pumpCount: samplePumps.length,
  totalLength: samplePipes.reduce((sum, p) => sum + p.length, 0),
};
