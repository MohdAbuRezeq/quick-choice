/* Quote assistant: the browser side.
   The call goes straight from this page to the OpenAI Realtime API over WebRTC.
   Our server only hands out a short-lived pass, so it never sees the chat. */

/* ---------- Settings (later: a settings screen) ---------- */
const HOURLY_RATE_CENTS = 5200; // €52.00 per hour and person
const VAT_RATE = 0.19;

/* ---------- Text ---------- */
const T = {
  en: {
    greet: ["Good morning", "Good afternoon", "Good evening"],
    homeLead: "Tell me about the job. I'll ask a few short questions and write the quote for you.",
    startCall: "Start call",
    typeInstead: "No microphone? Type instead",
    recent: "Quotes from today",
    assistant: "Your office assistant",
    connecting: "Connecting", speaking: "Speaking", listening: "Listening", muted: "Muted", ended: "Call ended",
    rulerCap: "What I know so far",
    segs: ["Job", "Size", "Material", "Crew", "Days", "Customer"],
    typePh: "Type your answer", send: "Send",
    mute: "Mute", hangup: "Hang up",
    openQuote: "Open the quote",
    micBlocked: "The microphone is blocked. You can type your answers below, and the assistant still talks.",
    connectFailed: msg => `The assistant can't be reached right now. ${msg}`,
    notConnected: "The call isn't connected. Start a new call to send messages.",
    back: "Home",
    noQuote: "No quote yet. Start a call and tell the assistant about the job.",
    qNo: "Quote no.", qDate: "Date", qValid: "Valid until",
    docTitle: "Quote (Angebot)",
    intro: (name, job) => `${name ? `Dear ${name},` : "Hello,"} thank you for your enquiry. For the job "${job}" I offer the following work:`,
    thItem: "Item", thPrice: "Unit price", thSum: "Amount",
    net: "Net amount", vat: "VAT 19%", total: "Total",
    open: "open",
    openNote: "Items marked open are not in the total yet. Their prices follow.",
    docFoot: "This quote is valid for 30 days. Payment within 14 days after the work is finished. Bank: Stadtsparkasse München, IBAN DE00 0000 0000 0000 0000 00",
    savePdf: "Save as PDF", editByVoice: "Change by voice",
    voteQ: "Would you pay €39 a month for this?",
    yes: "Yes", maybe: "Maybe", no: "No",
    thanks: "Thanks, your vote is saved.",
    statsTitle: "Quote assistant, live test",
    quotesMade: "quotes made",
    votesTotal: n => `${n} votes so far`,
    updated: t => `Live, updated ${t}`,
    units: { m2: "m²", m: "m", pcs: "pcs", h: "h", flat: "flat rate" },
    labourQty: (h, p, d) => `${h} h (${p} × ${d} days)`,
    speakNow: "From now on, speak English.",
    signUp: "Sign up", logIn: "Log in", logOut: "Log out",
    yourName: "Your name", email: "Email", password: "Password", passwordHint: "At least 8 characters",
    signUpTitle: "Create your account", logInTitle: "Welcome back",
    signUpLead: "Sign up with your email to write quotes by phone call.",
    logInLead: "Log in with your email and password.",
    callLead: "Sign up or log in first, then you can start a call.",
    toLogIn: "Already have an account? Log in", toSignUp: "New here? Sign up",
    loggedInTitle: "You're logged in", loggedInAs: "Logged in as",
    errors: {
      missing_name: "Please enter your name.",
      invalid_email: "Please enter a valid email address.",
      weak_password: "The password needs at least 8 characters.",
      email_taken: "There's already an account with this email. Log in instead.",
      wrong_login: "Email or password is wrong.",
      other: "That didn't work. Please try again."
    }
  },
  de: {
    greet: ["Guten Morgen", "Guten Tag", "Guten Abend"],
    homeLead: "Erzähl mir vom Auftrag. Ich stelle ein paar kurze Fragen und schreibe das Angebot für dich.",
    startCall: "Anruf starten",
    typeInstead: "Kein Mikrofon? Lieber tippen",
    recent: "Angebote von heute",
    assistant: "Dein Büro",
    connecting: "Verbinde", speaking: "Spricht", listening: "Hört zu", muted: "Stumm", ended: "Anruf beendet",
    rulerCap: "Das weiß ich schon",
    segs: ["Arbeit", "Fläche", "Material", "Leute", "Tage", "Kunde"],
    typePh: "Antwort eintippen", send: "Senden",
    mute: "Stumm", hangup: "Auflegen",
    openQuote: "Angebot öffnen",
    micBlocked: "Das Mikrofon ist blockiert. Du kannst unten tippen, der Assistent spricht trotzdem.",
    connectFailed: msg => `Der Assistent ist gerade nicht erreichbar. ${msg}`,
    notConnected: "Der Anruf ist nicht verbunden. Starte einen neuen Anruf.",
    back: "Start",
    noQuote: "Noch kein Angebot. Starte einen Anruf und erzähl vom Auftrag.",
    qNo: "Angebot Nr.", qDate: "Datum", qValid: "Gültig bis",
    docTitle: "Angebot",
    intro: (name, job) => `${name ? `Guten Tag ${name},` : "Guten Tag,"} vielen Dank für Ihre Anfrage. Für den Auftrag „${job}“ biete ich Ihnen folgende Leistungen an:`,
    thItem: "Leistung", thPrice: "Einzelpreis", thSum: "Betrag",
    net: "Nettobetrag", vat: "MwSt. 19 %", total: "Gesamtbetrag",
    open: "offen",
    openNote: "Als offen markierte Positionen sind noch nicht im Gesamtbetrag enthalten. Die Preise folgen.",
    docFoot: "Dieses Angebot ist 30 Tage gültig. Zahlung innerhalb von 14 Tagen nach Fertigstellung. Bank: Stadtsparkasse München, IBAN DE00 0000 0000 0000 0000 00",
    savePdf: "Als PDF speichern", editByVoice: "Per Sprache ändern",
    voteQ: "Würdest du 39 € im Monat dafür zahlen?",
    yes: "Ja", maybe: "Vielleicht", no: "Nein",
    thanks: "Danke, deine Stimme ist gespeichert.",
    statsTitle: "Angebots-Assistent, Live-Test",
    quotesMade: "Angebote erstellt",
    votesTotal: n => `${n} Stimmen bisher`,
    updated: t => `Live, aktualisiert ${t}`,
    units: { m2: "m²", m: "m", pcs: "Stk.", h: "Std.", flat: "pauschal" },
    labourQty: (h, p, d) => `${h} Std. (${p} × ${d} Tage)`,
    speakNow: "Sprich ab jetzt Deutsch.",
    signUp: "Registrieren", logIn: "Anmelden", logOut: "Abmelden",
    yourName: "Dein Name", email: "E-Mail", password: "Passwort", passwordHint: "Mindestens 8 Zeichen",
    signUpTitle: "Konto erstellen", logInTitle: "Willkommen zurück",
    signUpLead: "Registriere dich mit deiner E-Mail, um Angebote per Anruf zu schreiben.",
    logInLead: "Melde dich mit E-Mail und Passwort an.",
    callLead: "Registriere dich oder melde dich an, dann kannst du anrufen.",
    toLogIn: "Schon ein Konto? Anmelden", toSignUp: "Neu hier? Registrieren",
    loggedInTitle: "Du bist angemeldet", loggedInAs: "Angemeldet als",
    errors: {
      missing_name: "Bitte gib deinen Namen ein.",
      invalid_email: "Bitte gib eine gültige E-Mail-Adresse ein.",
      weak_password: "Das Passwort braucht mindestens 8 Zeichen.",
      email_taken: "Mit dieser E-Mail gibt es schon ein Konto. Melde dich an.",
      wrong_login: "E-Mail oder Passwort ist falsch.",
      other: "Das hat nicht geklappt. Bitte versuch es noch einmal."
    }
  }
};
const FACTS = ["job", "size", "material", "crew", "days", "customer"];

