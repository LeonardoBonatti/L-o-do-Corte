/* ============================================================
   _http.js — respostas e leitura de corpo, iguais em toda rota.
   ============================================================ */

'use strict';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function ok(res, body) { json(res, 200, body || { ok: true }); }
function badRequest(res, message) { json(res, 400, { error: message }); }
function unauthorized(res, message) { json(res, 401, { error: message || 'Faça login para continuar.' }); }
function forbidden(res, message) { json(res, 403, { error: message || 'Essa área é só do barbeiro.' }); }
function notFound(res, message) { json(res, 404, { error: message || 'Não encontrado.' }); }
function conflict(res, message) { json(res, 409, { error: message }); }

/** Erro inesperado: loga inteiro no servidor, devolve genérico ao cliente. */
function serverError(res, err) {
  console.error(err);
  json(res, 500, { error: 'Algo quebrou no servidor. Tente de novo.' });
}

/**
 * Só deixa passar os métodos listados. Devolve true quando a requisição já
 * foi respondida e a rota deve parar.
 */
function rejectMethod(req, res, allowed) {
  if (allowed.indexOf(req.method) !== -1) return false;
  res.setHeader('Allow', allowed.join(', '));
  json(res, 405, { error: 'Método não permitido.' });
  return true;
}

/** A Vercel já entrega req.body parseado quando o content-type é JSON. */
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch (_) { return {}; }
}

module.exports = {
  json, ok, badRequest, unauthorized, forbidden, notFound, conflict,
  serverError, rejectMethod, readBody
};
