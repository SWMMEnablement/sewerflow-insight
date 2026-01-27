// Simulation Engine - Generates realistic hydraulic results
// Uses simplified Saint-Venant equation approximations

import { 
  sampleNodes, 
  samplePipes, 
  stormHyetograph,
  NetworkNode,
  NetworkPipe,
  NodeResult,
  PipeResult 
} from '@/data/sampleNetwork';

export interface TimeStepResult {
  time: number; // minutes
  nodes: Record<string, NodeResult>;
  pipes: Record<string, PipeResult>;
  systemFlow: number; // total system flow in MGD
  peakNode: string;
  peakPipe: string;
}

export interface SimulationConfig {
  duration: number; // hours
  timeStep: number; // minutes
  stormMultiplier: number; // intensity multiplier
}

// Manning's equation for flow capacity
const manningFlow = (diameter: number, slope: number, n: number): number => {
  const r = (diameter / 12) / 4; // hydraulic radius for full pipe (ft)
  const a = Math.PI * Math.pow(diameter / 24, 2); // area (sq ft)
  const v = (1.49 / n) * Math.pow(r, 2/3) * Math.pow(slope / 100, 0.5);
  return v * a * 0.6463; // Convert cfs to MGD
};

// Generate time series results
export const runSimulation = (
  config: SimulationConfig,
  onProgress?: (progress: number, time: number) => void
): TimeStepResult[] => {
  const results: TimeStepResult[] = [];
  const totalSteps = Math.ceil((config.duration * 60) / config.timeStep);
  
  // Pre-calculate pipe capacities
  const pipeCapacities: Record<string, number> = {};
  samplePipes.forEach(pipe => {
    pipeCapacities[pipe.id] = manningFlow(pipe.diameter, pipe.slope, pipe.roughness);
  });

  // Track cumulative state
  let cumulativeDepths: Record<string, number> = {};
  sampleNodes.forEach(node => {
    cumulativeDepths[node.id] = 0.5; // Base depth
  });

  for (let step = 0; step <= totalSteps; step++) {
    const time = step * config.timeStep;
    const progress = (step / totalSteps) * 100;
    
    if (onProgress) {
      onProgress(progress, time);
    }

    // Get storm intensity at this time
    const stormTime = Math.min(time, 120);
    const stormIndex = stormHyetograph.findIndex(s => s.time >= stormTime);
    const intensity = stormIndex >= 0 
      ? stormHyetograph[stormIndex].intensity * config.stormMultiplier
      : 0.05;

    // Calculate node results
    const nodes: Record<string, NodeResult> = {};
    let peakNodeId = '';
    let peakNodeDepth = 0;

    sampleNodes.forEach((node, index) => {
      // Inflow based on position in network and storm intensity
      const baseInflow = (0.1 + (index * 0.05)) * intensity;
      
      // Depth response with lag
      const depthResponse = Math.min(
        node.maxDepth * 0.95,
        cumulativeDepths[node.id] * 0.8 + intensity * 2.5
      );
      cumulativeDepths[node.id] = depthResponse;
      
      // HGL = invert + depth
      const hgl = node.invertElevation + depthResponse;
      
      // Surcharge when depth exceeds available depth
      const isSurcharged = depthResponse > (node.maxDepth * 0.85);
      
      // Flooding when HGL exceeds rim
      const flooding = hgl > node.rimElevation 
        ? (hgl - node.rimElevation) * 0.5 
        : 0;

      nodes[node.id] = {
        depth: Math.round(depthResponse * 100) / 100,
        hgl: Math.round(hgl * 100) / 100,
        inflow: Math.round(baseInflow * 1000) / 1000,
        flooding: Math.round(flooding * 1000) / 1000,
        isSurcharged
      };

      if (depthResponse > peakNodeDepth) {
        peakNodeDepth = depthResponse;
        peakNodeId = node.id;
      }
    });

    // Calculate pipe results
    const pipes: Record<string, PipeResult> = {};
    let peakPipeId = '';
    let peakPipeCapacity = 0;
    let totalFlow = 0;

    samplePipes.forEach((pipe, index) => {
      const capacity = pipeCapacities[pipe.id];
      
      // Flow based on upstream depth and storm intensity
      const upstreamNode = nodes[pipe.fromNode];
      const depthFactor = upstreamNode ? upstreamNode.depth / 8 : 0.5;
      const flow = capacity * depthFactor * (0.6 + intensity * 0.4);
      
      // Velocity from Q = VA
      const area = Math.PI * Math.pow(pipe.diameter / 24, 2);
      const velocity = (flow / 0.6463) / area; // Convert back to ft/s
      
      // Capacity utilization
      const utilization = Math.min(100, (flow / capacity) * 100);
      
      // Surcharge when > 90% capacity
      const isSurcharged = utilization > 90;

      pipes[pipe.id] = {
        flow: Math.round(flow * 1000) / 1000,
        velocity: Math.round(velocity * 100) / 100,
        capacity: Math.round(utilization),
        isSurcharged
      };

      totalFlow += flow;

      if (utilization > peakPipeCapacity) {
        peakPipeCapacity = utilization;
        peakPipeId = pipe.id;
      }
    });

    results.push({
      time,
      nodes,
      pipes,
      systemFlow: Math.round(totalFlow * 100) / 100,
      peakNode: peakNodeId,
      peakPipe: peakPipeId
    });
  }

  return results;
};

