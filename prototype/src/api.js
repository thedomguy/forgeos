// api.js — thin fetch wrapper for the ForgeOS round-2 REST API.
//
// Base URL comes from VITE_API_URL at build time, falling back to production.
// Every request sends the httpOnly auth cookie (`credentials: 'include'`) and
// speaks JSON. Non-2xx responses throw an Error carrying the server's `error`
// message when present, so callers can surface it (inline on login, toast elsewhere).
const BASE = import.meta.env.VITE_API_URL || 'https://api.domguy.dev';

async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(BASE + path, opts);

  // 204 / empty bodies → nothing to parse
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const msg = (data && data.error) || (typeof data === 'string' && data) || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    if (data && data.details) err.details = data.details;
    throw err;
  }
  return data;
}

export const get = (path) => request('GET', path);
export const post = (path, body) => request('POST', path, body);
export const patch = (path, body) => request('PATCH', path, body);
export const del = (path) => request('DELETE', path);

export default { get, post, patch, del };