/* ---------- State (memory only, nothing typed or said is saved) ---------- */
let lang = "en";
const call = {
  gen: 0, pc: null, dc: null, stream: null, audio: null,
  started: 0, tick: null, muted: false, state: "connecting",
  filled: new Set(), msgs: [], needsReply: false, forceReply: false, editQuote: false
};
let quote = null;           // the quote on screen
const recent = [];          // quotes made in this session
const stats = { quotes: 0, yes: 0, maybe: 0, no: 0 }; // TODO: save on the server
let myVote = null;
let user = null;            // { email } when logged in
let authMode = "signup";    // "signup" or "login"
let authForCall = false;    // came here by tapping the call button

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const locale = () => (lang === "de" ? "de-DE" : "en-GB");

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function money(cents) {
  return new Intl.NumberFormat(locale(), { style: "currency", currency: "EUR" }).format(cents / 100);
}
function num(n) {
  return new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(n);
}
function date(d) {
  return new Intl.DateTimeFormat(locale(), lang === "de"
    ? { day: "2-digit", month: "2-digit", year: "numeric" }
    : { day: "numeric", month: "short", year: "numeric" }).format(d);
}

/* ---------- Language ---------- */
function applyLang() {
  const t = T[lang];
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => { const v = t[el.dataset.i18n]; if (typeof v === "string") el.textContent = v; });
  $$("[data-i18n-ph]").forEach(el => el.placeholder = t[el.dataset.i18nPh]);
  $$("[data-i18n-label]").forEach(el => el.setAttribute("aria-label", t[el.dataset.i18nLabel]));
  $$("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  renderRuler(); renderTranscript(); renderQuote(); renderRecent(); renderStats(); renderAccount();
  if (myVote) $("#thanks").textContent = t.thanks;
  setCallState(call.state);
}
$$("[data-lang]").forEach(b => b.addEventListener("click", () => {
  if (lang === b.dataset.lang) return;
  lang = b.dataset.lang;
  applyLang();
  // Tell a running call to switch language too
  sendEvent({ type: "conversation.item.create", item: { type: "message", role: "system", content: [{ type: "input_text", text: T[lang].speakNow }] } });
}));

