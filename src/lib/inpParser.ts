// EPA SWMM .inp file parser
// Parses JUNCTIONS, CONDUITS, OUTFALLS, STORAGE, PUMPS, and COORDINATES sections

import { NetworkNode, NetworkPipe, NetworkPump } from '@/data/sampleNetwork';

interface ParseResult {
  nodes: NetworkNode[];
  pipes: NetworkPipe[];
  pumps: NetworkPump[];
  metadata: {
    name: string;
    description: string;
    nodeCount: number;
    pipeCount: number;
    pumpCount: number;
  };
  errors: string[];
  warnings: string[];
}

interface RawJunction {
  id: string;
  invert: number;
  maxDepth: number;
  initDepth: number;
  surcharge: number;
  ponded: number;
}

interface RawConduit {
  id: string;
  from: string;
  to: string;
  length: number;
  roughness: number;
  inOffset: number;
  outOffset: number;
}

interface RawXSection {
  link: string;
  shape: string;
  geom1: number; // diameter for circular
  geom2: number;
  geom3: number;
  geom4: number;
}

interface RawCoordinate {
  node: string;
  x: number;
  y: number;
}

interface RawOutfall {
  id: string;
  invert: number;
  type: string;
}

interface RawStorage {
  id: string;
  invert: number;
  maxDepth: number;
  initDepth: number;
  curve: string;
  params: number[];
}

interface RawPump {
  id: string;
  from: string;
  to: string;
  curve: string;
}

