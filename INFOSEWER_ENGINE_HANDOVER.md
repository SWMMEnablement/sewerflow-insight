# InfoSewer Engine — Project Handover Document

> **Generated:** 2026-02-12  
> **Version:** Beta  
> **Published URL:** https://sewerflow-insight.lovable.app  
> **Repository:** https://lovable.dev/projects/8b84bdf4-eab1-45fd-be53-02415ce1ff2e

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [File Structure](#file-structure)
5. [Data Models & Interfaces](#data-models--interfaces)
6. [Simulation Engine](#simulation-engine)
7. [Components Deep Dive](#components-deep-dive)
8. [Design System](#design-system)
9. [SWMM INP File Parser](#swmm-inp-file-parser)
10. [State Management](#state-management)
11. [Features Implemented](#features-implemented)
12. [Known Limitations](#known-limitations)
13. [Dependencies](#dependencies)
14. [Getting Started](#getting-started)
15. [Extension Points](#extension-points)

---

## Project Overview

**InfoSewer Engine** is a browser-based hydraulic analysis and simulation platform for sanitary sewer networks. It provides:

- Interactive network visualization (canvas-based) with click-to-inspect nodes/pipes
- Hydraulic simulation using Manning's equation and Saint-Venant equation approximations
- EPA SWMM `.inp` file import/export
- Scenario comparison mode (side-by-side with delta analysis)
- Time-slider playback to scrub through simulation results
- Dark/light theme support
- Report export (text format)
- Guided workflow for new users

**Target Users:** Civil/environmental engineers, students, municipal utility staff performing preliminary sewer capacity analysis.

**Disclaimer:** This is a demonstration/educational tool. Results should not be used for final engineering design without validation.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | ^18.3.1 |
| Build Tool | Vite | — |
| Language | TypeScript | — |
| Styling | Tailwind CSS | — |
| UI Components | shadcn/ui (Radix primitives) | — |
| Charts | Recharts | ^2.15.4 |
| Routing | React Router DOM | ^6.30.1 |
| Theme | next-themes | ^0.3.0 |
| State | React useState/useCallback (no external store) | — |
| Animations | tailwindcss-animate | ^1.0.7 |

**No backend required.** All computation runs client-side in the browser.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     App.tsx                              │
│  ThemeProvider → TooltipProvider → Router                │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  pages/Index.tsx │  ← Main orchestrator
              │  (state hub)    │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────────┐
        │              │                  │
   Left Sidebar    Main Panel        Inspector
   ┌──────────┐  ┌────────────┐    ┌──────────────┐
   │Guided    │  │NetworkView │    │Property      │
   │Workflow  │  │ResultsView │    │Inspector     │
   │Simulation│  │InputData   │    │(contextual)  │
   │Panel     │  │Panel       │    └──────────────┘
   └──────────┘  │TimeSlider  │
                 └────────────┘
                       │
              ┌────────▼────────┐
              │ simulationEngine│  ← Pure computation
              │ inpParser       │  ← File parsing
              └─────────────────┘
```

### Data Flow

1. **Network data** (`nodes`, `pipes`, `pumps`) lives in `Index.tsx` state
2. **User configures** simulation parameters via `SimulationPanel`
3. **Simulation runs** via `runSimulation()` from `simulationEngine.ts`
4. **Results** (`TimeStepResult[]`) stored in `Index.tsx` state
5. **All views** receive results as props and render accordingly
6. **TimeSlider** controls `currentStep` to scrub through time
7. **PropertyInspector** shows details for clicked node/pipe at `currentStep`

---

## File Structure

```
src/
├── pages/
│   ├── Index.tsx              # Main page — state orchestrator (340 lines)
│   └── NotFound.tsx           # 404 page
├── components/
│   ├── NetworkView.tsx        # Canvas-based network visualization (445 lines)
│   ├── SimulationPanel.tsx    # Simulation controls & network stats (213 lines)
│   ├── ResultsView.tsx        # Charts, tables, summary cards (354 lines)
│   ├── InputDataPanel.tsx     # SWMM import, drag-drop, forms (409 lines)
│   ├── PropertyInspector.tsx  # Node/pipe detail sidebar (322 lines)
│   ├── GuidedWorkflow.tsx     # 5-step onboarding guide (119 lines)
│   ├── ComparisonMode.tsx     # Side-by-side scenario comparison (314 lines)
│   ├── TechDetailsModal.tsx   # Technical documentation dialog (236 lines)
│   ├── TimeSlider.tsx         # Playback controls with speed (208 lines)
│   ├── ThemeToggle.tsx        # Light/dark/system theme switcher (38 lines)
│   └── ui/                   # shadcn/ui primitives (do not edit directly)
├── lib/
│   ├── simulationEngine.ts   # Hydraulic simulation logic (240 lines)
│   ├── inpParser.ts          # EPA SWMM .inp file parser (422 lines)
│   └── utils.ts              # Tailwind merge utility
├── data/
│   └── sampleNetwork.ts      # Pre-loaded EPA example network (125 lines)
├── hooks/
│   ├── use-toast.ts           # Toast notification hook
│   └── use-mobile.tsx         # Mobile detection hook
├── index.css                  # Design system tokens (HSL colors, gradients, shadows)
├── App.tsx                    # Root component with providers
├── App.css                    # Minimal global styles
└── main.tsx                   # Entry point
```

---

## Data Models & Interfaces

### Network Elements (`src/data/sampleNetwork.ts`)

```typescript
interface NetworkNode {
  id: string;                  // e.g., "MH-1"
  x: number;                   // Canvas X position (pixels)
  y: number;                   // Canvas Y position (pixels)
  type: 'manhole' | 'wetwell' | 'outfall';
  label: string;
  elevation: number;           // Ground elevation (ft)
  rimElevation: number;        // Rim elevation (ft)
  invertElevation: number;     // Invert elevation (ft)
  maxDepth: number;            // Max depth (ft)
}

interface NetworkPipe {
  id: string;                  // e.g., "P-1"
  fromNode: string;            // Upstream node ID
  toNode: string;              // Downstream node ID
  diameter: number;            // Inches
  length: number;              // Feet
  roughness: number;           // Manning's n coefficient
  slope: number;               // Percent
}

interface NetworkPump {
  id: string;
  fromNode: string;
  toNode: string;
  capacity: number;            // GPM
  onLevel: number;             // Startup depth (ft)
  offLevel: number;            // Shutoff depth (ft)
}
```

### Simulation Results (`src/lib/simulationEngine.ts`)

```typescript
interface TimeStepResult {
  time: number;                // Minutes from start
  nodes: Record<string, NodeResult>;
  pipes: Record<string, PipeResult>;
  systemFlow: number;          // Total system flow (MGD)
  peakNode: string;            // ID of peak depth node
  peakPipe: string;            // ID of peak capacity pipe
}

interface NodeResult {
  depth: number;               // Water depth (ft)
  hgl: number;                 // Hydraulic grade line (ft)
  inflow: number;              // Inflow rate (MGD)
  flooding: number;            // Flooding volume (MGD)
  isSurcharged: boolean;
}

interface PipeResult {
  flow: number;                // Flow rate (MGD)
  velocity: number;            // Flow velocity (ft/s)
  capacity: number;            // Capacity utilization (%)
  isSurcharged: boolean;
}

interface SimulationConfig {
  duration: number;            // Hours
  timeStep: number;            // Minutes (default: 5)
  stormMultiplier: number;     // Intensity multiplier (0.5–3.0)
}
```

---

## Simulation Engine

**File:** `src/lib/simulationEngine.ts`

### Core Algorithm

1. **Manning's Equation** calculates pipe flow capacity:
   ```
   Q = (1.49/n) × A × R^(2/3) × S^(1/2)
   ```
   - Converts CFS to MGD (× 0.6463)
   - Uses full-pipe hydraulic radius: R = D/4

2. **Time-stepping loop:**
   - Iterates from t=0 to t=duration at configured timestep
   - Applies SCS Type II storm hyetograph (defined in `sampleNetwork.ts`)
   - Storm intensity scaled by `stormMultiplier`
   - Node depth calculated with lag response and cumulative tracking
   - HGL = invert elevation + depth
   - Surcharge triggered when depth > 85% of max depth
   - Flooding occurs when HGL > rim elevation
   - Pipe flow derived from upstream node depth and storm intensity

3. **Key functions:**
   - `runSimulation(config, onProgress?, networkData?)` → `TimeStepResult[]`
   - `getResultsSummary(results)` → peak flow, max velocity, surcharge counts, surcharged manhole rankings
   - `getPipeTimeSeries(results, pipeId)` → time series for a specific pipe
   - `getNodeTimeSeries(results, nodeId)` → time series for a specific node

### Storm Hyetograph

Pre-defined 2-hour SCS Type II storm with 13 data points:
- Ramps from 0.1 to peak 1.5 at t=60 min
- Recedes to 0.05 at t=120 min
- Multiplied by `stormMultiplier` config

---

## Components Deep Dive

### NetworkView (`src/components/NetworkView.tsx`)

- **Renderer:** HTML5 Canvas (not SVG/DOM)
- **Features:**
  - Draws pipes as colored lines (green/blue/yellow/red based on capacity %)
  - Draws nodes as circles with depth-fill indicators
  - Flow direction arrows at pipe midpoints
  - Flooding glow effect (red aura) on flooded nodes
  - Animated flow dots during active simulation
  - Hover detection with cursor change
  - Click detection for both nodes (distance < 18px) and pipes (point-to-line distance < 10px)
  - Zoom controls (0.6x–2.0x)
  - Legend overlay (static + capacity colors when results exist)
- **Canvas background:** White (`bg-white`) — hardcoded, does NOT respect dark theme
- **Text colors:** Hardcoded `#1e293b` — **needs update for dark mode**

### SimulationPanel (`src/components/SimulationPanel.tsx`)

- Analysis type selector (Dynamic EPS, Static, Design — only Dynamic is implemented)
- Duration slider (1–6 hours)
- Storm intensity slider (0.5x–3.0x)
- Time step selector (1/5/15 min — only 5 min is wired up)
- Run/Stop button
- Progress indicator during simulation
- Network statistics card (reads from `networkMetadata`)

### ResultsView (`src/components/ResultsView.tsx`)

- **Summary cards:** Peak Flow, Max Velocity, Surcharged Pipes, System Status
- **System Flow chart:** AreaChart (Recharts) showing total flow over time
- **Pipe results table:** Sortable by capacity, clickable rows to select pipe
- **Surcharged manholes table:** Top 10 ranked by surcharge duration
- **Pipe time series graph:** LineChart with dual Y-axes (Flow MGD + Capacity %)
- **Export:** Generates plain text report downloadable as `.txt`

### InputDataPanel (`src/components/InputDataPanel.tsx`)

- **Import options:**
  - File browser button (accepts `.inp`, `.txt`)
  - Drag-and-drop zone
  - "Load Sample" button (resets to built-in EPA network)
  - "Download Sample INP" (generates downloadable `.inp` file)
- **Status indicators:** Success (green) with node/pipe/pump counts, Error (red)
- **Parse warnings** displayed (max 5, with overflow count)
- **Manual entry forms** (Pipes, Manholes, Pumps) — UI only, not wired to state

### PropertyInspector (`src/components/PropertyInspector.tsx`)

- **Contextual sidebar** (280px wide) that appears when a node or pipe is clicked
- **Node view:** Static properties (rim/invert elevation, max depth, connections), current simulation results (depth, HGL, inflow, surcharge status, flooding), depth-over-time mini chart
- **Pipe view:** Static properties (from/to nodes, diameter, length, slope, Manning's n), current results (flow, velocity, capacity bar, surcharge status), flow & velocity mini chart

### ComparisonMode (`src/components/ComparisonMode.tsx`)

- **Full-screen overlay** (fixed positioning with z-50)
- **Two-column layout:** Scenario A (Baseline) vs Scenario B (Alternative)
- **Configurable per scenario:** Storm intensity (0.5–3.0x), Duration (1–6h)
- **Runs both simulations sequentially** with progress indicator
- **Delta indicators:** Shows % change between A and B for peak flow, max velocity, surcharged pipes, flooded nodes
- **Uses sample network only** — does not pass custom imported network to comparison runs

### TimeSlider (`src/components/TimeSlider.tsx`)

- **Playback controls:** Play/Pause, Step Back, Step Forward
- **Speed control:** 1x, 2x, 4x (cycles on click)
- **Slider:** Scrubs through all simulation time steps
- **Quick-jump buttons:** 0%, 25%, 50%, 75%, 100% positions
- **Time display:** Current time (Xh XXm) / Total time, Step N of M, progress %
- **Auto-stops** at end of results

### GuidedWorkflow (`src/components/GuidedWorkflow.tsx`)

- **5-step onboarding:** View Network → Configure Storm → Run Simulation → Review Results → Export Report
- **Collapsible** card
- **Auto-advances** based on app state (isSimulating, hasResults)

### TechDetailsModal (`src/components/TechDetailsModal.tsx`)

- **Dialog** with 3 tabs: Methodology, Equations, Limitations
- Documents Manning's equation, continuity equation, kinematic wave approximation
- Lists all known limitations and recommended/not-recommended use cases
- References EPA SWMM documentation

### ThemeToggle (`src/components/ThemeToggle.tsx`)

- **Dropdown menu** with Light, Dark, System options
- Uses `next-themes` `useTheme()` hook
- Animated sun/moon icon transition

---

## Design System

### Tokens (`src/index.css`)

All colors defined as HSL values in CSS custom properties:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | 210 20% 98% | 215 30% 10% | Page background |
| `--foreground` | 215 25% 15% | 210 20% 95% | Default text |
| `--primary` | 212 100% 45% | 212 100% 55% | Buttons, links, accents |
| `--accent` | 195 85% 45% | 195 85% 50% | Secondary accent (teal) |
| `--destructive` | 0 75% 55% | 0 70% 50% | Errors, critical alerts |
| `--success` | 142 70% 45% | 142 65% 50% | Positive indicators |
| `--warning` | 38 92% 50% | 38 90% 55% | Caution indicators |
| `--card` | 0 0% 100% | 215 28% 14% | Card backgrounds |
| `--muted` | 215 20% 95% | 215 25% 18% | Subtle backgrounds |

### Custom Extensions (`tailwind.config.ts`)

- `bg-gradient-primary` → diagonal gradient from primary to accent
- `bg-gradient-surface` → vertical gradient for page background
- `shadow-soft` / `shadow-medium` → custom box shadows
- `success`, `warning` color scales with foreground variants
- `primary-glow` for glow effects

---

## SWMM INP File Parser

**File:** `src/lib/inpParser.ts`

### Supported Sections

| Section | Fields Parsed |
|---------|--------------|
| `[JUNCTIONS]` | id, invert elevation, max depth, init depth, surcharge, ponded area |
| `[OUTFALLS]` | id, invert elevation, type |
| `[STORAGE]` | id, invert elevation, max depth, init depth, curve type, params |
| `[CONDUITS]` | id, from node, to node, length, roughness, in/out offsets |
| `[XSECTIONS]` | link id, shape, geom1–4 (diameter for CIRCULAR) |
| `[COORDINATES]` | node id, x, y |
| `[PUMPS]` | id, from node, to node, curve name |

### Coordinate Normalization

- Finds bounding box of all coordinates
- Scales to fit 500×400 pixel display area
- Flips Y-axis (SWMM uses bottom-left origin, canvas uses top-left)
- Adds 50px padding
- Falls back to random positions for nodes without coordinates

### Diameter Conversion

- CIRCULAR shape: `geom1` is in feet → multiplied by 12 to get inches
- Other shapes: assumed inches (may need adjustment)

### Slope Calculation

- Derived from upstream/downstream node invert elevations and pipe length
- `slope = |drop / length| × 100` (percent)

### Validation

- Checks that at least one node and one pipe exist
- Warns about dangling pipe references (from/to nodes not in network)
- Returns structured `{ nodes, pipes, pumps, metadata, errors, warnings }`

### Sample INP Generator

`generateSampleINP()` produces a valid 4-junction + 1-outfall + 1-storage sample network for download/testing.

---

## State Management

All application state lives in `src/pages/Index.tsx` using React `useState`:

| State Variable | Type | Purpose |
|---------------|------|---------|
| `isSimulating` | boolean | Whether simulation is actively running |
| `activeTab` | string | Current main tab (network/results/input) |
| `simulationProgress` | number | 0–100 progress percentage |
| `currentTime` | number | Current simulation time in minutes |
| `duration` | number | Configured simulation duration (hours) |
| `stormMultiplier` | number | Storm intensity multiplier |
| `simulationResults` | TimeStepResult[] | All computed time steps |
| `currentStep` | number | Currently viewed time step index |
| `selectedNode` | NetworkNode \| null | Clicked node for inspector |
| `selectedPipe` | NetworkPipe \| null | Clicked pipe for inspector |
| `showComparison` | boolean | Whether comparison modal is open |
| `nodes` | NetworkNode[] | Current network nodes (sample or imported) |
| `pipes` | NetworkPipe[] | Current network pipes |
| `pumps` | NetworkPump[] | Current network pumps |
| `currentNetworkMetadata` | NetworkMetadata | Network name, counts |

### Simulation Animation

- `runSimulation()` computes all results synchronously
- Results are animated via `setTimeout` chain (50ms per step)
- `simulationRef` (useRef) acts as cancellation token
- Animation progressively reveals results by slicing the array

---

## Features Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Network canvas visualization | ✅ Complete | Zoom, hover, click, legend, flow dots |
| Manning's equation simulation | ✅ Complete | Dendritic networks only |
| Time slider with playback | ✅ Complete | Play/pause, speed control, scrubbing |
| SWMM .inp file import | ✅ Complete | JUNCTIONS, CONDUITS, XSECTIONS, COORDINATES, OUTFALLS, STORAGE, PUMPS |
| Scenario comparison | ✅ Complete | Side-by-side with delta indicators |
| Property inspector | ✅ Complete | Node & pipe details + mini charts |
| Dark/light theme | ✅ Complete | Canvas text colors need dark mode fix |
| Guided workflow | ✅ Complete | 5-step onboarding |
| Text report export | ✅ Complete | Plain text format |
| Technical documentation | ✅ Complete | Equations, methodology, limitations |
| Drag-and-drop file import | ✅ Complete | .inp and .txt files |
| Surcharged manhole rankings | ✅ Complete | Top 10 by duration |
| System flow time series chart | ✅ Complete | Area chart |
| Pipe time series chart | ✅ Complete | Dual-axis line chart |

---

## Known Limitations

### Simulation Engine
- **Dendritic networks only** — no looped networks (flow split logic not implemented)
- Simplified Saint-Venant equations (kinematic wave approximation)
- No backwater effects between connected pipes
- Pump representation is simplified (on/off control only)
- Pressure flow (surcharge) uses simplified approximation
- No water quality modeling
- Maximum recommended network size: ~500 nodes, ~500 pipes
- Static analysis and Design run modes are **not implemented** (UI exists but only Dynamic EPS works)
- Time step selector in SimulationPanel is **not wired** — always uses 5 min

### UI / UX
- Canvas text colors are hardcoded (`#1e293b`, `#475569`) — **do not adapt to dark mode**
- Canvas background is hardcoded `bg-white` — **does not respect dark theme**
- Manual entry forms in InputDataPanel (Add Pipe, Add Manhole, Add Pump) are **UI-only — not connected to state**
- ComparisonMode always uses sample network — **does not use imported network**
- NetworkView canvas is not responsive (fixed 520px height)
- No undo/redo
- No network editing (visual node/pipe creation)

### Parser
- Only CIRCULAR cross-section shape properly handles diameter conversion
- Pump capacity defaults to 2500 GPM (ignores pump curves)
- No INFLOWS section parsing (external inflow hydrographs)
- No RAINGAGES section parsing

---

## Dependencies

### Production Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "recharts": "^2.15.4",
  "next-themes": "^0.3.0",
  "@tanstack/react-query": "^5.83.0",
  "lucide-react": "^0.462.0",
  "sonner": "^1.7.4",
  "tailwind-merge": "^2.6.0",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^3.6.0",
  "zod": "^3.25.76",
  "react-hook-form": "^7.61.1",
  "@hookform/resolvers": "^3.10.0",
  "cmdk": "^1.1.1",
  "vaul": "^0.9.9",
  "input-otp": "^1.4.2",
  "embla-carousel-react": "^8.6.0",
  "react-day-picker": "^8.10.1",
  "react-resizable-panels": "^2.1.9"
}
```

### Radix UI Primitives (used by shadcn/ui)

accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip

### Notes
- `@tanstack/react-query` is installed but **not actively used** for data fetching (no backend)
- Many shadcn/ui components are installed but unused — could be pruned
- `react-hook-form`, `zod`, `@hookform/resolvers` are installed but forms are not fully wired

---

## Getting Started

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <PROJECT_DIR>

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Requirements
- Node.js 18+ (or Bun)
- No environment variables needed
- No backend/database required
- No API keys needed

---

## Extension Points

### Adding Looped Network Support
- Modify `runSimulation()` in `simulationEngine.ts` to implement flow-split logic at nodes with multiple downstream pipes
- Would require iterative solver for flow distribution

### Adding Backend Persistence
- Enable Lovable Cloud / Supabase for user accounts and saved networks
- Store simulation results in database for historical comparison

### PDF Report Export
- Replace current text export with a PDF library (e.g., jsPDF, @react-pdf/renderer)
- Include charts, network diagram screenshot, tables

### Real-time SCADA Integration
- Would require WebSocket connection to SCADA system
- Map SCADA sensor IDs to network node IDs
- Display real-time vs. modeled values

### Network Editor
- Add visual drag-to-create-node, click-to-connect-pipe UI on canvas
- Would need canvas pan/zoom refactor and proper hit-testing

### Additional INP Sections
- `[INFLOWS]` — external inflow time series
- `[RAINGAGES]` — rainfall data sources
- `[DWF]` — dry weather flow patterns
- `[CURVES]` — pump curves, storage curves
- `[CONTROLS]` — rule-based control logic

### Performance
- For large networks (>200 nodes), consider Web Workers for simulation computation
- Canvas rendering could use offscreen canvas or WebGL for networks >500 elements

---

## Key Code Patterns

### Simulation callback pattern
```typescript
const results = runSimulation(config, (progress, time) => {
  setSimulationProgress(progress);
  setCurrentTime(time);
}, { nodes, pipes });
```

### Network import callback
```typescript
const handleNetworkImport = (nodes, pipes, pumps, metadata) => {
  setNodes(nodes);
  setPipes(pipes);
  setPumps(pumps);
  setCurrentNetworkMetadata(metadata);
  setSimulationResults([]);  // Clear old results
};
```

### Canvas hit-testing (point-to-line distance)
```typescript
const lineLen = Math.sqrt((to.x - from.x)**2 + (to.y - from.y)**2);
const t = Math.max(0, Math.min(1, 
  ((x - from.x)*(to.x - from.x) + (y - from.y)*(to.y - from.y)) / (lineLen * lineLen)
));
const projX = from.x + t * (to.x - from.x);
const projY = from.y + t * (to.y - from.y);
const distance = Math.sqrt((x - projX)**2 + (y - projY)**2);
```

---

*End of Handover Document*