/* ---------- Routing ---------- */
const SCREENS = ["home", "call", "quote", "stats", "account"];
function current() {
  if (location.pathname.replace(/\/$/, "") === "/stats") return "stats";
  const h = location.hash.replace("#/", "");
  return SCREENS.includes(h) ? h : "home";
}
function go(name) {
  if (name === "stats") { location.href = "/stats"; return; }
  if (location.pathname !== "/") { location.href = "/#/" + name; return; }
  if (location.hash !== "#/" + name) location.hash = "/" + name;
  else show(name);
}
function show(name) {
  if (name === "call" && !user) { authForCall = true; go("account"); return; }
  if (name === "account") renderAccount();
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === "screen-" + name));
  document.body.classList.toggle("wide", name === "stats");
  if (name === "call") { if (!call.pc) startCall(); }
  else if (call.pc || call.tick) endCall();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", () => show(current()));
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]");
  if (!g) return;
  e.preventDefault();
  if (g.dataset.go === "call") call.editQuote = g.id === "edit-voice" && !!quote;
  go(g.dataset.go);
});
$("#type-instead").addEventListener("click", () => {
  call.editQuote = false;
  go("call");
  setTimeout(() => $("#typed").focus(), 50);
});

/* ---------- Call: real OpenAI Realtime over WebRTC ---------- */
function notice(text) {
  $("#notice").textContent = text || "";
  $("#notice").hidden = !text;
}
function setCallState(s) {
  call.state = s;
  const label = call.muted && s === "listening" ? "muted" : s;
  $("#call-state").textContent = T[lang][label];
  $("#voice").classList.toggle("speaking", s === "speaking");
}
function sendEvent(ev) {
  if (call.dc?.readyState === "open") { call.dc.send(JSON.stringify(ev)); return true; }
  return false;
}