// Get summary statistics from results
export const getResultsSummary = (results: TimeStepResult[]) => {
  let maxFlow = 0;
  let maxVelocity = 0;
  let surchargeCount = 0;
  let floodedNodes: string[] = [];
  
  const surchargePipes = new Set<string>();
  const surchargeManholes: Array<{id: string; maxDepth: number; duration: number}> = [];
  const manholeFloodDuration: Record<string, number> = {};

  results.forEach(result => {
    Object.entries(result.pipes).forEach(([id, pipe]) => {
      if (pipe.flow > maxFlow) maxFlow = pipe.flow;
      if (pipe.velocity > maxVelocity) maxVelocity = pipe.velocity;
      if (pipe.isSurcharged) surchargePipes.add(id);
    });

    Object.entries(result.nodes).forEach(([id, node]) => {
      if (node.flooding > 0) {
        if (!floodedNodes.includes(id)) floodedNodes.push(id);
      }
      if (node.isSurcharged) {
        manholeFloodDuration[id] = (manholeFloodDuration[id] || 0) + 5; // 5 min timestep
      }
    });
  });

  // Get most surcharged manholes
  Object.entries(manholeFloodDuration)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([id, duration]) => {
      const maxDepth = Math.max(...results.map(r => r.nodes[id]?.depth || 0));
      surchargeManholes.push({ id, maxDepth, duration });
    });

  return {
    peakFlow: maxFlow,
    maxVelocity,
    surchargeCount: surchargePipes.size,
    floodedNodes,
    surchargeManholes,
    systemStatus: surchargePipes.size > 3 ? 'Critical' : surchargePipes.size > 0 ? 'Warning' : 'Stable'
  };
};

// Get time series for a specific pipe
export const getPipeTimeSeries = (results: TimeStepResult[], pipeId: string) => {
  return results.map(r => ({
    time: r.time,
    flow: r.pipes[pipeId]?.flow || 0,
    velocity: r.pipes[pipeId]?.velocity || 0,
    capacity: r.pipes[pipeId]?.capacity || 0
  }));
};

// Get time series for a specific node
export const getNodeTimeSeries = (results: TimeStepResult[], nodeId: string) => {
  return results.map(r => ({
    time: r.time,
    depth: r.nodes[nodeId]?.depth || 0,
    hgl: r.nodes[nodeId]?.hgl || 0,
    inflow: r.nodes[nodeId]?.inflow || 0
  }));
};
