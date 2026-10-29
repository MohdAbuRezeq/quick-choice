// Small web server for the quote assistant.
// It serves the app and creates short-lived Realtime passes, so the
// OpenAI key never reaches the browser. Chat content never passes through here:
// the phone talks to OpenAI directly.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.REALTIME_MODEL || "gpt-realtime-2.1";
const VOICE = process.env.REALTIME_VOICE || "marin";
const PUBLIC_DIR = join(import.meta.dirname, "public");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const FACTS = ["job", "size", "material", "crew", "days", "customer"];

function instructions(lang) {
  const language = lang === "de"
    ? "Speak German. Use \"du\" with the Handwerker."
    : "Speak English.";
  return `You are the friendly office assistant of a German tradesperson (Handwerker: tiler, painter, plumber and so on).
The Handwerker is calling you from their phone to prepare a quote (in Germany: Angebot) for a customer.
${language}

How you talk:
- Like a real office assistant on the phone: warm, relaxed, short.
- One or two short sentences per turn. Ask exactly ONE question at a time.
- Start by greeting the Handwerker and asking which job the quote is for.

What you need to find out, one question at a time:
1. The job and what work is needed (for example: bathroom floor, remove old tiles).
2. The size or quantities (square metres, metres, pieces).
3. Who pays for the materials. If the Handwerker buys them, which materials and their prices if known.
4. How many people work on it.
5. How many days it takes.
6. The customer's name and address.
Skip questions the Handwerker already answered.

Rules:
- Whenever you learn one of these facts, call update_progress.
- NEVER calculate prices, totals, VAT or hours yourself and never say a total. The app does all the maths.
- If a price is unknown, leave it as null. Never guess or invent prices.
- When you know enough, sum up the job in one sentence, then call finish_quote.
- After finish_quote, say in one short sentence that the quote is now on the screen.
- If the Handwerker goes off topic, bring them back kindly.`;
}

const TOOLS = [
  {
    type: "function",
    name: "update_progress",
    description: "Call when you learn a new fact for the quote. Lists every fact known so far.",
    parameters: {
      type: "object",
      properties: {
        known: { type: "array", items: { type: "string", enum: FACTS } },
      },
      required: ["known"],
    },
  },
  {
    type: "function",
    name: "finish_quote",
    description: "Create the quote. Give raw facts only, never totals. The app calculates all prices.",
    parameters: {
      type: "object",
      properties: {
        job_title: { type: "string", description: "Short title, e.g. 'Bathroom floor'" },
        customer_name: { type: "string" },
        customer_address: { type: "string", description: "Street, postcode and city as told. Empty if unknown." },
        labour: {
          type: "object",
          description: "The labour for the job. The app turns this into hours and prices it.",
          properties: {
            description: { type: "string", description: "What the team does, e.g. 'Remove old tiles and lay new floor tiles'" },
            people: { type: "number" },
            days: { type: "number" },
            hours_per_day: { type: "number", description: "Use 8 unless the Handwerker says otherwise" },
          },
          required: ["description", "people", "days", "hours_per_day"],
        },
        items: {
          type: "array",
          description: "Materials and other costs. Leave empty if the customer pays for the materials.",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string", enum: ["m2", "m", "pcs", "flat"] },
              unit_price_eur: { type: ["number", "null"], description: "Net price per unit in euros. null if unknown." },
            },
            required: ["description", "quantity", "unit", "unit_price_eur"],
          },
        },
      },
      required: ["job_title", "customer_name", "customer_address", "labour", "items"],
    },
  },
];

async function createSession(lang) {
  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 120 },
      session: {
        type: "realtime",
        model: MODEL,
        instructions: instructions(lang),
        tools: TOOLS,
        tool_choice: "auto",
        audio: {
          input: {
            transcription: { model: "gpt-4o-mini-transcribe", language: lang === "de" ? "de" : "en" },
            turn_detection: { type: "semantic_vad" },
          },
          output: { voice: VOICE },
        },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI error ${res.status}`);
  return { value: data.value, model: MODEL };
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function serveStatic(res, pathname) {
  // Unknown paths (like /stats) get the app itself, which picks the screen
  const file = normalize(join(PUBLIC_DIR, pathname));
  if (file.startsWith(PUBLIC_DIR) && extname(file) && TYPES[extname(file)]) {
    try { return send(res, 200, await readFile(file), TYPES[extname(file)]); } catch {}
  }
  send(res, 200, await readFile(join(PUBLIC_DIR, "index.html")), TYPES[".html"]);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "POST" && url.pathname === "/api/session") {
      if (!process.env.OPENAI_API_KEY) return send(res, 500, { error: "OPENAI_API_KEY is missing. Add it to the .env file." });
      return send(res, 200, await createSession(url.searchParams.get("lang")));
    }
    if (req.method === "GET") return await serveStatic(res, url.pathname);
    send(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    send(res, 502, { error: err.message });
  }
});

server.listen(PORT, () => console.log(`Quote assistant running on http://localhost:${PORT}`));