async function startCall() {
  const gen = ++call.gen;
  resetCallView();
  setCallState("connecting");
  call.started = Date.now();
  call.tick = setInterval(() => {
    const s = Math.floor((Date.now() - call.started) / 1000);
    $("#timer").textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }, 500);

  try {
    // 1. Get a short-lived pass from our server
    const r = await fetch(`/api/session?lang=${lang}`, { method: "POST" });
    const session = await r.json();
    if (r.status === 401) { user = null; endCall(); go("call"); return; } // logged out meanwhile
    if (!r.ok) throw new Error(session.error || "Server error");
    if (gen !== call.gen) return;

    // 2. Set up the audio connection
    const pc = new RTCPeerConnection();
    call.pc = pc;
    call.audio = new Audio();
    call.audio.autoplay = true;
    pc.ontrack = e => { call.audio.srcObject = e.streams[0]; };
    try {
      call.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (gen !== call.gen) { call.stream.getTracks().forEach(t => t.stop()); return; }
      pc.addTrack(call.stream.getAudioTracks()[0], call.stream);
    } catch {
      // No microphone: still hear the assistant, answer by typing
      pc.addTransceiver("audio", { direction: "recvonly" });
      notice(T[lang].micBlocked);
    }

    // 3. Events (transcripts, tool calls) go over a data channel
    const dc = pc.createDataChannel("oai-events");
    call.dc = dc;
    dc.addEventListener("message", e => handleEvent(JSON.parse(e.data)));
    dc.addEventListener("open", () => {
      if (call.editQuote && quote) {
        sendEvent({ type: "conversation.item.create", item: { type: "message", role: "system", content: [{ type: "input_text",
          text: `The Handwerker wants to change this existing quote. Ask what to change, then call finish_quote again with the full updated quote. Current quote: ${JSON.stringify(quote.source)}` }] } });
      }
      setCallState("listening");
      sendEvent({ type: "response.create" }); // the assistant says hello first
    });

    // 4. Connect straight to OpenAI with the pass
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const sdp = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      body: offer.sdp,
      headers: { Authorization: `Bearer ${session.value}`, "Content-Type": "application/sdp" }
    });
    if (!sdp.ok) throw new Error(`OpenAI ${sdp.status}: ${await sdp.text()}`);
    if (gen !== call.gen) return;
    await pc.setRemoteDescription({ type: "answer", sdp: await sdp.text() });
  } catch (err) {
    if (gen !== call.gen) return;
    console.error(err);
    closeConnection();
    setCallState("ended");
    notice(T[lang].connectFailed(err.message));
  }
}

function closeConnection() {
  clearInterval(call.tick); call.tick = null;
  call.stream?.getTracks().forEach(t => t.stop());
  call.dc?.close();
  call.pc?.close();
  if (call.audio) call.audio.srcObject = null;
  Object.assign(call, { pc: null, dc: null, stream: null, audio: null });
}
function endCall() {
  call.gen++; // cancels a call that is still connecting
  closeConnection();
  setCallState("ended");
}
function resetCallView() {
  closeConnection();
  Object.assign(call, { muted: false, filled: new Set(), msgs: [], needsReply: false, forceReply: false });
  if (call.editQuote) FACTS.forEach((_, i) => call.filled.add(i));
  $("#mute").setAttribute("aria-pressed", "false");
  $("#timer").textContent = "00:00";
  $("#call-foot").classList.remove("done");
  notice("");
  renderTranscript(); renderRuler();
}