export const parseINPFile = (content: string): ParseResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const lines = content.split('\n').map(l => l.trim());
  
  // Parse sections
  const junctions: RawJunction[] = [];
  const conduits: RawConduit[] = [];
  const xsections: RawXSection[] = [];
  const coordinates: RawCoordinate[] = [];
  const outfalls: RawOutfall[] = [];
  const storages: RawStorage[] = [];
  const pumps: RawPump[] = [];
  
  let currentSection = '';
  let lineNumber = 0;
  
  for (const line of lines) {
    lineNumber++;
    
    // Skip empty lines and comments
    if (!line || line.startsWith(';')) continue;
    
    // Check for section header
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1).toUpperCase();
      continue;
    }
    
    // Parse based on current section
    const parts = line.split(/\s+/).filter(p => p && !p.startsWith(';'));
    if (parts.length === 0) continue;
    
    try {
      switch (currentSection) {
        case 'JUNCTIONS':
          if (parts.length >= 2) {
            junctions.push({
              id: parts[0],
              invert: parseFloat(parts[1]) || 0,
              maxDepth: parseFloat(parts[2]) || 10,
              initDepth: parseFloat(parts[3]) || 0,
              surcharge: parseFloat(parts[4]) || 0,
              ponded: parseFloat(parts[5]) || 0,
            });
          }
          break;
          
        case 'OUTFALLS':
          if (parts.length >= 2) {
            outfalls.push({
              id: parts[0],
              invert: parseFloat(parts[1]) || 0,
              type: parts[2] || 'FREE',
            });
          }
          break;
          
        case 'STORAGE':
          if (parts.length >= 4) {
            storages.push({
              id: parts[0],
              invert: parseFloat(parts[1]) || 0,
              maxDepth: parseFloat(parts[2]) || 15,
              initDepth: parseFloat(parts[3]) || 0,
              curve: parts[4] || 'FUNCTIONAL',
              params: parts.slice(5).map(p => parseFloat(p) || 0),
            });
          }
          break;
          
        case 'CONDUITS':
          if (parts.length >= 4) {
            conduits.push({
              id: parts[0],
              from: parts[1],
              to: parts[2],
              length: parseFloat(parts[3]) || 100,
              roughness: parseFloat(parts[4]) || 0.013,
              inOffset: parseFloat(parts[5]) || 0,
              outOffset: parseFloat(parts[6]) || 0,
            });
          }
          break;
          
        case 'XSECTIONS':
          if (parts.length >= 3) {
            xsections.push({
              link: parts[0],
              shape: parts[1],
              geom1: parseFloat(parts[2]) || 1,
              geom2: parseFloat(parts[3]) || 0,
              geom3: parseFloat(parts[4]) || 0,
              geom4: parseFloat(parts[5]) || 0,
            });
          }
          break;
          
        case 'COORDINATES':
          if (parts.length >= 3) {
            coordinates.push({
              node: parts[0],
              x: parseFloat(parts[1]) || 0,
              y: parseFloat(parts[2]) || 0,
            });
          }
          break;
          
        case 'PUMPS':
          if (parts.length >= 4) {
            pumps.push({
              id: parts[0],
              from: parts[1],
              to: parts[2],
              curve: parts[3] || '',
            });
          }
          break;
      }
    } catch (e) {
      warnings.push(`Line ${lineNumber}: Could not parse "${line.substring(0, 50)}..."`);
    }
  }
  
  // Build coordinate map
  const coordMap = new Map<string, { x: number; y: number }>();
  coordinates.forEach(c => coordMap.set(c.node, { x: c.x, y: c.y }));
  
  // Normalize coordinates to fit display area
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  coordinates.forEach(c => {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y);
    maxY = Math.max(maxY, c.y);
  });
  
  const scaleX = maxX - minX > 0 ? 500 / (maxX - minX) : 1;
  const scaleY = maxY - minY > 0 ? 400 / (maxY - minY) : 1;
  const scale = Math.min(scaleX, scaleY);
  
  const normalizeCoord = (node: string): { x: number; y: number } => {
    const coord = coordMap.get(node);
    if (coord) {
      return {
        x: (coord.x - minX) * scale + 50,
        y: (maxY - coord.y) * scale + 50, // Flip Y axis
      };
    }
    // Generate position if not found
    return { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 };
  };
  
  // Build xsection map
  const xsectionMap = new Map<string, RawXSection>();
  xsections.forEach(xs => xsectionMap.set(xs.link, xs));
  
  // Convert to NetworkNode format
  const nodes: NetworkNode[] = [];
  
  // Add junctions as manholes
  junctions.forEach(j => {
    const pos = normalizeCoord(j.id);
    nodes.push({
      id: j.id,
      x: pos.x,
      y: pos.y,
      type: 'manhole',
      label: j.id,
      elevation: j.invert + j.maxDepth,
      rimElevation: j.invert + j.maxDepth,
      invertElevation: j.invert,
      maxDepth: j.maxDepth || 10,
    });
  });
  
  // Add outfalls
  outfalls.forEach(o => {
    const pos = normalizeCoord(o.id);
    nodes.push({
      id: o.id,
      x: pos.x,
      y: pos.y,
      type: 'outfall',
      label: o.id,
      elevation: o.invert + 2,
      rimElevation: o.invert + 2,
      invertElevation: o.invert,
      maxDepth: 2,
    });
  });
  
  // Add storage units as wet wells
  storages.forEach(s => {
    const pos = normalizeCoord(s.id);
    nodes.push({
      id: s.id,
      x: pos.x,
      y: pos.y,
      type: 'wetwell',
      label: s.id,
      elevation: s.invert + s.maxDepth,
      rimElevation: s.invert + s.maxDepth,
      invertElevation: s.invert,
      maxDepth: s.maxDepth || 15,
    });
  });
  
  // Convert conduits to NetworkPipe format
  const pipes: NetworkPipe[] = conduits.map(c => {
    const xs = xsectionMap.get(c.id);
    // Convert diameter: if shape is CIRCULAR, geom1 is in feet, convert to inches
    let diameter = 12; // default
    if (xs) {
      if (xs.shape === 'CIRCULAR') {
        diameter = xs.geom1 * 12; // feet to inches
      } else {
        diameter = xs.geom1; // assume inches for other shapes
      }
    }
    
    // Calculate slope from upstream/downstream nodes
    const fromNode = nodes.find(n => n.id === c.from);
    const toNode = nodes.find(n => n.id === c.to);
    let slope = 0.5; // default
    if (fromNode && toNode && c.length > 0) {
      const drop = fromNode.invertElevation - toNode.invertElevation;
      slope = (drop / c.length) * 100;
    }
    
    return {
      id: c.id,
      fromNode: c.from,
      toNode: c.to,
      diameter: Math.round(diameter * 10) / 10,
      length: c.length,
      roughness: c.roughness || 0.013,
      slope: Math.round(Math.abs(slope) * 1000) / 1000,
    };
  });
  
  // Convert pumps
  const networkPumps: NetworkPump[] = pumps.map(p => ({
    id: p.id,
    fromNode: p.from,
    toNode: p.to,
    capacity: 2500, // default capacity in GPM
    onLevel: 6.0,
    offLevel: 2.0,
  }));
  
  // Validate connectivity
  const nodeIds = new Set(nodes.map(n => n.id));
  pipes.forEach(p => {
    if (!nodeIds.has(p.fromNode)) {
      warnings.push(`Pipe ${p.id}: From node "${p.fromNode}" not found in network`);
    }
    if (!nodeIds.has(p.toNode)) {
      warnings.push(`Pipe ${p.id}: To node "${p.toNode}" not found in network`);
    }
  });
  
  if (nodes.length === 0) {
    errors.push('No nodes found in the INP file. Check that [JUNCTIONS] section exists.');
  }
  
  if (pipes.length === 0 && conduits.length === 0) {
    errors.push('No pipes/conduits found in the INP file. Check that [CONDUITS] section exists.');
  }
  
  return {
    nodes,
    pipes,
    pumps: networkPumps,
    metadata: {
      name: 'Imported Network',
      description: `Imported from INP file`,
      nodeCount: nodes.length,
      pipeCount: pipes.length,
      pumpCount: networkPumps.length,
    },
    errors,
    warnings,
  };
};

