# WW Character Creator

WW Character Creator is a local-first web app for generating a stylized character portrait, building a full-body multiview turnaround, and sending that image set to Tripo for textured 3D generation.

## Structure

- `client/` - Vite React frontend
- `server/` - Express API for Gemini and Tripo orchestration

## Setup

1. Install dependencies in `client/` and `server/`.
2. Copy `server/.env.example` to `server/.env`.
3. Fill in your Gemini and Tripo API keys.
4. Install the root helper dependency with `npm install` in the project root if you want one-command startup.
5. Run `npm run start-all` from the project root, or start the server on `5000` and client on `5173` separately.

## Workflow

1. Generate an identity portrait from prompt, reference image, or both.
2. Generate front, back, and left orthographic turnaround views.
3. Mirror the left view into the right view.
4. Submit all four images to Tripo and preview the resulting GLB in the browser.