function msg(id, who) {
  let m = call.msgs.find(x => x.id === id);
  if (!m) { m = { id, who, text: "" }; call.msgs.push(m); }
  return m;
}
function handleEvent(e) {
  switch (e.type) {
    case "input_audio_buffer.speech_started":
      setCallState("listening");
      break;
    case "input_audio_buffer.committed":
      msg(e.item_id, "u").text ||= "…";
      renderTranscript();
      break;
    case "conversation.item.input_audio_transcription.completed": {
      const m = msg(e.item_id, "u");
      m.text = (e.transcript || "").trim();
      if (!m.text) call.msgs = call.msgs.filter(x => x !== m);
      renderTranscript();
      break;
    }
    case "response.output_audio_transcript.delta":
      msg(e.item_id, "a").text += e.delta;
      renderTranscript();
      break;
    case "response.output_audio_transcript.done":
      msg(e.item_id, "a").text = e.transcript;
      renderTranscript();
      break;
    case "output_audio_buffer.started":
      setCallState("speaking");
      break;
    case "output_audio_buffer.stopped":
    case "output_audio_buffer.cleared":
      setCallState("listening");
      break;
    case "response.function_call_arguments.done":
      handleTool(e.name, e.call_id, e.arguments);
      break;
    case "response.done": {
      // After a tool call the model needs a nudge to keep talking
      const spoke = (e.response?.output || []).some(o => o.type === "message");
      if (call.forceReply || (call.needsReply && !spoke)) sendEvent({ type: "response.create" });
      call.needsReply = call.forceReply = false;
      break;
    }
    case "error":
      console.error("Realtime error", e.error);
      break;
  }
}

function handleTool(name, callId, rawArgs) {
  let args = {};
  try { args = JSON.parse(rawArgs || "{}"); } catch {}
  let output = { ok: true };
  if (name === "update_progress") {
    call.filled = new Set((args.known || []).map(f => FACTS.indexOf(f)).filter(i => i >= 0));
    renderRuler();
  } else if (name === "finish_quote") {
    quote = buildQuote(args);
    const i = recent.findIndex(q => q.no === quote.no);
    if (i >= 0) recent[i] = quote; else { recent.unshift(quote); stats.quotes++; }
    FACTS.forEach((_, i) => call.filled.add(i));
    renderRuler(); renderQuote(); renderRecent(); renderStats();
    $("#call-foot").classList.add("done");
    output = { ok: true, message: "The quote is on the screen now. The app calculated all prices." };
    call.forceReply = true;
  } else {
    output = { ok: false, error: "Unknown tool" };
  }
  sendEvent({ type: "conversation.item.create", item: { type: "function_call_output", call_id: callId, output: JSON.stringify(output) } });
  call.needsReply = true;
}

$("#typebox").addEventListener("submit", e => {
  e.preventDefault();
  const text = $("#typed").value.trim();
  if (!text) return;
  const sent = sendEvent({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } });
  if (!sent) { notice(T[lang].notConnected); return; }
  sendEvent({ type: "response.create" });
  call.msgs.push({ id: "typed-" + Date.now(), who: "u", text, typed: true });
  $("#typed").value = "";
  renderTranscript();
});
$("#mute").addEventListener("click", () => {
  call.muted = !call.muted;
  call.stream?.getAudioTracks().forEach(t => { t.enabled = !call.muted; });
  $("#mute").setAttribute("aria-pressed", String(call.muted));
  setCallState(call.state);
});
$("#hangup").addEventListener("click", () => { endCall(); go("home"); });

function renderRuler() {
  const segs = T[lang].segs;
  $("#ruler").innerHTML = segs.map((s, i) => `<div class="seg${call.filled.has(i) ? " filled" : ""}">${s}</div>`).join("");
  $("#ruler-count").textContent = `${call.filled.size} / ${segs.length}`;
}
function renderTranscript() {
  const box = $("#transcript");
  box.innerHTML = call.msgs.map(m => `<div class="msg ${m.who}${m.typed ? " typed" : ""}">${escapeHtml(m.text)}</div>`).join("");
  box.scrollTop = box.scrollHeight;
}

