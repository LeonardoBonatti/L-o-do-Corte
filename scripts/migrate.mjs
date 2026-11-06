/* ============================================================
   Cria as tabelas, insere os dados iniciais e garante o usuário admin.

   Uso:  vercel env pull .env.development.local
         npm run migrate

   Idempotente: pode rodar quantas vezes quiser. O admin vem de
   ADMIN_EMAIL + ADMIN_PASSWORD_HASH, então nenhuma credencial fica no
   repositório.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createPool } from '@vercel/postgres';

const root = path.resolve(import.meta.dirname, '..');

/* --- Carrega .env sem depender de dotenv --- */
function loadEnv() {
  const candidates = ['.env.development.local', '.env.local', '.env'];
  for (const name of candidates) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;

    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      let value = match[2].trim();
      if (/^(".*"|'.*')$/s.test(value)) value = value.slice(1, -1);
      if (!(match[1] in process.env)) process.env[match[1]] = value;
    }
    console.log('env carregado de ' + name);
    return;
  }
  console.log('nenhum arquivo .env encontrado — usando o ambiente atual');
}

/*
 * Divide o arquivo em statements. Vale aqui porque nem schema.sql nem
 * seed.sql têm ponto e vírgula dentro de literal de texto — se um dia
 * tiverem, este split precisa mudar.
 */
function statements(sqlText) {
  return sqlText
    .split(/;\s*$/m)
    .map((chunk) => chunk.replace(/^\s*--[^\n]*$/gm, '').trim())
    .filter((chunk) => chunk.length > 0);
}

loadEnv();

if (!process.env.POSTGRES_URL) {
  console.error('\nPOSTGRES_URL não definida. Rode `vercel env pull .env.development.local` primeiro.');
  process.exit(1);
}

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

async function runFile(relative) {
  const sqlText = fs.readFileSync(path.join(root, relative), 'utf8');
  const parts = statements(sqlText);
  console.log(`\n${relative}: ${parts.length} statement(s)`);
  for (const statement of parts) {
    await pool.query(statement);
  }
  console.log(`${relative}: ok`);
}

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const passwordHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();

  if (!email || !passwordHash) {
    console.warn(
      '\nADMIN_EMAIL ou ADMIN_PASSWORD_HASH ausentes: nenhum admin foi criado.' +
      '\nGere o hash com `npm run hash` e defina as duas variáveis.'
    );
    return;
  }
  if (!passwordHash.startsWith('scrypt$')) {
    console.error('\nADMIN_PASSWORD_HASH não parece um hash scrypt. Use `npm run hash`.');
    process.exit(1);
  }

  const existing = await pool.query('select id from users where lower(email) = $1', [email]);

  if (existing.rows[0]) {
    await pool.query(
      `update users set password_hash = $1, role = 'admin' where id = $2`,
      [passwordHash, existing.rows[0].id]
    );
    console.log(`\nadmin atualizado: ${email}`);
    return;
  }

  const id = 'u_' + crypto.randomBytes(6).toString('hex');
  await pool.query(
    `insert into users (id, name, email, phone, password_hash, role)
     values ($1, $2, $3, $4, $5, 'admin')`,
    [id, process.env.ADMIN_NAME || 'Léo', email, process.env.ADMIN_PHONE || '', passwordHash]
  );
  console.log(`\nadmin criado: ${email}`);
}

try {
  await runFile('db/schema.sql');
  await runFile('db/seed.sql');
  await ensureAdmin();
  console.log('\nmigração concluída.');
} catch (err) {
  console.error('\nfalhou:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
