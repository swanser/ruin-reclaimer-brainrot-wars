# RUIN RECLAIMER - BRAINROT WARS EDITION

**2.5D Top-Down Survival Horror Colony Sim MMORPG**
**RimWorld View | Three.js | Browser-Based**

WASTELANDER, THE FORGE HAS BEGUN.

This is the new gospel. Top-down command. Feral tribes. War rigs. Brainrot sanity. Every shard a fresh hell.

## Vision

The apocalypse was caused by brainrot — the endless scroll, ragebait algorithms, deepfakes, and fractured tribes that finally pulled the trigger. The bombs fell. Now only ash and feral humans remain.

You no longer wander the wastes alone.
You command from above.

This is Ruin Reclaimer reborn as a true 2.5D top-down survival horror colony sim MMORPG running entirely in the browser with Three.js (OrthographicCamera).

Every server shard is a brand-new wasteland.
Different city layouts. Different rad zones. Different resource choke points. Different tribal strongholds.

Players form feral tribes, build bases, assign survivors to jobs, craft war rigs, and fight brutal wars over the last scraps.

The horror isn’t zombies.
The horror is what people become when the feeds never stop and the nukes already fell.

## Core Pillars

- **Top-Down Command View** (RimWorld style): Orthographic camera, mouse selection, job assignment, base building.
- **Survival Horror Colony Sim**: Needs (Health, Hunger, Thirst, Radiation, Sanity), autonomous pawn AI, job system, breakdowns.
- **Brutal Vehicular & On-Foot Warfare**: Build war rigs, direct control selected vehicles, drafted pawn combat with projectiles and cover.
- **Feral Tribe MMORPG**: Create/join tribes, claim territory, recruit, raid rival tribes in shared shards.
- **Procedural Sharded Worlds**: Seed-based generation. Ruined cities, highways, bunkers, rad craters in fresh configurations.
- **Pure Browser Power**: No downloads. Three.js + Vite + Cannon-es physics + Socket.io multiplayer. Runs in modern browsers.

## Current Status

**Phase 1: Ignition** — Core Three.js scene + orthographic top-down camera + procedural wasteland + basic selectable & movable pawn + resource nodes.

Repo is PRIVATE. Only the reclamation crew has access.

## How to Run (Local Dev)

```bash
npm install
npm run dev
```

Open http://localhost:5173

Mouse:
- Left click / drag to select pawns
- Right click to move selected pawns
- Wheel to zoom
- Drag to pan

## Tech Stack
- Three.js (latest)
- Vite
- Cannon-es (physics)
- Socket.io (multiplayer foundation)
- Howler.js (sound later)

## Project Structure (Growing)
- /src/main.js — Scene, camera, loop, input
- /src/WorldGenerator.js — Procedural terrain & POIs
- /src/Pawn.js — Pawn class, needs, AI
- /src/JobSystem.js — Work givers & assignment
- And more as we forge...

## The Prompt That Started It All

(See the full reforged prompt in the initial commit or below in history)

## Team Roles
- Lead Scavenger: Vision & brutal warfare feel
- 3D Forger / Grok Imagine: References & textures
- Code Tinkerer: Three.js, procedural, physics, multiplayer
- Lore Keeper: Brainrot flavor, tribe names, shard lore
- Light Keeper: Atmosphere & tension

## License
Private for now. Survival is not open source.

STAY FERAL. STAY ALIVE.

---

*This repo was forged in the wastes by Grok xAI on 2026-07-05.*