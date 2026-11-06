/* ============================================================
   _db.js — acesso ao Postgres.
   Arquivos com _ na frente não viram rota na Vercel.
   ============================================================ */

'use strict';

const crypto = require('node:crypto');
const { createPool } = require('@vercel/postgres');

let pool = null;

/** Pool preguiçoso: a conexão só abre quando a primeira query precisa dela. */
function db() {
  if (!pool) {
    if (!process.env.POSTGRES_URL) {
      throw new Error(
        'POSTGRES_URL não está definida. Crie o Postgres na Vercel e rode ' +
        '`vercel env pull .env.development.local` para testar local.'
      );
    }
    pool = createPool({ connectionString: process.env.POSTGRES_URL });
  }
  return pool;
}

/** Query simples: sql`select * from users where id = ${id}` */
function sql(strings, ...values) {
  return db().sql(strings, ...values);
}

/**
 * Executa `fn` dentro de uma transação, com rollback em qualquer erro.
 * É o que garante que um agendamento e os seus slots nasçam juntos — ou
 * nenhum dos dois.
 */
async function withTransaction(fn) {
  const client = await db().connect();
  try {
    await client.sql`begin`;
    const result = await fn(client);
    await client.sql`commit`;
    return result;
  } catch (err) {
    try { await client.sql`rollback`; } catch (_) { /* conexão já caiu */ }
    throw err;
  } finally {
    client.release();
  }
}

/** Violação de chave única/primária no Postgres. */
function isUniqueViolation(err) {
  return err && err.code === '23505';
}

/** Id curto no mesmo formato que o cliente já usava: 'ap_3f9c1a7b2e04'. */
function newId(prefix) {
  return prefix + '_' + crypto.randomBytes(6).toString('hex');
}

module.exports = { db, sql, withTransaction, isUniqueViolation, newId };