// Generate sample INP content for demo purposes
export const generateSampleINP = (): string => {
  return `[TITLE]
;;Project Title/Notes
Sample SWMM Network - Educational Example

[OPTIONS]
;;Option             Value
FLOW_UNITS           MGD
INFILTRATION         HORTON
FLOW_ROUTING         DYNWAVE
LINK_OFFSETS         DEPTH
MIN_SLOPE            0
ALLOW_PONDING        NO

[JUNCTIONS]
;;Name           Elevation  MaxDepth   InitDepth  SurDepth   Ponded
J1               125.0      8.0        0          0          0
J2               122.0      8.0        0          0          0
J3               120.0      8.0        0          0          0
J4               118.0      10.0       0          0          0

[OUTFALLS]
;;Name           Elevation  Type       Stage Data       Gated    Route To
Outfall          100.0      FREE                        NO

[STORAGE]
;;Name           Elev.      MaxDepth   InitDepth  Shape      Curve Name/Params
Tank1            105.0      15.0       0          FUNCTIONAL 1000 0 0

[CONDUITS]
;;Name           From Node        To Node          Length     Roughness  InOffset   OutOffset
C1               J1               J2               400        0.013      0          0
C2               J2               J3               350        0.013      0          0
C3               J3               J4               380        0.013      0          0
C4               J4               Tank1            300        0.013      0          0
C5               Tank1            Outfall          200        0.013      0          0

[XSECTIONS]
;;Link           Shape        Geom1            Geom2      Geom3      Geom4
C1               CIRCULAR     1.0              0          0          0
C2               CIRCULAR     1.25             0          0          0
C3               CIRCULAR     1.5              0          0          0
C4               CIRCULAR     2.0              0          0          0
C5               CIRCULAR     2.5              0          0          0

[COORDINATES]
;;Node           X-Coord            Y-Coord
J1               100                400
J2               200                350
J3               300                280
J4               400                200
Tank1            350                100
Outfall          500                50

[PUMPS]
;;Name           From Node        To Node          Pump Curve
`;
};
