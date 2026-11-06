-- ============================================================
-- Cria a conta do barbeiro à mão, pelo SQL Editor do Neon.
--
-- Use este arquivo só se NÃO for rodar o `npm run migrate` (que faz a
-- mesma coisa a partir das variáveis de ambiente). Serve para quem quer
-- subir o banco sem instalar dependência nenhuma.
--
-- COMO USAR
--   1. Gere o hash da senha, que não precisa de npm install:
--        node scripts/hash-password.mjs
--   2. Troque os dois valores abaixo.
--   3. Rode no SQL Editor, DEPOIS de schema.sql e seed.sql.
--
-- Rodar de novo só troca a senha, não duplica o usuário.
-- Nunca coloque a senha aqui — só o hash, que começa com "scrypt$".
-- ============================================================

insert into users (id, name, email, phone, password_hash, role)
values (
  'u_admin',
  'Léo',
  'TROQUE-PELO-SEU-EMAIL',          -- ex.: leo@leodocorte.com
  '19999287339',
  'TROQUE-PELO-HASH-DO-SCRIPT',     -- começa com scrypt$16384$8$1$...
  'admin'
)
on conflict (id) do update
   set email         = excluded.email,
       password_hash = excluded.password_hash,
       role          = 'admin';
