# Copilot instructions for my-second-app

## Repository overview

This is a dependency-free browser game named **Moon Runner**. It is intentionally a small static site rather than a framework application:

- `index.html` defines the Japanese page shell, HUD, canvas, result overlay, and script/style links.
- `style.css` controls the responsive shell and HUD/overlay presentation. The game world itself is drawn by Canvas.
- `script.js` contains all game state, input handling, physics, collision detection, camera scrolling, rendering, enemy behavior, and win/loss flow.

Keep the three-file separation intact. Use the DOM for HUD and overlays, and use the 960x540 Canvas for the world and actors.

## Build, test, and lint

There is currently no `package.json`, build system, test runner, or linter. The project runs as static files, with scripts loaded directly by `index.html`:

```text
Open index.html directly in a browser
```

For a syntax-only JavaScript check when Node.js is available:

```bash
node --check script.js
```

There are no individual test commands at present. For behavior changes, manually exercise movement, jumping, attacking, enemy contact, falling, restart, and reaching the goal in a browser.

## Architecture and game model

`script.js` runs a `requestAnimationFrame` loop. Each frame clamps delta time, calls `update(dt)` for simulation, then `draw()` for rendering. The simulation is paused whenever `gameState` is not `"playing"`; `endGame(true/false)` controls the result overlay and status text.

The world is wider than the viewport (`worldWidth` is 3100). World objects use absolute world coordinates, while `cameraX` is applied only during drawing with `ctx.translate(-cameraX, 0)`. Keep gameplay coordinates independent of the camera. The background includes a small parallax moon, but platforms, enemies, the player, and goal are drawn in world space.

The player, platforms, and enemies are plain object/array data near the top of `script.js`. Platforms are axis-aligned rectangles. Collision is intentionally simple: `update()` resolves only downward landings on platforms, and `intersects()` handles rectangle overlap for actors and attacks. The player has velocity, gravity, acceleration toward the target horizontal speed, a grounded flag, facing direction, attack timer, HP, and temporary invincibility.

The DOM is queried once at startup for `#game`, `#hp`, `#status`, the result message elements, and `#restart`. `updateHp()` owns the heart display; `resetGame()` restores player/enemy state and hides the overlay. Keep these responsibilities centralized rather than updating HUD elements from multiple locations.

## Codebase-specific conventions

- Use plain browser JavaScript and existing Canvas/DOM APIs; do not introduce a framework or dependency for small gameplay changes.
- Keep `script.js` as a classic browser script unless there is a deliberate need to change `index.html` to support modules or a build step.
- 説明は日本語で表示するようにして。
- Preserve the current Japanese UI text and keyboard controls unless the feature explicitly changes the UX. Supported controls are Arrow keys/A-D for movement, Space/ArrowUp/W for jumping, and X/Enter for attacking.
- Add new level geometry to `platforms`, moving hazards/actors to `enemies` or a similarly explicit data array, and render them through dedicated draw helpers.
- Use `dt`-scaled movement and timers for gameplay so behavior does not depend on frame rate. Keep the existing `Math.min(..., 0.033)` frame-step clamp.
- Keep collision rectangles explicit with `x`, `y`, `width`, and `height`; reuse `intersects()` instead of creating alternate overlap logic.
- Reset all mutable gameplay state in `resetGame()`, including any new actor state, timers, and camera-related state.
- Keep rendering side-effect free with respect to gameplay state: state changes belong in `update()` or explicit event handlers, while `draw()` paints the current state.
- Use CSS classes for visibility and presentation (`hidden`, `.message`) rather than inline style changes. Preserve the responsive canvas sizing and pixel-art rendering style.
