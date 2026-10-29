// Accounts: email + password sign up and log in, stored in Neon (see migrations/001_accounts.sql).
// Passwords are never stored, only a scrypt hash with its own salt.
// The browser keeps a random session token in a cookie; the database only keeps its SHA-256 hash.

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { pool } from "./db.js";

const scryptAsync = promisify(scrypt);
const SESSION_DAYS = 30;
export const COOKIE = "qc_session";

export class AccountError extends Error {}

async function hash(password, salt) {
  return (await scryptAsync(password, salt, 64)).toString("hex");
}
const tokenHash = token => createHash("sha256").update(token).digest("hex");
const publicUser = u => ({ email: u.email, name: u.name || "" });

function cleanEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 200) throw new AccountError("invalid_email");
  return e;
}
function checkPassword(password) {
  const p = String(password || "");
  if (p.length < 8 || p.length > 200) throw new AccountError("weak_password");
  return p;
}

async function newSession(userId) {
  const token = randomBytes(32).toString("hex");
  await pool.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))",
    [tokenHash(token), userId, SESSION_DAYS]
  );
  return token;
}

export async function signUp(email, password, name) {
  const n = String(name || "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!n) throw new AccountError("missing_name");
  const e = cleanEmail(email);
  const p = checkPassword(password);
  const salt = randomBytes(16).toString("hex");
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_salt, password_hash) VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING RETURNING id, name, email`,
    [n, e, salt, await hash(p, salt)]
  );
  if (!rows.length) throw new AccountError("email_taken");
  return { user: publicUser(rows[0]), token: await newSession(rows[0].id) };
}

export async function logIn(email, password) {
  const e = String(email || "").trim().toLowerCase();
  const { rows } = await pool.query("SELECT id, name, email, password_salt, password_hash FROM users WHERE email = $1", [e]);
  const user = rows[0];
  // Hash even when the user doesn't exist, so the answer takes the same time
  const h = Buffer.from(await hash(String(password || ""), user?.password_salt || "no-user"), "hex");
  if (!user || !timingSafeEqual(h, Buffer.from(user.password_hash, "hex"))) throw new AccountError("wrong_login");
  return { user: publicUser(user), token: await newSession(user.id) };
}

export async function logOut(token) {
  if (token) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash(token)]);
}

export async function userFromToken(token) {
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash(token)]
  );
  return rows[0] ? publicUser(rows[0]) : null;
}

export function sessionCookie(token, secure) {
  const parts = [`${COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${token ? SESSION_DAYS * 86400 : 0}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
