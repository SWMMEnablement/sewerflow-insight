# InfoSewer Engine — Complete Project Handover Document

> **Generated:** 2026-03-08  
> **Version:** Beta 2.0  
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
8. [Network Editor](#network-editor)
9. [Design System](#design-system)
10. [SWMM INP File Parser](#swmm-inp-file-parser)
11. [State Management](#state-management)
12. [Features Implemented](#features-implemented)
13. [Known Limitations](#known-limitations)
14. [Dependencies](#dependencies)
15. [Getting Started](#getting-started)
16. [Extension Points](#extension-points)
17. [Key Code Patterns](#key-code-patterns)
18. [Migration Guide](#migration-guide)

---

## Project Overview

**InfoSewer Engine** is a browser-based hydraulic analysis and simulation platform for sanitary sewer networks. It provides:

- Interactive network visualization (HTML5 Canvas) with click-to-inspect nodes/pipes
- **Visual network editor** — add, move, connect, and delete nodes/pipes directly on canvas
- Hydraulic simulation using Manning's equation and Saint-Venant equation approximations
- EPA SWMM `.inp` file import with drag-and-drop support
- Scenario comparison mode (side-by-side with delta analysis)
- Time-slider playback to scrub through simulation results
- Dark/light theme support
- Report export (text format)
- Guided workflow for new users
- Technical documentation modal with equations and methodology

**Target Users:** Civil/environmental engineers, students, municipal utility staff performing preliminary sewer capacity analysis.

**Disclaimer:** This is a demonstration/educational tool. Results should not be used for final engineering design without validation against calibrated models.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | ^18.3.1 |
| Build Tool | Vite | latest |
| Language | TypeScript | strict mode |
| Styling | Tailwind CSS | latest |
| UI Components | shadcn/ui (Radix primitives) | latest |
| Charts | Recharts | ^2.15.4 |
| Routing | React Router DOM | ^6.30.1 |
| Theme | next-themes | ^0.3.0 |
| State | React useState/useCallback (no external store) | — |
| Animations | tailwindcss-animate | ^1.0.7 |
| Icons | Lucide React | ^0.462.0 |
| Form Validation | React Hook Form + Zod | ^7.61.1 / ^3.25.76 |

**No backend required.** All computation runs client-side in the browser. No API keys, no environment variables, no database.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     App.tsx                              │
│  ThemeProvider → QueryClientProvider → TooltipProvider   │
│  → Toaster → Sonner → BrowserRouter                     │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  pages/Index.tsx │  ← Main orchestrator & state hub
              │  (377 lines)    │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────────┐
        │              │                  │
   Left Sidebar    Main Panel        Inspector
   ┌──────────┐  ┌────────────────┐  ┌──────────────┐
   │Guided    │  │Tabs:           │  │Property      │
   │Workflow  │  │ NetworkView    │  │Inspector     │
   │Simulation│  │ ResultsView    │  │(contextual)  │
   │Panel     │  │ InputDataPanel │  └──────────────┘
   └──────────┘  │                │
                 │ NetworkEditor  │
                 │ Toolbar        │
                 │ TimeSlider     │
                 └────────────────┘
                       │
              ┌────────▼────────┐
              │ simulationEngine│  ← Pure computation (240 lines)
              │ inpParser       │  ← File parsing (422 lines)
              └─────────────────┘
```

### Data Flow

1. **Network data** (`nodes[]`, `pipes[]`, `pumps[]`) lives in `Index.tsx` state
2. **User configures** simulation parameters via `SimulationPanel`
3. **User edits network** visually via `NetworkEditorToolbar` + canvas interactions in `NetworkView`
4. **Simulation runs** synchronously via `runSimulation()` from `simulationEngine.ts`
5. **Results** (`TimeStepResult[]`) stored in `Index.tsx` state
6. **All views** receive results + network data as props and render accordingly
7. **TimeSlider** controls `currentStep` to scrub through time steps
8. **PropertyInspector** shows details for clicked node/pipe at `currentStep`
9. **Network edits** (add/move/delete nodes/pipes) clear simulation results and trigger re-render

---

## File Structure

```
src/
├── pages/
│   ├── Index.tsx                # Main page — state orchestrator (377 lines)
│   └── NotFound.tsx             # 404 page
├── components/
│   ├── NetworkView.tsx          # Canvas-based network visualization + editor (699 lines)
│   ├── NetworkEditorToolbar.tsx # Editor mode toolbar (94 lines)
│   ├── SimulationPanel.tsx      # Simulation controls & network stats (213 lines)
│   ├── ResultsView.tsx          # Charts, tables, summary cards (354 lines)
│   ├── InputDataPanel.tsx       # SWMM import, drag-drop, forms (409 lines)
│   ├── PropertyInspector.tsx    # Node/pipe detail sidebar (322 lines)
│   ├── GuidedWorkflow.tsx       # 5-step onboarding guide (119 lines)
│   ├── ComparisonMode.tsx       # Side-by-side scenario comparison (314 lines)
│   ├── TechDetailsModal.tsx     # Technical documentation dialog (236 lines)
│   ├── TimeSlider.tsx           # Playback controls with speed (208 lines)
│   ├── ThemeToggle.tsx          # Light/dark/system theme switcher (38 lines)
│   └── ui/                     # shadcn/ui primitives (do not edit directly)
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input-otp.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       └── tooltip.tsx
├── lib/
│   ├── simulationEngine.ts     # Hydraulic simulation logic (240 lines)
│   ├── inpParser.ts            # EPA SWMM .inp file parser (422 lines)
│   └── utils.ts                # Tailwind merge utility (cn function)
├── data/
│   └── sampleNetwork.ts        # Pre-loaded EPA example network (125 lines)
├── hooks/
│   ├── use-toast.ts            # Toast notification hook
│   └── use-mobile.tsx          # Mobile detection hook
├── index.css                   # Design system tokens (HSL colors, gradients, shadows)
├── App.tsx                     # Root component with providers (30 lines)
├── App.css                     # Minimal global styles
├── main.tsx                    # Entry point
└── vite-env.d.ts               # Vite type declarations

Root files:
├── INFOSEWER_ENGINE_HANDOVER.md  # This document
├── components.json               # shadcn/ui configuration
├── eslint.config.js
├── index.html                    # HTML entry point
├── package.json
├── postcss.config.js
├── tailwind.config.ts            # Tailwind design tokens & extensions
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts

public/
├── favicon.ico
├── placeholder.svg
└── robots.txt
```

---

## Data Models & Interfaces

### Network Elements (`src/data/sampleNetwork.ts`)

```typescript
interface NetworkNode {
  id: string;                  // e.g., "MH-1", "WW-1", "OUT-1"
  x: number;                   // Canvas X position (pixels, normalized)
  y: number;                   // Canvas Y position (pixels, normalized)
  type: 'manhole' | 'wetwell' | 'outfall';
  label: string;               // Display label (usually same as id)
  elevation: number;           // Ground elevation (ft)
  rimElevation: number;        // Rim elevation (ft)
  invertElevation: number;     // Invert elevation (ft)
  maxDepth: number;            // Max depth (ft) = rimElevation - invertElevation
}

interface NetworkPipe {
  id: string;                  // e.g., "P-1"
  fromNode: string;            // Upstream node ID
  toNode: string;              // Downstream node ID
  diameter: number;            // Inches
  length: number;              // Feet
  roughness: number;           // Manning's n coefficient (typically 0.013)
  slope: number;               // Percent
}

interface NetworkPump {
  id: string;                  // e.g., "PUMP-1"
  fromNode: string;            // Suction side node ID
  toNode: string;              // Discharge side node ID
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
  peakNode: string;            // ID of node with highest depth
  peakPipe: string;            // ID of pipe with highest capacity utilization
}

interface NodeResult {
  depth: number;               // Water depth (ft)
  hgl: number;                 // Hydraulic grade line (ft) = invertElevation + depth
  inflow: number;              // Inflow rate (MGD)
  flooding: number;            // Flooding volume (MGD) when HGL > rimElevation
  isSurcharged: boolean;       // True when depth > 85% of maxDepth
}

interface PipeResult {
  flow: number;                // Flow rate (MGD)
  velocity: number;            // Flow velocity (ft/s)
  capacity: number;            // Capacity utilization (0-100%)
  isSurcharged: boolean;       // True when capacity > 90%
}

interface SimulationConfig {
  duration: number;            // Hours (1-6)
  timeStep: number;            // Minutes (hardcoded to 5)
  stormMultiplier: number;     // Intensity multiplier (0.5–3.0)
}

interface NetworkData {
  nodes: NetworkNode[];
  pipes: NetworkPipe[];
}
```

### Additional Result Types (also in `sampleNetwork.ts`)

```typescript
interface SimulationResult {
  time: number;
  nodeResults: Map<string, NodeResult>;
  pipeResults: Map<string, PipeResult>;
}
```
> Note: This Map-based interface exists in `sampleNetwork.ts` but is **not used** by the simulation engine. The engine uses Record-based `TimeStepResult` instead.

---

## Simulation Engine

**File:** `src/lib/simulationEngine.ts` (240 lines)

### Core Algorithm

1. **Manning's Equation** calculates pipe full-flow capacity:
   ```
   Q = (1.49/n) × A × R^(2/3) × S^(1/2)
   ```
   - `n` = Manning's roughness coefficient
   - `A` = π × (D/24)² — cross-sectional area in sq ft (D in inches)
   - `R` = (D/12) / 4 — hydraulic radius for full pipe in ft
   - `S` = slope / 100 — converting from percent to ft/ft
   - Result converted from CFS to MGD (× 0.6463)

2. **Time-stepping loop** (`runSimulation`):
   ```
   for step = 0 to totalSteps:
     1. Get storm intensity at current time from hyetograph
     2. For each node:
        - Calculate inflow based on position and intensity
        - Update depth with lag response (cumulative tracking)
        - Compute HGL = invertElevation + depth
        - Check surcharge (depth > 85% maxDepth)
        - Check flooding (HGL > rimElevation)
     3. For each pipe:
        - Get upstream node depth
        - Calculate flow = capacity × depthFactor × intensityFactor
        - Derive velocity from Q = VA
        - Calculate capacity utilization
        - Check surcharge (utilization > 90%)
     4. Store TimeStepResult
   ```

3. **Exported functions:**

   | Function | Signature | Returns |
   |----------|-----------|---------|
   | `runSimulation` | `(config, onProgress?, networkData?) → TimeStepResult[]` | All time step results |
   | `getResultsSummary` | `(results) → { peakFlow, maxVelocity, surchargeCount, floodedNodes, surchargeManholes, systemStatus }` | Aggregate statistics |
   | `getPipeTimeSeries` | `(results, pipeId) → { time, flow, velocity, capacity }[]` | Single pipe over time |
   | `getNodeTimeSeries` | `(results, nodeId) → { time, depth, hgl, inflow }[]` | Single node over time |

### Storm Hyetograph

Pre-defined 2-hour SCS Type II storm with 13 data points in `sampleNetwork.ts`:

```
Time(min):  0   10   20   30   40   50   60   70   80   90  100  110  120
Intensity: 0.1 0.15 0.25 0.40 0.60 0.90 1.50 0.80 0.50 0.30 0.20 0.10 0.05
                                         ^^^^ Peak at 60 min
```

- Storm intensity at each time step is looked up via `stormHyetograph.findIndex(s => s.time >= stormTime)`
- For times beyond 120 min, intensity defaults to 0.05
- All intensities multiplied by `stormMultiplier` config parameter

### Cumulative Depth Tracking

Node depths are tracked cumulatively across time steps:
```typescript
cumulativeDepths[node.id] = 0.5; // Initial base depth
// Each step:
depthResponse = min(maxDepth * 0.95, cumulativeDepths[id] * 0.8 + intensity * 2.5)
cumulativeDepths[id] = depthResponse;
```

---

## Components Deep Dive

### NetworkView (`src/components/NetworkView.tsx` — 699 lines)

The largest component. Contains the HTML5 Canvas renderer and all mouse interaction logic.

**Renderer:** HTML5 Canvas (not SVG/DOM)

**Visual Elements:**
- **Pipes:** Colored lines based on capacity utilization:
  - Green (`rgba(34, 197, 94, 0.8)`) — < 50%
  - Blue (`rgba(59, 130, 246, 0.8)`) — 50-75%
  - Yellow (`rgba(251, 191, 36, 0.8)`) — 75-90%
  - Red (`rgba(239, 68, 68, 0.9)`) — > 90%
- **Flow direction arrows** at pipe midpoints
- **Animated flow dots** during active simulation (white dots moving along pipes)
- **Nodes:** Circles sized by type (manhole=12px, outfall=14px, wetwell=18px)
  - Blue (#0066CC) for manholes, Teal (#0099CC) for wet wells, Gray (#64748b) for outfalls
  - Red (#ef4444) when surcharged
  - Depth fill indicator inside node circle (blue overlay proportional to depth/maxDepth)
- **Flooding glow:** Red aura (`rgba(239, 68, 68, 0.3)`) on flooded nodes
- **Labels:** Node labels above each node (`#1e293b`, bold 11px sans-serif)
- **Background grid:** Light blue lines every 40px
- **Legend:** Top-right overlay showing node types and capacity colors

**Interactive Features:**
- **Hover detection:** Nodes (distance < 18px), Pipes (point-to-line distance < 10px)
- **Click detection:** Same thresholds as hover, triggers `onNodeClick`/`onPipeClick`
- **Zoom controls:** 0.6x to 2.0x in 0.2 increments
- **Editor mode:** See [Network Editor](#network-editor) section
- **Cursor changes:** pointer on hover, crosshair for add mode, grab/grabbing for move mode

**Coordinate System:**
- `getNodePosition(node)`: transforms node coords → `{ x: node.x * zoom + offset.x, y: node.y * zoom + offset.y }`
- `canvasToNetwork(canvasX, canvasY)`: reverse transform for editor clicks
- Default offset: `{ x: 50, y: 30 }`

**Canvas Background:** Hardcoded `bg-white` class — **does NOT respect dark theme**
**Text Colors:** Hardcoded `#1e293b`, `#475569` — **needs update for dark mode**

### NetworkEditorToolbar (`src/components/NetworkEditorToolbar.tsx` — 94 lines)

Toolbar component for the visual network editor.

**Editor Modes (EditorMode type):**
| Mode | Icon | Behavior |
|------|------|----------|
| `select` | MousePointer | Default — click to inspect nodes/pipes |
| `addNode` | Plus | Click canvas to place a new manhole |
| `move` | Move | Drag nodes to reposition them |
| `addPipe` | Link2 | Click two nodes sequentially to connect them |
| `delete` | Trash2 | Click any node or pipe to remove it |

**UI Features:**
- Toggle button switches between "Edit Network" and "Editing" states
- Tool buttons shown only when editor is active, in a muted background pill
- Each tool has a Tooltip with description
- Pending connection badge (pulsing) shown when first node selected in `addPipe` mode
- Node/pipe count displayed at right

### SimulationPanel (`src/components/SimulationPanel.tsx` — 213 lines)

Left sidebar controls for simulation configuration.

**Sections:**
1. **Simulation Control Card:**
   - Analysis type selector (Dynamic EPS / Static / Design — **only Dynamic EPS works**)
   - Duration slider (1–6 hours, step 1)
   - Storm intensity slider (0.5x–3.0x, step 0.1)
   - Time step selector (1/5/15 min — **only 5 min is actually used**)
   - Progress indicator during simulation (percentage + time display)
   - Run/Stop button (switches between Play and destructive Stop variants)

2. **Network Overview Card:**
   - Reads from imported `networkMetadata` (but currently uses `networkMetadata` constant directly)
   - Shows: Manholes count, Pipes count, Pumps count, Total Length

3. **Options Card:**
   - Report Time Step (hardcoded "5 min")
   - Flow Units (reads from `networkMetadata.flowUnits`)

**Bug:** The Network Overview section imports and reads from the static `networkMetadata` constant, not from the dynamic `currentNetworkMetadata` state. This means it doesn't update when a new network is imported.

### ResultsView (`src/components/ResultsView.tsx` — 354 lines)

Main results display with charts and tables.

**Sections:**
1. **Summary Cards (4-column grid):**
   - Peak Flow (MGD), Max Velocity (ft/s), Surcharged Pipes (count), System Status
   - Color-coded: green (success), yellow (warning > 8 ft/s or > 0 surcharges), red (> 3 surcharges)

2. **System Flow Over Time (AreaChart):**
   - Recharts AreaChart with gradient fill
   - X-axis: Time (min), Y-axis: Flow (MGD)
   - Export Report button generates downloadable `.txt` file

3. **Analysis Results (tabbed):**
   - **Pipes tab:** Sortable table with Flow, Velocity, Capacity bar, Status badge
     - Clickable rows to select pipe for time series
     - Scrollable with max-height 320px
   - **Surcharged Manholes tab:** Top 10 ranked by surcharge duration
     - Shows Rank, ID, Max Depth, Duration (min)
   - **Pipe Time Series tab:** Dual Y-axis LineChart
     - Left axis: Flow (MGD) in primary color
     - Right axis: Capacity (%) in accent color
     - Only shown when a pipe is selected from the Pipes tab

**Export format (plain text):**
```
INFOSEWER ENGINE - SIMULATION REPORT
=====================================
Generated: [timestamp]
SUMMARY: Peak Flow, Max Velocity, Surcharged Pipes, System Status
TOP 10 SURCHARGED MANHOLES: ID, Max Depth, Duration
PIPE RESULTS: ID, Flow, Velocity, Capacity (top 10)
```

### InputDataPanel (`src/components/InputDataPanel.tsx` — 409 lines)

Data management and import interface.

**Import Section:**
- "Import INP File" button → opens file browser (accepts `.inp`, `.txt`)
- "Load Sample" button → resets to built-in EPA Example Network 1
- Drag-and-drop zone with visual indicator
- "Download Sample INP" → generates valid EPA SWMM `.inp` file for testing
- "Export Data" button (stub — shows toast but doesn't export network data)

**Import Status Indicators:**
- Success: Green border/background with CheckCircle2 icon, showing node/pipe/pump counts
- Error: Red border/background with AlertCircle icon
- Parse warnings listed (max 5 shown, overflow count)

**Manual Entry Forms (tabbed — NOT wired to state):**
- **Pipes:** ID, Diameter, Length, Material (dropdown), Roughness, Slope
- **Manholes:** ID, Ground Elevation, Invert Elevation, Max Depth, Initial Depth, Ponded Area
- **Pumps:** ID, Pump Type (dropdown), Capacity, Startup Depth, Shutoff Depth, Initial Status

### PropertyInspector (`src/components/PropertyInspector.tsx` — 322 lines)

Contextual sidebar that appears when a node or pipe is clicked.

**Rendering:** 280px wide Card with left border accent (primary for nodes, accent for pipes)

**Node View:**
- Header: Node label + type badge (Manhole/Wet Well/Outfall)
- Properties grid: Rim Elevation, Invert, Max Depth, Connections count
- Current Results (if simulation ran): Depth, HGL, Inflow, Status badge, Flooding warning
- Depth Over Time mini chart (LineChart, 128px height)

**Pipe View:**
- Header: Pipe ID + "Conduit" badge
- Properties grid: From/To nodes, Diameter, Length, Slope, Manning's n
- Current Results: Flow, Velocity, Capacity bar (colored by threshold), Status badge
- Flow & Velocity mini chart (dual-axis LineChart, 144px height)

### ComparisonMode (`src/components/ComparisonMode.tsx` — 314 lines)

Full-screen overlay for side-by-side scenario comparison.

**Layout:** Fixed position card (`inset-4 z-50`) with header, two-column body, and footer

**Scenario Configuration (per scenario):**
- Storm Intensity slider (0.5x–3.0x)
- Duration slider (1–6h, step 0.5)

**Execution:**
- Runs both simulations sequentially with `setTimeout` delays (500ms between)
- Progress bar (0% → 50% → 100%)
- **Always uses sample network** — does NOT pass imported/edited network data

**Results Display:**
- 2×2 grid per scenario: Peak Flow, Max Velocity, Surcharged Pipes, Flooded Nodes
- System Status badge
- **Delta indicators on Scenario B:** Shows % change vs. Scenario A
  - Red `TrendingUp` for increases, Green `TrendingDown` for decreases, Gray `Minus` for < 1% change

### TimeSlider (`src/components/TimeSlider.tsx` — 208 lines)

Playback controls for scrubbing through simulation results.

**Controls:**
- Play/Pause button
- Step Back / Step Forward buttons
- Speed cycle button (1x → 2x → 4x)
- Slider from step 0 to totalSteps-1
- Quick-jump buttons at 0%, 25%, 50%, 75%, 100% positions

**Display:**
- Current time (Xh XXm) / Total time
- Step N of M
- Progress percentage

**Playback Logic:**
- `setInterval` at `200 / playbackSpeed` ms
- Auto-stops at end of results
- Stops when `disabled` prop is true (during active simulation)

### GuidedWorkflow (`src/components/GuidedWorkflow.tsx` — 119 lines)

5-step onboarding guide in a collapsible card.

**Steps:**
1. View the Network — always completed
2. Configure Storm Event — always completed
3. Run the Simulation — completed when `hasResults`
4. Review Results — completed when `hasResults`
5. Export Report — completed when `hasResults`

**Active step determination:** `hasResults ? 4 : isSimulating ? 3 : 1`

### TechDetailsModal (`src/components/TechDetailsModal.tsx` — 236 lines)

Dialog with 3 tabs:
- **Methodology:** Saint-Venant equations, EPS method, Manning's equation, kinematic wave, SCS Type II storm
- **Equations:** Manning's equation formula, Continuity equation, Momentum equation (simplified)
- **Limitations:** Beta disclaimer, current limitations list, recommended/not-recommended uses, references

### ThemeToggle (`src/components/ThemeToggle.tsx` — 38 lines)

Dropdown menu with Light/Dark/System options using `next-themes`.

---

## Network Editor

The network editor is integrated directly into `NetworkView.tsx` with toolbar UI in `NetworkEditorToolbar.tsx`.

### Activation
- Toggle via "Edit Network" button in the toolbar above the canvas
- When activated, the toolbar expands to show 5 mode buttons
- When deactivated, resets to `select` mode and clears pending connections

### Editor Modes

#### Select Mode (`select`)
- Default mode — same as non-editor behavior
- Click nodes/pipes to inspect via PropertyInspector

#### Add Node Mode (`addNode`)
- Canvas shows placement grid dots (every 40px, subtle blue)
- Cursor becomes crosshair
- Click anywhere to place a new manhole
- Auto-generates ID: `MH-{max+1}` based on existing node IDs
- Default properties: elevation=120, rimElevation=120, invertElevation=112, maxDepth=8, type='manhole'
- Canvas coordinates are reverse-transformed via `canvasToNetwork()` to network coordinates

#### Move Mode (`move`)
- Hover over node shows grab cursor with blue glow ring
- Mouse down on node starts drag — cursor changes to grabbing
- Mouse move updates node position in real-time via `onUpdateNode` callback
- Uses delta-based dragging: `dx = (currentX - dragStartX) / zoom`
- Mouse up or mouse leave ends drag

#### Connect Mode (`addPipe`)
- Click first node → sets `pendingConnection`, shows pulsing green ring and toolbar badge
- Click second node → creates pipe between them, clears pending state
- Click same node → cancels (no self-loops)
- Click empty space → cancels pending connection
- Auto-generates pipe ID: `P-{max+1}`
- Auto-calculates length from node distance (×3 scaling factor)
- Auto-calculates slope from invert elevation difference
- Default: diameter=12", roughness=0.013

#### Delete Mode (`delete`)
- Hover over elements shows red highlight (dashed lines for pipes, red fill for nodes)
- Click node → removes node AND all connected pipes (cascading delete)
- Click pipe → removes pipe only
- Triggers `onDeleteNode(nodeId)` or `onDeletePipe(pipeId)` callbacks

### State Invalidation
Any network edit (add/update/delete node or pipe) clears `simulationResults` and resets `currentStep` to 0 in `Index.tsx`. This forces the user to re-run the simulation after modifying the network.

### Editor State Variables (in NetworkView)
```typescript
editorActive: boolean          // Whether editor mode is on
editorMode: EditorMode         // Current tool: select | addNode | move | addPipe | delete
pendingConnection: string|null // Node ID for first click in addPipe mode
draggingNode: string|null      // Node ID being dragged in move mode
dragStart: {x,y}|null          // Mouse position at drag start
```

---

## Design System

### CSS Tokens (`src/index.css`)

All colors defined as HSL values in CSS custom properties. Both light and dark themes are defined.

| Token | Light (HSL) | Dark (HSL) | Usage |
|-------|-------------|------------|-------|
| `--background` | 210 20% 98% | 215 30% 10% | Page background |
| `--foreground` | 215 25% 15% | 210 20% 95% | Default text |
| `--card` | 0 0% 100% | 215 28% 14% | Card backgrounds |
| `--card-foreground` | 215 25% 15% | 210 20% 95% | Card text |
| `--primary` | 212 100% 45% | 212 100% 55% | Buttons, links, accents (blue) |
| `--primary-foreground` | 0 0% 100% | 215 30% 10% | Text on primary |
| `--primary-glow` | 212 100% 60% | 212 100% 65% | Glow effects |
| `--secondary` | 215 20% 92% | 215 25% 20% | Secondary backgrounds |
| `--accent` | 195 85% 45% | 195 85% 50% | Teal accent color |
| `--destructive` | 0 75% 55% | 0 70% 50% | Errors, critical alerts (red) |
| `--success` | 142 70% 45% | 142 65% 50% | Positive indicators (green) |
| `--warning` | 38 92% 50% | 38 90% 55% | Caution indicators (amber) |
| `--muted` | 215 20% 95% | 215 25% 18% | Subtle backgrounds |
| `--muted-foreground` | 215 15% 45% | 215 15% 65% | Subtle text |
| `--border` | 215 20% 88% | 215 25% 22% | Borders |
| `--ring` | 212 100% 45% | 212 100% 55% | Focus rings |

### Custom Gradients & Shadows

```css
--gradient-primary: linear-gradient(135deg, hsl(primary), hsl(accent));
--gradient-surface: linear-gradient(180deg, hsl(background), hsl(muted));
--shadow-soft: 0 2px 8px hsl(foreground / 0.08);   /* light */
--shadow-medium: 0 4px 16px hsl(foreground / 0.12); /* light */
```

### Tailwind Extensions (`tailwind.config.ts`)

| Class | CSS |
|-------|-----|
| `bg-gradient-primary` | `var(--gradient-primary)` |
| `bg-gradient-surface` | `var(--gradient-surface)` |
| `shadow-soft` | `var(--shadow-soft)` |
| `shadow-medium` | `var(--shadow-medium)` |

Color scales available: `primary`, `primary.glow`, `secondary`, `destructive`, `success`, `warning`, `muted`, `accent`, `card`, `popover` — all with `.foreground` variants.

Dark mode: `class`-based via `next-themes` (`<html class="dark">`).

---

## SWMM INP File Parser

**File:** `src/lib/inpParser.ts` (422 lines)

### Supported Sections

| Section | Fields Parsed | Mapped To |
|---------|--------------|-----------|
| `[JUNCTIONS]` | id, invert elevation, max depth, init depth, surcharge, ponded area | `NetworkNode` (type: 'manhole') |
| `[OUTFALLS]` | id, invert elevation, type | `NetworkNode` (type: 'outfall', maxDepth: 2) |
| `[STORAGE]` | id, invert elevation, max depth, init depth, curve type, params | `NetworkNode` (type: 'wetwell') |
| `[CONDUITS]` | id, from node, to node, length, roughness, in/out offsets | `NetworkPipe` |
| `[XSECTIONS]` | link id, shape, geom1–4 | Merged into pipe diameter |
| `[COORDINATES]` | node id, x, y | Node x/y positions |
| `[PUMPS]` | id, from node, to node, curve name | `NetworkPump` (default 2500 GPM) |

### Parsing Logic

1. **Section detection:** Lines matching `[SECTION_NAME]` switch parser context
2. **Comment/blank skip:** Lines starting with `;` or empty lines are ignored
3. **Whitespace splitting:** `line.split(/\s+/)` with comment filtering
4. **Error handling:** Per-line try/catch with warnings collection

### Coordinate Normalization

```typescript
// Find bounding box
minX, maxX, minY, maxY from all [COORDINATES]

// Calculate uniform scale to fit 500×400 display
scaleX = 500 / (maxX - minX)
scaleY = 400 / (maxY - minY)
scale = min(scaleX, scaleY)

// Transform each coordinate
x_canvas = (x - minX) * scale + 50    // 50px left padding
y_canvas = (maxY - y) * scale + 50    // Flip Y + 50px top padding
```

Nodes without coordinates get random positions: `{ x: 100 + random*400, y: 100 + random*300 }`

### Diameter Conversion

- CIRCULAR shape: `geom1` is in feet → multiply by 12 for inches
- Other shapes: `geom1` used as-is (assumed inches — **may be incorrect**)

### Slope Calculation

```typescript
slope = |((fromNode.invertElevation - toNode.invertElevation) / length)| × 100
```
Falls back to 0.5% if nodes not found or length is 0.

### Validation & Errors

- Error if 0 nodes found (checks for `[JUNCTIONS]` section)
- Error if 0 pipes/conduits found
- Warning for each pipe with dangling node references

### Sample INP Generator

`generateSampleINP()` creates a valid 6-node network:
- 4 junctions (J1-J4), 1 outfall, 1 storage tank
- 5 conduits (C1-C5), circular cross-sections (1.0-2.5 ft diameter)
- Full coordinate section
- Empty PUMPS section

---

## State Management

All application state lives in `src/pages/Index.tsx` using React `useState`. No external state management library.

### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `isSimulating` | `boolean` | `false` | Whether simulation is actively running |
| `activeTab` | `string` | `"network"` | Current main tab (network/results/input) |
| `simulationProgress` | `number` | `0` | 0–100 progress percentage |
| `currentTime` | `number` | `0` | Current simulation time in minutes |
| `duration` | `number` | `2` | Configured simulation duration (hours) |
| `stormMultiplier` | `number` | `1.5` | Storm intensity multiplier |
| `simulationResults` | `TimeStepResult[]` | `[]` | All computed time steps |
| `currentStep` | `number` | `0` | Currently viewed time step index |
| `selectedNode` | `NetworkNode \| null` | `null` | Clicked node for inspector |
| `selectedPipe` | `NetworkPipe \| null` | `null` | Clicked pipe for inspector |
| `showComparison` | `boolean` | `false` | Whether comparison modal is open |
| `nodes` | `NetworkNode[]` | `sampleNodes` | Current network nodes |
| `pipes` | `NetworkPipe[]` | `samplePipes` | Current network pipes |
| `pumps` | `NetworkPump[]` | `samplePumps` | Current network pumps |
| `currentNetworkMetadata` | `NetworkMetadata` | `networkMetadata` | Network name, counts |

### Refs

| Ref | Type | Purpose |
|-----|------|---------|
| `simulationRef` | `boolean` | Cancellation token for simulation animation |
| `animationRef` | `number \| null` | setTimeout ID for animation cleanup |

### Callback Functions

| Callback | Purpose | Side Effects |
|----------|---------|-------------|
| `handleNetworkImport` | Load imported network | Clears results, resets selections |
| `handleRunSimulation` | Start simulation | Sets isSimulating, computes results, starts animation |
| `handleStopSimulation` | Cancel simulation | Clears timeout, sets isSimulating false |
| `handleNodeClick` | Select node | Sets selectedNode, clears selectedPipe |
| `handlePipeClick` | Select pipe | Sets selectedPipe, clears selectedNode |
| `handleCloseInspector` | Close inspector | Clears both selections |
| `handleAddNode` | Editor: add node | Appends to nodes, updates metadata, clears results |
| `handleUpdateNode` | Editor: move node | Updates node in-place (no result clear) |
| `handleDeleteNode` | Editor: delete node | Removes node + connected pipes, updates metadata, clears results |
| `handleAddPipe` | Editor: add pipe | Appends to pipes, updates metadata, clears results |
| `handleDeletePipe` | Editor: delete pipe | Removes pipe, updates metadata, clears results |
| `handleTimeSliderChange` | Scrub time | Updates currentStep and currentTime |

### Simulation Animation

- `runSimulation()` computes **all results synchronously** (blocking)
- Results are then animated via `setTimeout` chain (50ms per step)
- `simulationRef.current` acts as cancellation token — checked each frame
- Animation progressively reveals results by slicing: `setSimulationResults(results.slice(0, step + 1))`
- On completion, sets full results array and shows toast

---

## Features Implemented

| Feature | Status | Component(s) | Notes |
|---------|--------|--------------|-------|
| Network canvas visualization | ✅ Complete | NetworkView | Zoom, hover, click, legend, flow dots |
| **Visual network editor** | ✅ Complete | NetworkView, NetworkEditorToolbar | Add/move/connect/delete nodes & pipes |
| Manning's equation simulation | ✅ Complete | simulationEngine | Dendritic networks only |
| Time slider with playback | ✅ Complete | TimeSlider | Play/pause, speed control, scrubbing |
| SWMM .inp file import | ✅ Complete | InputDataPanel, inpParser | 7 sections supported |
| Drag-and-drop file import | ✅ Complete | InputDataPanel | .inp and .txt files |
| Scenario comparison | ✅ Complete | ComparisonMode | Side-by-side with delta indicators |
| Property inspector | ✅ Complete | PropertyInspector | Node & pipe details + mini charts |
| Dark/light theme | ✅ Partial | ThemeToggle, index.css | Canvas not theme-aware |
| Guided workflow | ✅ Complete | GuidedWorkflow | 5-step onboarding |
| Text report export | ✅ Complete | ResultsView | Plain text format |
| Technical documentation | ✅ Complete | TechDetailsModal | Equations, methodology, limitations |
| Surcharged manhole rankings | ✅ Complete | ResultsView | Top 10 by duration |
| System flow time series chart | ✅ Complete | ResultsView | Recharts AreaChart |
| Pipe time series chart | ✅ Complete | ResultsView | Dual-axis LineChart |
| Sample INP download | ✅ Complete | InputDataPanel | Valid SWMM format |

---

## Known Limitations

### Simulation Engine
- **Dendritic networks only** — no looped networks (flow split logic not implemented)
- Simplified Saint-Venant equations (kinematic wave approximation)
- No backwater effects between connected pipes
- Pump representation is simplified (on/off control only, not simulated)
- Pressure flow (surcharge) uses simplified approximation
- No water quality modeling
- Maximum recommended network size: ~500 nodes, ~500 pipes
- Static analysis and Design run modes are **not implemented** (UI exists but only Dynamic EPS works)
- Time step selector in SimulationPanel is **not wired** — always uses 5 min
- Storm hyetograph is fixed (SCS Type II, 2-hour) — cannot be customized

### UI / UX
- Canvas text colors are hardcoded (`#1e293b`, `#475569`) — **do not adapt to dark mode**
- Canvas background is hardcoded `bg-white` — **does not respect dark theme**
- Canvas legend background is hardcoded white (`rgba(255, 255, 255, 0.95)`)
- Manual entry forms in InputDataPanel (Add Pipe/Manhole/Pump buttons) are **UI-only — not connected to state**
- ComparisonMode always uses sample network — **does not use imported/edited network**
- SimulationPanel Network Overview reads from static `networkMetadata` constant — **doesn't update with imports**
- NetworkView canvas has fixed 520px height — **not responsive**
- No undo/redo for network edits
- No canvas pan (only zoom)
- No multi-select for batch operations
- Editor only creates manholes — cannot place wet wells or outfalls visually

### Parser
- Only CIRCULAR cross-section shape properly handles diameter conversion (feet → inches)
- Pump capacity defaults to 2500 GPM regardless of pump curve data
- No `[INFLOWS]` section parsing (external inflow hydrographs)
- No `[RAINGAGES]` section parsing
- No `[DWF]` section parsing (dry weather flow)
- No `[CURVES]` section parsing (pump curves, storage curves)
- No `[CONTROLS]` section parsing

### Performance
- Simulation runs synchronously on main thread — can freeze UI for large networks
- Canvas redraws entire scene every frame (no dirty-region optimization)
- Animation uses `setTimeout` not `requestAnimationFrame`

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

### Dependency Notes
- `@tanstack/react-query` is installed but **not actively used** — no backend data fetching
- Many shadcn/ui components are installed but unused (carousel, calendar, input-otp, etc.) — could be pruned
- `react-hook-form`, `zod`, `@hookform/resolvers` are installed but forms in InputDataPanel are not wired
- `date-fns` is installed but only used by react-day-picker (calendar component)
- `embla-carousel-react` unused
- `react-resizable-panels` unused
- `vaul` (drawer) unused

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

# Preview production build
npm run preview
```

### Environment Requirements
- Node.js 18+ (or Bun)
- No environment variables needed
- No backend/database required
- No API keys needed
- Works entirely offline after initial load

### Quick Test
1. Open the app → you'll see the pre-loaded EPA Example Network 1
2. Click "Run Analysis" in the left panel
3. Watch pipes change color as the simulation animates
4. Switch to "Results" tab to see charts and tables
5. Click "Edit Network" above the canvas to try the visual editor

---

## Extension Points

### Adding Looped Network Support
- Modify `runSimulation()` in `simulationEngine.ts` to implement flow-split logic at nodes with multiple downstream pipes
- Would require iterative solver for simultaneous flow distribution (Newton-Raphson or similar)
- Need to detect network topology (tree vs. looped) and switch algorithms

### Adding Backend Persistence
- Enable Lovable Cloud / Supabase for user accounts and saved networks
- Store simulation results in database for historical comparison
- Add project/scenario management with sharing capabilities

### PDF Report Export
- Replace current text export with a PDF library (e.g., jsPDF, @react-pdf/renderer)
- Include charts (can render Recharts to canvas/SVG), network diagram screenshot, formatted tables
- Add company branding/logo support

### Real-time SCADA Integration
- Would require WebSocket connection to SCADA system
- Map SCADA sensor IDs to network node IDs
- Display real-time vs. modeled values side by side

### Additional INP Sections
- `[INFLOWS]` — external inflow time series per node
- `[RAINGAGES]` — rainfall data sources
- `[DWF]` — dry weather flow patterns
- `[CURVES]` — pump curves, storage curves
- `[CONTROLS]` — rule-based control logic
- `[PATTERNS]` — diurnal flow patterns

### Performance Improvements
- Move simulation to Web Worker for non-blocking computation
- Canvas: Use offscreen canvas or WebGL for networks >500 elements
- Canvas: Implement dirty-region rendering (only redraw changed areas)
- Replace `setTimeout` animation with `requestAnimationFrame`
- Implement spatial indexing (quadtree) for faster hit-testing on large networks

### Canvas Dark Mode Fix
- Replace hardcoded colors in `NetworkView.tsx`:
  - `#1e293b` → read from CSS variable or pass as prop
  - `bg-white` → use `bg-card` or `bg-background`
  - Legend background `rgba(255,255,255,0.95)` → theme-aware
- Could use `getComputedStyle` to read CSS custom properties at render time

### Undo/Redo System
- Implement command pattern for all network edits
- Store stack of `{ action, before, after }` objects
- Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
- Display undo history in a panel

### Node Type Selection in Editor
- Add dropdown or sub-menu when adding nodes to choose: Manhole, Wet Well, Outfall
- Customize default properties per type
- Different visual indicators during placement

---

## Key Code Patterns

### Simulation callback pattern
```typescript
const results = runSimulation(
  { duration, timeStep: 5, stormMultiplier },
  (progress, time) => {
    setSimulationProgress(progress);
    setCurrentTime(time);
  },
  { nodes, pipes }  // Pass current network data
);
```

### Network import callback
```typescript
const handleNetworkImport = useCallback((
  importedNodes: NetworkNode[],
  importedPipes: NetworkPipe[],
  importedPumps: NetworkPump[],
  metadata: NetworkMetadata
) => {
  setNodes(importedNodes);
  setPipes(importedPipes);
  setPumps(importedPumps);
  setCurrentNetworkMetadata(metadata);
  setSimulationResults([]);  // Clear old results
  setCurrentStep(0);
  setSelectedNode(null);
  setSelectedPipe(null);
}, []);
```

### Canvas coordinate transformation
```typescript
// Network coords → canvas coords
const getNodePosition = (node: NetworkNode) => ({
  x: node.x * zoom + offset.x,
  y: node.y * zoom + offset.y
});

// Canvas coords → network coords (for editor)
const canvasToNetwork = (canvasX: number, canvasY: number) => ({
  x: (canvasX - offset.x) / zoom,
  y: (canvasY - offset.y) / zoom,
});
```

### Canvas hit-testing (point-to-line distance for pipes)
```typescript
const lineLen = Math.sqrt((to.x - from.x)**2 + (to.y - from.y)**2);
const t = Math.max(0, Math.min(1,
  ((x - from.x)*(to.x - from.x) + (y - from.y)*(to.y - from.y)) / (lineLen * lineLen)
));
const projX = from.x + t * (to.x - from.x);
const projY = from.y + t * (to.y - from.y);
const distance = Math.sqrt((x - projX)**2 + (y - projY)**2);
// Hit if distance < 10px
```

### Editor mode node creation
```typescript
const id = nextNodeId(); // Auto-generates MH-{max+1}
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
```

### Editor mode pipe creation
```typescript
const id = nextPipeId(); // Auto-generates P-{max+1}
const length = Math.sqrt(dx*dx + dy*dy) * 10 / 10; // Euclidean distance
const slope = length > 0
  ? Math.abs((fromNode.invertElevation - toNode.invertElevation) / length * 100)
  : 0.5;
onAddPipe({
  id,
  fromNode: pendingConnection,
  toNode: node.id,
  diameter: 12,
  length: Math.max(50, length * 3), // 3x scaling factor, min 50ft
  roughness: 0.013,
  slope: slope || 0.5,
});
```

---

## Migration Guide

### Moving to Another Lovable Project
1. Copy all files from `src/` directory
2. Copy `tailwind.config.ts`, `index.html`, `postcss.config.js`, `components.json`
3. Install all dependencies from `package.json`
4. No environment variables or secrets needed

### Moving to Non-Lovable React Project
1. All source code is standard React + TypeScript + Vite
2. shadcn/ui components in `src/components/ui/` are self-contained
3. Replace `@/` path aliases with relative imports (configured in `tsconfig.app.json` and `vite.config.ts`)
4. Design system is in `src/index.css` (CSS custom properties) — framework-agnostic

### Key Files to Preserve
- `src/lib/simulationEngine.ts` — core simulation logic, no UI dependencies
- `src/lib/inpParser.ts` — INP file parser, no UI dependencies
- `src/data/sampleNetwork.ts` — data models and sample data, no UI dependencies
- `src/index.css` — complete design system tokens

### Files That Can Be Removed
If not using certain features:
- `src/components/ComparisonMode.tsx` — scenario comparison
- `src/components/GuidedWorkflow.tsx` — onboarding guide
- `src/components/TechDetailsModal.tsx` — technical docs
- Any unused shadcn/ui components in `src/components/ui/`

---

*End of Handover Document — InfoSewer Engine v2.0*
