# Quick Choice: quote assistant for Handwerker

The Handwerker calls a voice assistant, answers a few short questions, and gets a finished quote (Angebot) with net, 19% VAT, and total. The AI only collects facts. The app does all the maths.

## Run it

1. Copy `.env.example` to `.env` and put in your `OPENAI_API_KEY`.
2. `npm start` (needs Node 22 or newer)
3. Open http://localhost:3000

The microphone works on `localhost` and on HTTPS only.

## How the call works

- The server (`server.js`) asks OpenAI for a short-lived pass. Your API key never reaches the browser.
- The browser (`public/app.js`) talks to the OpenAI Realtime API directly over WebRTC. The chat never passes through our server and is never saved.
- The assistant reports facts with two tools: `update_progress` (fills the ruler) and `finish_quote` (raw quantities and prices). `buildQuote` and `totals` in `app.js` do every sum in whole cents.

## Files

- `server.js`: serves the app and creates Realtime passes
- `public/`: the app (home, call, quote, `/stats`)
- `mockup.html`: the clickable design mockup with fake data

## Deploy (Coolify)

Node app, start command `npm start`, port 3000. Set `OPENAI_API_KEY` in Coolify's environment settings.
