# Janice's Anniversary Treasure Book

A small browser game made as an anniversary gift — an interactive "treasure book" where you play through three little memory-themed mini-games to unlock a final surprise.

🔗 **Live site:** https://anniversary-game-six.vercel.app/

## How to play

1. Tap the book on the cover to open the map.
2. Play the three levels along the route:
   - **Level 1 — Run:** help young Janice jump over the obstacle while being chased.
   - **Level 2 — Catch:** a whack-a-mole style catch game against the clock.
   - **Level 3 — Dodge:** move around and survive the incoming hazards.
3. Each level you beat pins a polaroid to the gallery and unlocks the next stop.
4. Finish all three to open the treasure chest, enter the anniversary code, and reveal the ending.

## Tech stack

This is a plain **static website** — no frameworks, no build step, no dependencies.

- HTML (`index.html`)
- CSS (`styles.css`)
- Vanilla JavaScript (`game.js`)
- A tiny Node script (`server.js`) used only for previewing locally

## Project structure

```
.
├─ index.html          # Page markup and screens
├─ styles.css          # All styling
├─ game.js             # Game logic (levels, map, gallery, transitions)
├─ server.js           # Local dev server (not used in production)
├─ vercel.json         # Vercel static-hosting config (clean URLs + asset caching)
├─ package.json        # npm scripts for local preview
└─ assets/
   ├─ images/          # Images used by the game
   ├─ videos/          # Cover / closing / treasure videos
   └─ extras/          # Original art & photos not currently used in the game
```

## Run it locally

You need [Node.js](https://nodejs.org/) installed.

```bash
npm run dev
```

Then open the printed address (http://127.0.0.1:4173) in your browser.

> The site is fully static, so you can also just open `index.html` directly — but running through the dev server most closely matches how it behaves when deployed.

## Deploy

The project is hosted on **Vercel** as a static site and auto-deploys on every push to `main`.

- **Framework Preset:** Other
- **Build Command:** none
- **Output Directory:** none (serves the repo root)

To deploy a change, just commit and push:

```bash
git add .
git commit -m "your message"
git push
```

Vercel picks up the push and redeploys automatically.

## Notes

- The final treasure is protected by a short code (hint: a date as `DD/MM`).
- All media lives under `assets/` with clean, lowercase, space-free filenames so paths work consistently across local and Vercel (Linux) hosting.
