# Chicago Streets

A third-person, browser-playable recreation of Cloud Gate (the Bean), Millennium Park and the surrounding Chicago Loop and lakefront at real-world scale. Built with [three.js](https://threejs.org/) and [Vite](https://vite.dev/).

## Run it

Requires Node 20.19 or newer.

```bash
npm install
npm run dev          # local dev server with hot reload, usually http://localhost:5173
```

| Script                 | What it does                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`          | Dev server. The debug hook `window.__g` is available in the console.                                                                                                                                                                     |
| `npm run build`        | Production build to `dist/` (what GitHub Pages serves).                                                                                                                                                                                  |
| `npm run build:single` | One self-contained `dist-single/index.html` (everything inlined), handy for sharing a single file or a Claude artifact.                                                                                                                  |
| `npm run preview`      | Serves `dist/` locally to check a production build.                                                                                                                                                                                      |
| `npm run smoke`        | Headless smoke test of `dist/`: loads the game, visits six landmarks, drives the SUV, writes screenshots to `smoke-output/`, fails on any page error. Run `npm run build` first, and once per machine `npx playwright install chromium`. |

## Controls

- **W A S D** move relative to the camera · **Shift** run · **Space** jump
- **Mouse** look (click to lock the pointer) · **Wheel** zoom
- **Tab** get in / out of the black SUV (W/S drive, A/D steer, Space handbrake, Shift boost)
- **M** city map and fast travel · **H** hide help
- Touch: left stick to move, drag to look, on-screen buttons for jump, run, car and map

## What's modelled

- Cloud Gate (20 × 13 × 10 m) with a walk-under arch and live mirror reflections
- Millennium Park on its raised deck: Grainger Plaza, McCormick Tribune Ice Rink, Wrigley Square peristyle, Crown Fountain, Jay Pritzker Pavilion and trellis, the Great Lawn (picnics, dogs), Lurie Garden, Chase Promenade, Boeing Galleries
- BP Pedestrian Bridge, Nichols Bridgeway to the Art Institute Modern Wing terrace, Maggie Daley Park
- Street grid with signalled traffic, CTA buses and pedestrians
- Walk-in Walgreens at Michigan & Washington (aisles, coolers, pharmacy, checkout)
- Lakefront: Lakefront Trail, limestone step revetment, animated lake water, Monroe Harbor moorings and breakwater, Chicago Yacht Club pier, DuSable Harbor docks, Navy Pier and Lake Point Tower on the skyline
- Drivable black SUV
- Michigan Ave streetwall and skyline landmarks (Aon, Two Prudential, BCBS, Aqua, 150 N Michigan, Willis, Trump)

Buildings are solid; storefronts are visible but not enterable, except the Walgreens.

## Project layout

```
index.html              HUD markup and the module entry point
src/
  main.js               load order of every module, the game loop, start button, debug hook
  styles.css            HUD styling
  assets/               image files (imported by modules; Vite fingerprints them)
  core/                 util, renderer + scene, textures, materials, geometry helpers, collision, shared state
  world/                one module per place: streets, park deck, buildings, cloud-gate, crown-fountain,
                        ice-rink, walgreens, pritzker-pavilion, lurie-garden, bridges, grant-park,
                        lakefront, trees, street-furniture, finalize (merges batched geometry)
  life/                 traffic, people (crowd), great-lawn (picnics + dogs)
  player/               avatar model + animation, input, walking physics
  vehicles/suv.js       the drivable SUV
  view/camera.js        follow camera and sun/shadow rig
  ui/                   location HUD, minimap, city map, fast travel
scripts/smoke.mjs       headless smoke test
.github/workflows/      GitHub Pages deploy on push to main
```

### Conventions

- **Units and axes:** metres; x = east, z = south, y = up; the origin is the centre of Cloud Gate.
- **Load order matters.** Each world module builds its part of the scene when it loads, and many add geometry to shared batches (`acc(...)` in `core/geometry.js`) that `world/finalize.js` merges into a few meshes. New modules go into the import list at the top of `src/main.js`, before `world/finalize.js` if they add batched geometry.
- **Shared state:** values several modules write (camera angles, run flags, timers) live on `state` in `core/state.js`. Objects and functions a module needs from a module that loads _later_ (for example traffic needs the player) are read through `late`, which the later module fills in. Only read `late.*` at runtime, never while a module is loading.
- **Collision** is a uniform grid of simple shapes (`colRect`, `colCirc`, `colPath` in `core/collision.js`); anything solid needs one.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. One-time setup: in the repo's Settings → Pages, set **Source** to **GitHub Actions**. The game is then served at `https://<user>.github.io/chicago-streets/`.

## Roadmap ideas

- Upgrade three.js from 0.128 (kept for an exact port) to the current release; lighting values will need retuning.
- Real building footprints and heights from OpenStreetMap instead of hand-placed blocks.
- A physics engine (Rapier) for the SUV and collisions.
- Gradually move modules to TypeScript.
