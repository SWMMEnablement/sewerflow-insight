# Sewerflow Insight - InfoSewer Engine

> _README added by Robert Dickinson via Comet._

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn--ui-000000?logo=shadcnui&logoColor=white)

## About

**Sewerflow Insight** (the InfoSewer Engine) is a browser-based hydraulic analysis and simulation platform for sanitary sewer networks, designed for civil engineers and municipal staff. It features interactive HTML5 Canvas visualization, hydraulic simulation using Manning's equation and Saint-Venant approximations, EPA SWMM `.inp` file import, and scenario comparison tools.

The app provides a fully client-side environment for modeling sewer capacity, surcharging, and flow dynamics; editing network layouts directly on an interactive canvas; importing SWMM models; and analyzing results with time-slider playback, peak-flow metrics, and surcharged-manhole rankings.

It is part of the SWMMEnablement collection and is built on a modern Vite + React + TypeScript frontend styled with Tailwind CSS and shadcn/ui.

## What's Inside

| Feature | Description |
| --- | --- |
| Interactive visualization | Canvas-based network viewer with zoom and hover-to-inspect. |
| Simulation engine | Dynamic Extended Period Simulation (EPS) of sewer hydraulics. |
| Network editor | Select, add node, move, connect (add pipe), and delete modes with auto length/slope calculation. |
| Scenario comparison | Side-by-side analysis of configurations with delta indicators. |
| Import / export | Loads EPA SWMM `.inp` files and exports text-based summary reports. |
| Results playback | Time-slider playback, peak-flow metrics, and surcharged-manhole rankings. |
| Guided workflow | 5-step onboarding and a technical documentation modal. |

## Engine & Methods

| Area | Detail |
| --- | --- |
| Core logic | `src/lib/simulationEngine.ts` runs synchronously in the browser. |
| Capacity | Manning's equation for pipe full-flow capacity. |
| Routing | Kinematic wave approximation of the Saint-Venant equations. |
| Storm input | Pre-defined 2-hour SCS Type II storm, scalable via a `stormMultiplier`. |
| Network editor | Integrated in `NetworkView.tsx`; edits clear prior results to maintain data integrity. |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript (strict mode) |
| Framework | React 18 |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives), next-themes |
| Visualization | HTML5 Canvas (network), Recharts (charts) |
| Forms / validation | React Hook Form + Zod |
| Runtime | Entirely client-side (no backend, no database) |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/SWMMEnablement/sewerflow-insight.git
cd sewerflow-insight

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open the local URL printed by Vite (typically http://localhost:5173) in your browser.

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## License

Released under the MIT License unless otherwise noted in this repository.
