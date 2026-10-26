# CLAUDE.md

Instructions for AI coding assistants (Claude Code, Cursor) working in this repo. Read this first.

## What this is

A third-person, browser-playable recreation of Cloud Gate, Millennium Park and the surrounding Chicago Loop and lakefront, built with three.js and Vite. The owner vibe codes it: they describe what they want, the assistant builds and verifies it.

**Priorities, in order:** real-world accuracy of layout, scale and navigation → playability → visual polish. Buildings are solid and storefronts visible but not enterable, unless a feature asks for an interior (the Walgreens at Michigan & Washington is enterable). Season is late October (fall colours).

## Commands

```bash
npm run dev            # dev server; window.__g debug hook available
npm run build          # production build -> dist/
npm run build:single   # one self-contained HTML -> dist-single/index.html
npm run smoke          # headless test of dist/ (run `npm run build` first)
npm run format         # Prettier
```

## Workflow rules

1. **Before every commit:** `npm run format`, `npm run build`, `npm run smoke`. The smoke test must pass.
2. **Look at the result.** For any visual change, open the relevant `smoke-output/*.png` (or add a shot to `SHOTS` in `scripts/smoke.mjs`) and check it. Builds passing does not mean the scene looks right.
3. Commit and push only when the owner asks. Keep unrelated changes in separate commits.
4. Pin new npm dependencies to exact versions at least two weeks old.
5. When you research real dimensions or locations, use them, and say in your summary which values are estimates.
6. Don't reproduce real brand logos. Shop names in plain type are fine; copying a logo or its signature lettering is not.

## Architecture

- **Units and axes:** metres. x = east, z = south, y = up. Origin = centre of Cloud Gate. Michigan Ave is around x = -85, Columbus Dr x = 195, Lake Shore Dr x = 451, Randolph St z = -162, Monroe St z = 184. The Millennium Park deck is at y = 3.6 (`D`).
- **heading convention:** an object's forward vector is `(sin h, cos h)`; `rotation.y = h`.
- **Load order matters.** `src/main.js` imports every module in order; modules build their part of the world as they load. New modules go into that list.
- **Batched geometry:** `acc(name)` in `core/geometry.js` returns an accumulator; quads added to it are merged into one mesh by `world/finalize.js`, using `MAT[name]` (or `MAT[name without 'ov_']`). So anything using `acc()` must load before `world/finalize.js`, and its material must exist in `MAT` by then.
- **Shared state:** `state.*` (in `core/state.js`) holds values several modules write: camera yaw/pitch/distance, `state.running`, timers. `late.*` holds things defined in a module that loads later (player, suv, teleport...). Read `late.*` only inside functions that run during play, never at module load.
- **Collision:** a grid of simple shapes in `core/collision.js`. `colRect(x0,x1,z0,z1,top,bottom)`, `colCirc(x,z,r,top)`, `colPath(points,width,thickness)` for bridges. Anything solid needs one. `support(x,z,y)` returns ground height; `blocked()` is the walking test; the SUV uses `carFree()`.
- **Signs:** `addSign(text,x,y,z,face,height,{bg,fg})`, where `face` is the compass side the sign faces (N/E/S/W).
- **three.js is pinned at 0.128.0** (2021) to keep the port exact. Use that version's API: `outputEncoding`, `sRGBEncoding`, legacy light intensities.

## Gotchas learned the hard way

- **Flat overlays on the ground** (granite, paths, ice) need `polygonOffset` on their material, and a stronger offset than whatever they sit on, or they flicker or vanish at low camera angles.
- **Huge single quads** (over roughly 1 km) can fail to render in some GPUs. `Acc.top()` auto-tiles; use segmented `PlaneGeometry` for big planes.
- **Large ground planes can cover other things.** The distant ground plane ends at x = 518 so it doesn't cover the lakefront steps; check for this when adding low geometry.
- **Defining helpers after first use** breaks loading (temporal dead zone). If a module needs a helper, it must come from an earlier module.
- **Local variables named `state` or `late`** would hide the shared objects; don't use those names.
- **Headless rendering is slow** (software WebGL). The smoke test waits for rendered frames, not wall-clock time; do the same in any new checks. `window.__lite = true` before load lowers resolution for tests.

## Debug hook

`window.__g` (dev server, or any build with `?debug` in the URL): `teleport({x,z,yaw})`, `setCam(yaw,pitch,dist)`, `start()`, `toggleDrive()`, `sim(seconds)` / `simDrive(seconds)` for fixed-step walking and driving, plus `player`, `suv`, `keys`, `scene`, `renderer`.
