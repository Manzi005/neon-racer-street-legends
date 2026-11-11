# NEON RACER — STREET LEGENDS

A self-contained, neon-soaked arcade racing game built with HTML5 Canvas, CSS, and vanilla JavaScript. No build tools, frameworks, external assets, or server are required.

## Features

- Three original street circuits, each with a distinct route, scenery, and neon palette.
- Quick Race, Time Trial, and a three-event Championship.
- Four fictional cars with different speed, acceleration, handling, and grip.
- AI rivals with different driving styles and easy, normal, and hard difficulty.
- Acceleration, reverse, braking, drag, road grip, off-road slowdown, drifting, and nitro.
- Car, track-edge, and road-obstacle collisions; start/finish and lap tracking; positions; race results; particle trails; and screen shake.
- Responsive race HUD, garage, track/mode selection, settings, pause screen, records, and driver briefing.
- Browser LocalStorage saves credits, unlocked vehicles and tracks, records, and sound preferences.
- Original synthesized racing effects and procedural electronic background music generated with the Web Audio API; no missing or copyrighted audio files.
- Separate music and effects volume, channel mutes, global mute, and saved audio preferences.
- A responsive “DEVELOPED BY MAKERE” watermark on the menu, race HUD, and results.

## Run locally

1. Download or clone this project.
2. Open `index.html` in a recent desktop browser.
3. Choose a race mode, track, and difficulty. Click or press a key once to enable browser audio.

The project intentionally uses classic scripts (not JavaScript modules) so it can run directly from `file://` without a local web server.

## Controls

| Action | Keys |
|---|---|
| Accelerate | W or Up Arrow |
| Brake / reverse | S or Down Arrow |
| Steer | A / D or Left / Right Arrow |
| Handbrake drift | Space |
| Nitro | Shift |
| Pause / resume | Escape |

Use the handbrake while steering through a corner to initiate a drift. Nitro consumes its meter while boosting and recharges gradually. Staying on the road preserves speed and replenishes nitro faster.

Use **Settings** to adjust the independent music and sound-effects volume sliders, mute either audio channel, or mute all audio. Audio playback begins after your first browser interaction; preferences are saved in LocalStorage.

## How to play

- **Quick Race:** race three rivals over three laps.
- **Time Trial:** practice a five-lap solo run and set a track record.
- **Championship:** race a three-event series and collect points for your standings.
- Finish races to earn credits. Wins unlock additional tracks; credits unlock cars. Results and records are saved in the current browser profile.

## Project structure

```text
NEON-RACER/
├── index.html              # Page, canvas, HUD, and script loading order
├── style.css               # Responsive neon UI and menus
├── README.md
└── src/
    ├── main.js             # Menus, modes, LocalStorage, and UI/game wiring
    ├── game.js             # Canvas loop, race state, rendering, and particles
    ├── player.js           # Car definitions and vehicle state
    ├── physics.js          # Shared driving model
    ├── controls.js         # Keyboard input and pause events
    ├── opponent.js         # Racing-line AI and rival personalities
    ├── track.js            # Track definitions, geometry, and world drawing
    ├── collision.js        # Car-to-car and track-edge collisions
    └── audio.js            # Synthesized Web Audio effects
```

## How the code works

- **Game loop:** `requestAnimationFrame` calls the game frame continuously. The elapsed time between frames is clamped and passed as `dt`, so movement and steering are based on seconds rather than the monitor's frame rate.
- **Canvas rendering:** the game draws the road and scenery in world coordinates, offsetting the world so the player's car stays near the center. Cars, road markings, and particles are drawn with Canvas paths and shapes.
- **Car physics:** a car has a forward speed and velocity components. Acceleration changes speed, drag slows an unpowered car, steering rotates its heading, and grip reduces sideways velocity. Off-road checks lower acceleration and top speed.
- **Drifting:** the handbrake temporarily reduces lateral grip while increasing steering response. This lets momentum carry the car sideways through a turn; smoke particles provide visual feedback.
- **AI:** rivals find their nearest position on the track, aim for a point ahead, and adjust their steering toward it. Their target speed changes with upcoming corner severity, and their personality affects line choice and nearby-car avoidance.
- **Collisions:** circular overlap checks resolve car pairs, push cars apart, and reduce speed. Track-edge checks find the nearest point on the centerline and constrain cars to the road edge. Roadside barrels also push cars away and slow them on impact; rivals adjust their lines to avoid barrels ahead.
- **Saving:** a small versioned JSON object is read from and written to LocalStorage. Missing, invalid, or malformed data falls back to fresh defaults; storage errors are reported in the console.
- **Audio:** the Web Audio API synthesizes the engine, drift, impact, countdown, menu, and race-result sounds, plus a looping electronic music pattern. No third-party audio assets are loaded.
- **Modules:** these files are separate classic scripts sharing a single `NeonRace` namespace. The order in `index.html` loads foundational classes before the game and UI wiring.

## Settings and saves

The sound button mutes/unmutes generated sound and remembers the preference. Progress is local to the browser. To reset it, open the browser developer console on this page and run:

```js
localStorage.removeItem('neon-racer-street-legends-v1');
location.reload();
```

## Contributing

Keep the game dependency-free and preserve direct `index.html` launch support. Add a track by adding a data object to `N.TRACKS` in `src/track.js`; use a unique `id`, a display name, a place, road width, neon theme, and a closed sequence of `[x, y]` route points. Keep car balance values in `src/player.js`. Test a race in a browser after changing physics, collision, or track geometry.

## Publish with GitHub Pages

1. Push the project to a GitHub repository.
2. Open **Settings → Pages** for the repository.
3. Choose **Deploy from a branch**, select the branch and `/ (root)` folder, then save.
4. Open the published Pages URL after deployment completes. The site is static and needs no build workflow.

## Known scope

The visual world and vehicles are generated in Canvas. Sound is synthesized in the browser rather than loaded from audio files. Audio playback requires a user gesture, as required by modern browsers.