/* ---------- Quote: the AI only gives facts, this code does every sum ---------- */
function toNumber(v) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; }

function buildQuote(args) {
  const lines = [];
  const lab = args.labour || {};
  const people = toNumber(lab.people), days = toNumber(lab.days);
  const perDay = toNumber(lab.hours_per_day) || 8;
  const hours = people * days * perDay;
  if (hours > 0) {
    lines.push({ description: lab.description || "", qty: hours, unit: "h", price: HOURLY_RATE_CENTS, labour: { people, days } });
  }
  for (const it of args.items || []) {
    const qty = toNumber(it.quantity);
    if (!qty || !it.description) continue;
    const p = it.unit_price_eur;
    const price = p === null || p === undefined || p === "" || !Number.isFinite(Number(p)) || Number(p) < 0
      ? null : Math.round(Number(p) * 100);
    lines.push({ description: it.description, qty, unit: ["m2", "m", "pcs", "flat"].includes(it.unit) ? it.unit : "pcs", price });
  }
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  return {
    no: quote && call.editQuote ? quote.no : `${now.getFullYear()}-${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`,
    date: now,
    title: args.job_title || "",
    customer: args.customer_name || "",
    address: args.customer_address || "",
    lines,
    source: args
  };
}
function totals(q) {
  let net = 0;
  for (const l of q.lines) if (l.price != null) net += Math.round(l.qty * l.price);
  const vat = Math.round(net * VAT_RATE);
  return { net, vat, total: net + vat, open: q.lines.some(l => l.price == null) };
}

function renderQuote() {
  $("#quote-empty").hidden = !!quote;
  $("#quote-content").hidden = !quote;
  if (!quote) return;
  const t = T[lang];
  const valid = new Date(quote.date); valid.setDate(valid.getDate() + 30);
  $("#q-no").textContent = quote.no;
  $("#q-date").textContent = date(quote.date);
  $("#q-valid").textContent = date(valid);
  $("#q-to").innerHTML = [quote.customer, ...quote.address.split(",")].map(s => escapeHtml(s.trim())).filter(Boolean).join("<br>");
  $("#q-intro").textContent = t.intro(quote.customer, quote.title);
  $("#items").innerHTML = quote.lines.map(l => {
    const qty = l.labour ? t.labourQty(num(l.qty), num(l.labour.people), num(l.labour.days))
      : l.unit === "flat" ? t.units.flat : `${num(l.qty)} ${t.units[l.unit]}`;
    const open = `<span class="open-price">${t.open}</span>`;
    const price = l.price == null ? open : money(l.price);
    const sum = l.price == null ? open : money(Math.round(l.qty * l.price));
    return `<tr><td>${escapeHtml(l.description)}<span class="qty">${qty}</span></td><td class="num">${price}</td><td class="num">${sum}</td></tr>`;
  }).join("");
  const s = totals(quote);
  $("#t-net").textContent = money(s.net);
  $("#t-vat").textContent = money(s.vat);
  $("#t-total").textContent = money(s.total);
  $("#q-note").hidden = !s.open;
}
$("#pdf").addEventListener("click", () => window.print());

function renderRecent() {
  $("#recent").hidden = !recent.length;
  $("#recent-list").innerHTML = recent.map((q, i) =>
    `<li data-recent="${i}" style="cursor:pointer"><div><div>${escapeHtml(q.title)}</div><div class="who">${escapeHtml(q.customer)}</div></div><div class="amt">${money(totals(q).total)}</div></li>`
  ).join("");
}
$("#recent-list").addEventListener("click", e => {
  const li = e.target.closest("[data-recent]");
  if (li) { quote = recent[+li.dataset.recent]; renderQuote(); go("quote"); }
});

/* ---------- Account ---------- */
function renderAccount() {
  const t = T[lang];
  const btn = $("#account-btn");
  btn.textContent = user ? user.email : t.signUp;
  btn.classList.toggle("logged-in", !!user);
  $("#login-btn").hidden = !!user;
  const hour = new Date().getHours();
  const greet = t.greet[hour < 12 ? 0 : hour < 18 ? 1 : 2];
  $("#home-title").textContent = user?.name ? `${greet}, ${user.name}.` : `${greet}.`;
  $("#auth-form").hidden = !!user;
  $("#auth-done").hidden = !user;
  if (user) { $("#auth-email-shown").textContent = user.email; return; }
  const signup = authMode === "signup";
  $("#auth-title").textContent = signup ? t.signUpTitle : t.logInTitle;
  $("#auth-lead").textContent = authForCall ? t.callLead : signup ? t.signUpLead : t.logInLead;
  $("#auth-submit").textContent = signup ? t.signUp : t.logIn;
  $("#auth-switch").textContent = signup ? t.toLogIn : t.toSignUp;
  $("#auth-password").autocomplete = signup ? "new-password" : "current-password";
  $("#name-field").hidden = !signup;
  $("#auth-password").closest(".field").querySelector("small").hidden = !signup;
}
function authError(code) {
  const e = T[lang].errors;
  $("#auth-error").textContent = code ? e[code] || e.other : "";
  $("#auth-error").hidden = !code;
}
$("#auth-switch").addEventListener("click", () => {
  authMode = authMode === "signup" ? "login" : "signup";
  authError(null);
  renderAccount();
});
$("#auth-form").addEventListener("submit", async e => {
  e.preventDefault();
  authError(null);
  $("#auth-submit").disabled = true;
  try {
    const r = await fetch(`/api/${authMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: $("#auth-name").value, email: $("#auth-email").value, password: $("#auth-password").value })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { authError(data.error || "other"); return; }
    user = data.user;
    $("#auth-password").value = "";
    renderAccount();
    if (authForCall) { authForCall = false; go("call"); }
  } catch {
    authError("other");
  } finally {
    $("#auth-submit").disabled = false;
  }
});
$("#logout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" }).catch(() => {});
  user = null;
  authMode = "login";
  renderAccount();
  go("home");
});
$("#account-btn").addEventListener("click", () => { authForCall = false; if (!user) authMode = "signup"; authError(null); });
$("#login-btn").addEventListener("click", () => { authForCall = false; authMode = "login"; authError(null); });

/* ---------- Vote ---------- */
$$("[data-vote]").forEach(b => b.addEventListener("click", () => {
  const v = b.dataset.vote;
  if (myVote === v) return;
  if (myVote) stats[myVote]--;
  stats[v]++; myVote = v;
  $$("[data-vote]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  $("#thanks").textContent = T[lang].thanks;
  renderStats();
}));

/* ---------- Stats ---------- */
function renderStats() {
  const t = T[lang];
  const total = stats.yes + stats.maybe + stats.no;
  $("#s-quotes").textContent = stats.quotes;
  ["yes", "maybe", "no"].forEach(k => {
    const row = $(".bar-row." + k);
    const pct = total ? Math.round(stats[k] / total * 100) : 0;
    row.querySelector(".bar-fill").style.width = pct + "%";
    row.querySelector(".bn").innerHTML = `${stats[k]}<small>${pct}%</small>`;
  });
  $("#s-votes").textContent = t.votesTotal(total);
  $("#live").textContent = t.updated(new Date().toLocaleTimeString(locale()));
}
setInterval(renderStats, 5000);

applyLang();
fetch("/api/me").then(r => r.json()).then(d => { user = d.user; }).catch(() => {}).finally(() => {
  renderAccount();
  show(current());
});
